from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, BackgroundTasks
from typing import List, Any
from bson import ObjectId
import os
import uuid
from datetime import datetime

from app.core.database import get_database
from app.core.security import recruiter_or_admin, manager_or_admin, any_authenticated
from app.models.schemas import JobPostingCreate, JobPosting, Candidate, FileUploadResponse, CandidateStatus
from app.services.ai_service import ai_service
from app.core.config import settings

router = APIRouter()

@router.post("/", response_model=JobPosting)
async def create_job_posting(
    job_data: JobPostingCreate,
    token_data: dict = Depends(recruiter_or_admin),
    db=Depends(get_database)
):
    """Create a new job posting."""
    
    # Generate embedding for job description
    try:
        description_vector = ai_service.generate_embedding(job_data.description)
    except Exception as e:
        # If AI service fails, continue without embedding
        description_vector = None
    
    # Create job posting document
    job_doc = {
        "title": job_data.title,
        "department": job_data.department,
        "description": job_data.description,
        "requirements": job_data.requirements,
        "location": job_data.location,
        "salaryRange": job_data.salary_range,
        "employmentType": job_data.employment_type,
        "postedBy": token_data["user_id"],
        "postedAt": datetime.utcnow(),
        "isActive": True,
        "descriptionVector": description_vector,
        "createdAt": datetime.utcnow()
    }
    
    # Insert job posting
    result = await db.job_postings.insert_one(job_doc)
    job_doc["_id"] = str(result.inserted_id)
    
    return JobPosting(**job_doc)

@router.get("", response_model=List[JobPosting])
async def get_job_postings(
    is_active: bool = None,
    department: str = None,
    token_data: dict = Depends(any_authenticated),
    db=Depends(get_database)
):
    """Get all job postings with optional filtering."""
    
    # Build query
    query = {}
    if is_active is not None:
        query["isActive"] = is_active
    if department:
        query["department"] = department
    
    # Get job postings
    cursor = db.job_postings.find(query).sort("createdAt", -1)
    job_postings = await cursor.to_list(length=100)
    
    # Convert ObjectIds to strings
    for job in job_postings:
        job["_id"] = str(job["_id"])
        if job.get("postedBy"):
            job["postedBy"] = str(job["postedBy"])
    
    return [JobPosting(**job) for job in job_postings]

@router.get("/{job_id}", response_model=JobPosting)
async def get_job_posting(
    job_id: str,
    token_data: dict = Depends(recruiter_or_admin),
    db=Depends(get_database)
):
    """Get a specific job posting by ID."""
    
    if not ObjectId.is_valid(job_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID"
        )
    
    job_doc = await db.job_postings.find_one({"_id": ObjectId(job_id)})
    if not job_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found"
        )
    # Convert ObjectId fields to strings for Pydantic
    job_doc["_id"] = str(job_doc["_id"])
    if job_doc.get("postedBy"):
        job_doc["postedBy"] = str(job_doc["postedBy"])

    return JobPosting(**job_doc)

async def process_resume_background_task(
    job_id: str,
    file_path: str,
    candidate_data: dict,
    db
):
    """Background task to process uploaded resume."""
    try:
        # Extract text from resume
        if file_path.lower().endswith('.pdf'):
            extracted_text = ai_service.extract_text_from_pdf(file_path)
        elif file_path.lower().endswith('.docx'):
            extracted_text = ai_service.extract_text_from_docx(file_path)
        else:
            extracted_text = ""
        
        # Extract entities and skills (now works even without spaCy)
        entities_data = {}
        try:
            entities_data = ai_service.extract_entities_from_resume(extracted_text)
        except Exception as e:
            print(f"Error extracting entities: {e}")
            # Provide fallback data
            entities_data = {
                "entities": {},
                "skills": [],
                "contact_info": {}
            }
        
        # Get job posting for similarity calculation
        job_doc = await db.job_postings.find_one({"_id": ObjectId(job_id)})
        if not job_doc:
            return
        
        # Calculate match score
        match_score = 0.0
        chroma_vector_id = None
        
        if extracted_text and job_doc.get("description"):
            try:
                # Store resume embedding in ChromaDB
                metadata = {
                    "candidate_id": str(candidate_data["_id"]),
                    "job_id": job_id,
                    "name": candidate_data["name"],
                    "email": candidate_data["email"]
                }
                
                chroma_vector_id = ai_service.store_resume_embedding(
                    str(candidate_data["_id"]),
                    extracted_text,
                    metadata
                )
                
                # Search for similarity (this will return the candidate itself, but we get the score)
                similar_candidates = ai_service.search_similar_candidates(job_doc["description"], top_k=1)
                if similar_candidates and similar_candidates[0]["candidate_id"] == str(candidate_data["_id"]):
                    match_score = similar_candidates[0]["similarity_score"]
                
            except Exception as e:
                print(f"Error processing embeddings: {e}")
        
        # Update candidate with processed data
        update_data = {
            "extractedText": extracted_text,
            "chromaVectorId": chroma_vector_id,
            "matchScore": match_score,
            "status": CandidateStatus.NEW
        }
        
        # Extract candidate name from resume - prioritize contact_info.name over person_names
        candidate_name = None
        
        # First, try to get name from contact_info which is more reliable
        if entities_data.get("contact_info") and entities_data["contact_info"].get("name"):
            candidate_name = entities_data["contact_info"]["name"].strip()
        
        # If no name in contact_info, fall back to person_names
        elif entities_data.get("person_names") and len(entities_data["person_names"]) > 0:
            # Use the first person name found in the resume
            candidate_name = entities_data["person_names"][0].strip()
        
        # Update name if we found a valid one
        if candidate_name and len(candidate_name) > 2:
            update_data["name"] = candidate_name
        
        # Add extracted contact info if found
        if entities_data.get("contact_info"):
            if entities_data["contact_info"].get("email"):
                update_data["email"] = entities_data["contact_info"]["email"]
            if entities_data["contact_info"].get("phone"):
                update_data["phone"] = entities_data["contact_info"]["phone"]
        
        await db.candidates.update_one(
            {"_id": candidate_data["_id"]},
            {"$set": update_data}
        )
        
        print(f"Resume processed successfully for candidate {candidate_data['_id']}")
        
    except Exception as e:
        print(f"Error processing resume: {e}")
        # Update candidate status to indicate processing failed
        await db.candidates.update_one(
            {"_id": candidate_data["_id"]},
            {"$set": {"status": CandidateStatus.NEW}}
        )

