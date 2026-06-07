from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from datetime import datetime
from typing import List, Dict

from app.core.database import get_database
from app.models.schemas import ChatMessage, ChatResponse
from app.services.ai_service import ai_service

router = APIRouter()

@router.post("/{chat_id}", response_model=ChatResponse)
async def send_chat_message(
    chat_id: str,
    message: ChatMessage,
    db=Depends(get_database)
):
    """Send a message to the screening chat and get a response."""
    
    if not ObjectId.is_valid(chat_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid chat ID"
        )
    
    # Get chat session
    chat_doc = await db.chats.find_one({"_id": ObjectId(chat_id)})
    if not chat_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    # Get job posting for context
    job_doc = await db.job_postings.find_one({"_id": chat_doc["jobPostingId"]})
    if not job_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated job posting not found"
        )
    
    # Add user message to conversation
    user_message = {
        "role": "user",
        "content": message.message,
        "timestamp": datetime.utcnow()
    }
    
    # Get conversation history
    conversation_history = chat_doc.get("messages", [])
    conversation_history.append(user_message)
    
    # Generate AI response
    job_context = f"Job Title: {job_doc['title']}\nDepartment: {job_doc['department']}\nDescription: {job_doc['description']}"
    
    try:
        ai_response = await ai_service.generate_chat_response(
            conversation_history,
            job_context
        )
    except Exception as e:
        # Fallback response if AI fails
        ai_response = "Thank you for your response. Could you tell me more about your relevant experience for this position?"
    
    # Add AI response to conversation
    assistant_message = {
        "role": "assistant",
        "content": ai_response,
        "timestamp": datetime.utcnow()
    }
    conversation_history.append(assistant_message)
    
    # Update chat session in database
    await db.chats.update_one(
        {"_id": ObjectId(chat_id)},
        {
            "$set": {
                "messages": conversation_history,
                "lastActivity": datetime.utcnow()
            }
        }
    )
    
    return ChatResponse(reply=ai_response)

@router.get("/{chat_id}/messages")
async def get_chat_messages(
    chat_id: str,
    db=Depends(get_database)
):
    """Get all messages from a chat session."""
    
    if not ObjectId.is_valid(chat_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid chat ID"
        )
    
    chat_doc = await db.chats.find_one({"_id": ObjectId(chat_id)})
    if not chat_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )

    # Include candidate and job context so frontend can render session metadata
    candidate_id = str(chat_doc.get("candidateId")) if chat_doc.get("candidateId") else None
    job_posting_id = str(chat_doc.get("jobPostingId")) if chat_doc.get("jobPostingId") else None

    return {
        "chat_id": chat_id,
        "candidate_id": candidate_id,
        "job_posting_id": job_posting_id,
        "messages": chat_doc.get("messages", []),
        "status": chat_doc.get("status", "active"),
        "created_at": chat_doc.get("createdAt")
    }

@router.post("/{chat_id}/end")
async def end_chat_session(
    chat_id: str,
    db=Depends(get_database)
):
    """End a chat session and generate summary."""
    
    if not ObjectId.is_valid(chat_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid chat ID"
        )
    
    # Get chat session
    chat_doc = await db.chats.find_one({"_id": ObjectId(chat_id)})
    if not chat_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    # Get candidate
    candidate_doc = await db.candidates.find_one({"_id": chat_doc["candidateId"]})
    if not candidate_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated candidate not found"
        )
    
    # Generate interview summary
    conversation_text = ""
    messages = chat_doc.get("messages", [])
    
    for msg in messages:
        role = msg.get("role", "unknown")
        content = msg.get("content", "")
        conversation_text += f"{role.capitalize()}: {content}\n\n"
    
    # Generate summary using AI (simplified version)
    try:
        summary_prompt = f"""
        Please provide a concise summary of this screening interview conversation. 
        Focus on the candidate's relevant experience, skills, and overall fit for the role.
        
        Conversation:
        {conversation_text}
        
        Provide a 2-3 sentence summary:
        """
        
        summary = await ai_service.generate_gemini_text(summary_prompt)
        if summary:
            interview_summary = summary
        else:
            interview_summary = "Interview completed. Candidate provided responses to screening questions."
    
    except Exception:
        interview_summary = "Interview completed. Manual review recommended."
    
    # Update candidate with interview summary
    await db.candidates.update_one(
        {"_id": chat_doc["candidateId"]},
        {
            "$set": {
                "interviewSummary": interview_summary,
                "status": "screening"
            }
        }
    )
    
    # Mark chat as completed
    await db.chats.update_one(
        {"_id": ObjectId(chat_id)},
        {
            "$set": {
                "status": "completed",
                "endedAt": datetime.utcnow(),
                "summary": interview_summary
            }
        }
    )
    
    return {
        "message": "Chat session ended successfully",
        "summary": interview_summary
    }