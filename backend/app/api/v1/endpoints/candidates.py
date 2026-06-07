from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import List, Optional
from bson import ObjectId
from datetime import datetime, timedelta
import secrets

from app.core.database import get_database
from app.core.security import manager_or_admin, recruiter_or_admin, require_roles
from app.models.schemas import Candidate, CandidateStatus

router = APIRouter()

@router.get("", response_model=List[Candidate])
async def get_candidates(
    job_id: Optional[str] = None,
    token_data: dict = Depends(require_roles(["admin", "manager", "recruiter", "employee"])),
    db=Depends(get_database)
):
    """Get all candidates, optionally filtered by job_id."""
    
    # Restrict data based on user role
    user_role = token_data.get("role")
    
    # Employees can only see limited candidate info
    if user_role == "employee":
        # Return empty list for employees or limit to basic info
        return []
    
    # Build query filter
    query_filter = {}
    if job_id:
        if ObjectId.is_valid(job_id):
            query_filter["jobPostingId"] = ObjectId(job_id)
        else:
            # If invalid ObjectId, return empty list
            return []
    
    candidates_cursor = db.candidates.find(query_filter)
    candidates = []
    async for candidate_doc in candidates_cursor:
        try:
            # Convert ObjectIds to strings
            candidate_doc["_id"] = str(candidate_doc["_id"])
            
            # Handle jobPostingId field mapping
            if candidate_doc.get("jobPostingId"):
                candidate_doc["job_posting_id"] = str(candidate_doc["jobPostingId"])
                del candidate_doc["jobPostingId"]
            elif candidate_doc.get("job_posting_id"):
                candidate_doc["job_posting_id"] = str(candidate_doc["job_posting_id"])
            
            # Handle empty email addresses
            if not candidate_doc.get("email") or candidate_doc["email"] == "":
                candidate_doc["email"] = f"candidate_{candidate_doc['_id']}@placeholder.com"
            
            # Normalize status values for backward compatibility
            status = candidate_doc.get("status", "new")
            if status == "interviewing":
                candidate_doc["status"] = "interview"
            elif status == "offered":
                candidate_doc["status"] = "hired"  # Map offered to hired
            
            candidates.append(Candidate(**candidate_doc))
        except Exception as e:
            print(f"Error processing candidate {candidate_doc.get('_id')}: {e}")
            # Skip invalid candidates instead of failing the entire request
            continue
    return candidates

@router.get("/{candidate_id}", response_model=Candidate)
async def get_candidate(
    candidate_id: str,
    token_data: dict = Depends(require_roles(["admin", "manager", "recruiter"])),
    db=Depends(get_database)
):
    """Get a specific candidate by ID."""
    
    if not ObjectId.is_valid(candidate_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid candidate ID"
        )
    
    candidate_doc = await db.candidates.find_one({"_id": ObjectId(candidate_id)})
    if not candidate_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    # Convert ObjectIds to strings
    candidate_doc["_id"] = str(candidate_doc["_id"])
    
    # Handle jobPostingId field mapping
    if candidate_doc.get("jobPostingId"):
        candidate_doc["job_posting_id"] = str(candidate_doc["jobPostingId"])
        del candidate_doc["jobPostingId"]
    elif candidate_doc.get("job_posting_id"):
        candidate_doc["job_posting_id"] = str(candidate_doc["job_posting_id"])
    
    # Handle empty email addresses
    if not candidate_doc.get("email") or candidate_doc["email"] == "":
        candidate_doc["email"] = f"candidate_{candidate_doc['_id']}@placeholder.com"
    
    # Normalize status values for backward compatibility
    status = candidate_doc.get("status", "new")
    if status == "interviewing":
        candidate_doc["status"] = "interview"
    elif status == "offered":
        candidate_doc["status"] = "hired"
    
    return Candidate(**candidate_doc)