@router.post("/{job_id}/upload-resume", response_model=FileUploadResponse)
async def upload_resume(
    job_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    token_data: dict = Depends(recruiter_or_admin),
    db=Depends(get_database)
):
    """Upload a resume file for a job posting."""
    
    if not ObjectId.is_valid(job_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID"
        )
    
    # Check if job exists
    job_doc = await db.job_postings.find_one({"_id": ObjectId(job_id)})
    if not job_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found"
        )
    
    # Validate file type (temporarily allow .txt for testing)
    if not file.filename.lower().endswith(('.pdf', '.docx', '.txt')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF, DOCX, and TXT files are supported"
        )
    
    # Check file size
    if file.size and file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large"
        )
    
    # Save file
    file_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"{file_id}{file_extension}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Create candidate record with temporary data (will be updated during processing)
    candidate_data = {
        "jobPostingId": ObjectId(job_id),
        "name": f"Candidate_{file_id[:8]}",  # Temporary name, will be extracted from resume
        "email": f"temp.{file_id[:8]}@aurahr.processing",  # Temporary email, will be extracted from resume
        "phone": "",  # Will be extracted from resume if available
        "resumeS3Key": filename,
        "extractedText": "",
        "chromaVectorId": None,
        "matchScore": 0.0,
        "status": CandidateStatus.NEW,
        "interviewSummary": "",
        "appliedAt": datetime.utcnow()
    }
    
    # Insert candidate
    result = await db.candidates.insert_one(candidate_data)
    candidate_data["_id"] = result.inserted_id
    
    # Add background task to process the resume
    background_tasks.add_task(
        process_resume_background_task,
        job_id,
        file_path,
        candidate_data,
        db
    )
    
    return FileUploadResponse(
        message="Resume uploaded successfully. Processing started.",
        candidateId=str(candidate_data["_id"])
    )

@router.get("/{job_id}/candidates", response_model=List[Candidate])
async def get_job_candidates(
    job_id: str,
    token_data: dict = Depends(recruiter_or_admin),
    db=Depends(get_database)
):
    """Get all candidates for a job posting, ranked by match score."""
    
    if not ObjectId.is_valid(job_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID"
        )
    
    # Get candidates sorted by match score (highest first)
    cursor = db.candidates.find(
        {"jobPostingId": ObjectId(job_id)}
    ).sort("matchScore", -1)
    
    candidates = await cursor.to_list(length=100)
    
    # Convert and clean candidate data for Pydantic validation
    validated_candidates = []
    for candidate in candidates:
        try:
            # Convert ObjectId fields to strings
            candidate["_id"] = str(candidate["_id"])
            candidate["jobPostingId"] = str(candidate["jobPostingId"])
            
            # Handle missing required fields with defaults
            if "name" not in candidate or not candidate["name"]:
                candidate["name"] = "Unknown Candidate"
            
            if "email" not in candidate or not candidate["email"]:
                candidate["email"] = "noemail@example.com"
            
            # Ensure phone is string or None
            if "phone" in candidate and candidate["phone"]:
                candidate["phone"] = str(candidate["phone"])
            
            # Handle status field
            if "status" not in candidate:
                candidate["status"] = CandidateStatus.NEW
            
            # Handle optional datetime fields
            if "appliedAt" not in candidate:
                candidate["appliedAt"] = datetime.utcnow()
            
            # Create Candidate instance
            validated_candidate = Candidate(**candidate)
            validated_candidates.append(validated_candidate)
            
        except Exception as e:
            print(f"⚠️  Skipping invalid candidate {candidate.get('_id', 'unknown')}: {e}")
            # Skip invalid candidates instead of failing the entire request
            continue
    
    return validated_candidates

@router.patch("/{job_id}/status")
async def update_job_status(
    job_id: str,
    status: str,
    token_data: dict = Depends(recruiter_or_admin),
    db=Depends(get_database)
):
    """Update job posting status."""
    
    if not ObjectId.is_valid(job_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID"
        )
    
    if status not in ["open", "closed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'open' or 'closed'"
        )
    
    result = await db.job_postings.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {"status": status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found"
        )
    
    return {"message": f"Job status updated to {status}"}