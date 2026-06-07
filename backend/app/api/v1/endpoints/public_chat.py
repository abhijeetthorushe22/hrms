from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from datetime import datetime
from typing import List, Dict, Optional
import time
from collections import defaultdict

from app.core.database import get_database
from app.models.schemas import ChatMessage, ChatResponse
from app.services.ai_service import ai_service

router = APIRouter()

# Simple rate limiting (in production, use Redis or proper rate limiting)
rate_limits = defaultdict(list)
MAX_REQUESTS_PER_MINUTE = 10

def check_rate_limit(token: str) -> bool:
    """Simple rate limiting check."""
    now = time.time()
    minute_ago = now - 60
    
    # Clean old requests
    rate_limits[token] = [req_time for req_time in rate_limits[token] if req_time > minute_ago]
    
    # Check if under limit
    if len(rate_limits[token]) >= MAX_REQUESTS_PER_MINUTE:
        return False
    
    # Add current request
    rate_limits[token].append(now)
    return True

@router.get("/{token}")
async def get_public_chat(
    token: str,
    db=Depends(get_database)
):
    """Get chat session and messages for a candidate using their token."""
    
    # Find chat by token
    chat_doc = await db.chats.find_one({"candidateToken": token})
    if not chat_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found. Please check your link."
        )
    
    # Check token expiry
    if chat_doc.get("tokenExpiresAt") and chat_doc["tokenExpiresAt"] < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This chat link has expired. Please contact the recruiting team for assistance."
        )
    
    # Format messages for display
    messages = []
    for msg in chat_doc.get("messages", []):
        messages.append({
            "role": msg.get("role"),
            "content": msg.get("content"),
            "timestamp": msg.get("timestamp").isoformat() if msg.get("timestamp") else None
        })
    
    # Determine if chat is still active
    is_active = chat_doc.get("status") not in ["completed", "expired"]
    
    return {
        "chatId": str(chat_doc["_id"]),
        "candidateName": chat_doc.get("candidateName"),
        "jobTitle": chat_doc.get("jobTitle"),
        "companyName": chat_doc.get("companyName", "AuraHR"),
        "messages": messages,
        "status": chat_doc.get("status"),
        "isActive": is_active,
        "expiresAt": chat_doc.get("tokenExpiresAt").isoformat() if chat_doc.get("tokenExpiresAt") else None,
        "instructions": "Please answer the questions honestly and to the best of your ability. This conversation helps us understand your background and fit for the role."
    }

@router.post("/{token}")
async def send_public_message(
    token: str,
    message: ChatMessage,
    db=Depends(get_database)
):
    """Send a message from candidate to AI screening chat."""
    
    # Rate limiting check
    if not check_rate_limit(token):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please wait a moment before sending another message."
        )
    
    # Find chat by token
    chat_doc = await db.chats.find_one({"candidateToken": token})
    if not chat_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found."
        )
    
    # Check token expiry
    if chat_doc.get("tokenExpiresAt") and chat_doc["tokenExpiresAt"] < datetime.utcnow():
        # Mark as expired
        await db.chats.update_one(
            {"_id": chat_doc["_id"]},
            {"$set": {"status": "expired"}}
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This chat session has expired."
        )
    
    # Check if chat is still active
    if chat_doc.get("status") in ["completed", "expired"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This chat session has already been completed."
        )
    
    # Validate message length
    if len(message.message.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty."
        )
    
    if len(message.message) > 2000:  # Reasonable limit
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message is too long. Please keep responses under 2000 characters."
        )
    
    # Get job posting for context
    job_doc = await db.job_postings.find_one({"_id": chat_doc["jobPostingId"]})
    if not job_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated job posting not found."
        )
    
    # Add user message to conversation
    user_message = {
        "role": "user",
        "content": message.message.strip(),
        "timestamp": datetime.utcnow()
    }
    
    # Get conversation history
    conversation_history = chat_doc.get("messages", [])
    conversation_history.append(user_message)
    
    # Update status to in_progress if this is first candidate response
    current_status = chat_doc.get("status")
    new_status = current_status
    screening_data_updates = {}
    
    if current_status == "pending_candidate_response":
        new_status = "in_progress"
        screening_data_updates["firstResponseAt"] = datetime.utcnow()
    
    # Generate AI response with enhanced context
    job_context = f"""Job Title: {job_doc['title']}
Department: {job_doc['department']}
Location: {job_doc.get('location', 'Not specified')}
Description: {job_doc['description']}
Requirements: {', '.join(job_doc.get('requirements', []))}

Candidate: {chat_doc.get('candidateName')}
Screening Status: This is an AI-powered initial screening conversation."""
    
    try:
        ai_response = await ai_service.generate_screening_response(
            conversation_history,
            job_context,
            chat_doc.get("screeningData", {})
        )
        
        # Check if AI indicates screening should end
        if ai_service.should_end_screening(conversation_history, ai_response):
            new_status = "completed"
            screening_data_updates["completedAt"] = datetime.utcnow()
            
            # Add completion message
            ai_response += "\n\n✅ **Screening Complete!**\n\nThank you for taking the time to complete this screening. Our recruiting team will review your responses and be in touch with next steps soon.\n\nYou can now close this window."
    
    except Exception as e:
        print(f"AI service error: {e}")
        # Fallback response
        ai_response = "Thank you for your response. Could you tell me more about your experience with the key requirements for this role?"
    
    # Add AI response to conversation
    assistant_message = {
        "role": "assistant",
        "content": ai_response,
        "timestamp": datetime.utcnow()
    }
    conversation_history.append(assistant_message)
    
    # Update screening data
    questions_asked = chat_doc.get("screeningData", {}).get("questionsAsked", 0) + 1
    responses = chat_doc.get("screeningData", {}).get("responses", [])
    responses.append({
        "question": conversation_history[-3]["content"] if len(conversation_history) >= 3 else "Initial question",
        "answer": message.message.strip(),
        "timestamp": datetime.utcnow()
    })
    
    screening_data_updates.update({
        "questionsAsked": questions_asked,
        "responses": responses
    })
    
    # Update chat session in database
    update_doc = {
        "messages": conversation_history,
        "status": new_status,
        "lastActivity": datetime.utcnow()
    }
    
    # Add screening data updates
    for key, value in screening_data_updates.items():
        update_doc[f"screeningData.{key}"] = value
    
    await db.chats.update_one(
        {"_id": chat_doc["_id"]},
        {"$set": update_doc}
    )
    
    # If completed, update candidate status
    if new_status == "completed":
        await db.candidates.update_one(
            {"_id": chat_doc["candidateId"]},
            {
                "$set": {
                    "status": "screening",  # Completed initial screening
                    "lastActivity": datetime.utcnow()
                }
            }
        )
    
    return {
        "reply": ai_response,
        "status": new_status,
        "isCompleted": new_status == "completed",
        "questionsAsked": questions_asked,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/{token}/status")
async def get_chat_status(
    token: str,
    db=Depends(get_database)
):
    """Get current status of the chat session."""
    
    chat_doc = await db.chats.find_one({"candidateToken": token})
    if not chat_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found."
        )
    
    return {
        "status": chat_doc.get("status"),
        "isActive": chat_doc.get("status") not in ["completed", "expired"],
        "expiresAt": chat_doc.get("tokenExpiresAt").isoformat() if chat_doc.get("tokenExpiresAt") else None,
        "messageCount": len(chat_doc.get("messages", [])),
        "lastActivity": chat_doc.get("lastActivity").isoformat() if chat_doc.get("lastActivity") else None
    }