@router.patch("/{candidate_id}/status")
async def update_candidate_status(
    candidate_id: str,
    new_status: CandidateStatus = Body(..., embed=True),
    token_data: dict = Depends(require_roles(["admin", "manager", "recruiter"])),
    db=Depends(get_database)
):
    """Update candidate status."""
    
    if not ObjectId.is_valid(candidate_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid candidate ID"
        )
    
    result = await db.candidates.update_one(
        {"_id": ObjectId(candidate_id)},
        {"$set": {"status": new_status.value}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    return {"message": f"Candidate status updated to {new_status.value}"}

@router.get("/{candidate_id}/resume-text")
async def get_candidate_resume_text(
    candidate_id: str,
    token_data: dict = Depends(require_roles(["admin", "manager", "recruiter"])),
    db=Depends(get_database)
):
    """Get the extracted text from candidate's resume."""
    
    if not ObjectId.is_valid(candidate_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid candidate ID"
        )
    
    candidate_doc = await db.candidates.find_one({"_id": ObjectId(candidate_id)})
    if not candidate_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    return {
        "candidate_id": candidate_id,
        "name": candidate_doc.get("name", ""),
        "resume_text": candidate_doc.get("extractedText", "Resume text not available"),
        "extracted_text": candidate_doc.get("extractedText", ""),
        "match_score": candidate_doc.get("matchScore", 0.0)
    }

@router.get("/{candidate_id}/resume-file")
async def get_candidate_resume_file(
    candidate_id: str,
    token_data: dict = Depends(require_roles(["admin", "manager", "recruiter"])),
    db=Depends(get_database)
):
    """Get the original resume file for a candidate."""
    from fastapi.responses import FileResponse
    from app.core.config import settings
    import os
    
    if not ObjectId.is_valid(candidate_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid candidate ID"
        )
    
    candidate_doc = await db.candidates.find_one({"_id": ObjectId(candidate_id)})
    if not candidate_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    resume_s3_key = candidate_doc.get("resumeS3Key")
    if not resume_s3_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume file not found"
        )
    
    # Construct file path
    file_path = os.path.join(settings.UPLOAD_DIR, resume_s3_key)
    
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume file not found on disk"
        )
    
    # Determine content type based on file extension
    file_extension = os.path.splitext(resume_s3_key)[1].lower()
    if file_extension == '.pdf':
        media_type = 'application/pdf'
    elif file_extension == '.txt':
        media_type = 'text/plain'
    elif file_extension in ['.doc', '.docx']:
        media_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    else:
        media_type = 'application/octet-stream'
    
    # Return the file
    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=f"{candidate_doc.get('name', 'candidate').replace(' ', '_')}_resume{file_extension}"
    )

@router.post("/{candidate_id}/start-chat")
async def start_candidate_chat(
    candidate_id: str,
    db=Depends(get_database)
):
    """Initiate a screening conversation with a candidate."""
    
    if not ObjectId.is_valid(candidate_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid candidate ID"
        )
    
    # Get candidate data
    candidate_doc = await db.candidates.find_one({"_id": ObjectId(candidate_id)})
    if not candidate_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    # Get job posting data
    job_doc = await db.job_postings.find_one({"_id": candidate_doc["jobPostingId"]})
    if not job_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated job posting not found"
        )
    
    # Create a chat session ID
    chat_id = str(ObjectId())
    
    # Generate first message
    first_message = f"""Hello {candidate_doc.get('name', 'there')}! 

Thank you for your interest in the {job_doc['title']} position at our company. I'm an AI recruiter here to conduct an initial screening conversation with you.

This is a brief informal chat to learn more about your background and experience. Please feel free to answer naturally - there are no right or wrong answers.

Let's start: Can you tell me a bit about yourself and what drew you to apply for this {job_doc['title']} role?"""
    
    # Store chat session (in a real implementation, you might want a separate chats collection)
    chat_doc = {
        "_id": ObjectId(chat_id),
        "candidateId": ObjectId(candidate_id),
        "jobPostingId": candidate_doc["jobPostingId"],
        "messages": [
            {
                "role": "assistant",
                "content": first_message,
                "timestamp": datetime.utcnow()
            }
        ],
        "status": "active",
        "createdAt": datetime.utcnow()
    }
    
    # Insert chat session
    await db.chats.insert_one(chat_doc)
    
    return {
        "chatId": chat_id,
        "firstMessage": first_message
    }

@router.post("/{candidate_id}/start-screening")
async def start_candidate_screening(
    candidate_id: str,
    token_data: dict = Depends(require_roles(["admin", "manager", "recruiter"])),
    db=Depends(get_database)
):
    """Start AI-powered screening for a candidate."""
    
    if not ObjectId.is_valid(candidate_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid candidate ID"
        )
    
    # Get candidate data
    candidate_doc = await db.candidates.find_one({"_id": ObjectId(candidate_id)})
    if not candidate_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    # Get job posting data
    job_doc = await db.job_postings.find_one({"_id": candidate_doc["jobPostingId"]})
    if not job_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated job posting not found"
        )
    
    # Create a chat session ID for screening
    chat_id = str(ObjectId())
    candidate_token = secrets.token_urlsafe(32)
    token_expires_at = datetime.utcnow() + timedelta(days=7)
    
    # Generate AI screening first message
    first_message = f"""🤖 AI Screening Started for {candidate_doc.get('name', 'Candidate')}

Position: {job_doc['title']}
Screening Type: Technical & Cultural Fit Assessment

I'm conducting an automated screening to evaluate your qualifications for this role. This conversation will assess:
• Technical skills and experience
• Cultural alignment with our values  
• Communication abilities
• Problem-solving approach

Let's begin with a few questions. Please answer thoughtfully as your responses will be analyzed for role suitability.

First question: Can you walk me through your most relevant professional experience for this {job_doc['title']} position?"""
    
    # Store screening chat session
    screening_doc = {
        "_id": ObjectId(chat_id),
        "candidateId": ObjectId(candidate_id),
        "jobPostingId": candidate_doc["jobPostingId"],
        "type": "ai_screening",
        "candidateToken": candidate_token,
        "tokenExpiresAt": token_expires_at,
        "candidateName": candidate_doc.get("name", "Candidate"),
        "jobTitle": job_doc.get("title", ""),
        "companyName": "AuraHR",
        "messages": [
            {
                "role": "assistant", 
                "content": first_message,
                "timestamp": datetime.utcnow()
            }
        ],
        "status": "pending_candidate_response",
        "screeningData": {
            "startedAt": datetime.utcnow(),
            "questionsAsked": 0,
            "responses": [],
            "aiAnalysis": None
        },
        "createdAt": datetime.utcnow()
    }
    
    # Insert screening session
    await db.chats.insert_one(screening_doc)
    
    # Update candidate status to indicate screening in progress
    await db.candidates.update_one(
        {"_id": ObjectId(candidate_id)},
        {"$set": {"status": "screening", "lastActivity": datetime.utcnow()}}
    )
    
    candidate_link = f"/public-chat/{candidate_token}"

    return {
        "chatId": chat_id,
        "firstMessage": first_message,
        "candidateToken": candidate_token,
        "candidateLink": candidate_link,
        "message": f"AI screening started for {candidate_doc.get('name')}"
    }

@router.get("/{candidate_id}/ai-score")
async def get_candidate_ai_score(
    candidate_id: str,
    token_data: dict = Depends(require_roles(["admin", "manager", "recruiter"])),
    db=Depends(get_database)
):
    """Get AI-powered scoring for a candidate."""
    
    if not ObjectId.is_valid(candidate_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid candidate ID"
        )
    
    # Get candidate data
    candidate_doc = await db.candidates.find_one({"_id": ObjectId(candidate_id)})
    if not candidate_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    # Get job posting data
    job_doc = await db.job_postings.find_one({"_id": candidate_doc["jobPostingId"]})
    if not job_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated job posting not found"
        )
    
    # Get AI service and calculate score
    from app.services.ai_service import ai_service
    
    resume_text = candidate_doc.get("extractedText", "")
    job_description = job_doc.get("description", "")
    
    scoring_result = await ai_service.calculate_resume_score(resume_text, job_description)
    
    # Add candidate and job context
    scoring_result.update({
        "candidateId": candidate_id,
        "candidateName": candidate_doc.get("name", ""),
        "jobTitle": job_doc.get("title", ""),
        "jobId": str(candidate_doc["jobPostingId"]),
        "analyzedAt": datetime.utcnow().isoformat()
    })
    
    return scoring_result