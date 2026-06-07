from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse, StreamingResponse
from typing import List, Optional
import os
import uuid
import shutil
from pathlib import Path
from datetime import datetime
from bson import ObjectId

from app.core.database import get_database
from app.core.security import any_authenticated, admin_required
from app.core.config import settings
from app.models.schemas import Document, DocumentCreate

router = APIRouter()

@router.post("/upload", response_model=Document)
async def upload_document(
    file: UploadFile = File(...),
    employee_id: Optional[str] = Form(None),
    document_type: Optional[str] = Form("general"),
    description: Optional[str] = Form(""),
    token_data: dict = Depends(any_authenticated),
    db=Depends(get_database)
):
    """Upload a document."""
    
    # Validate file
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )
    
    # Generate unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = Path(settings.UPLOAD_DIR) / unique_filename
    
    try:
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Create document record
        document_doc = {
            "filename": file.filename,
            "storedFilename": unique_filename,
            "filePath": str(file_path),
            "fileSize": file_path.stat().st_size,
            "mimeType": file.content_type,
            "employeeId": ObjectId(employee_id) if employee_id and ObjectId.is_valid(employee_id) else None,
            "documentType": document_type,
            "description": description,
            "uploadedBy": ObjectId(token_data["user_id"]),
            "uploadedAt": datetime.utcnow()
        }
        
        result = await db.documents.insert_one(document_doc)
        document_doc["_id"] = str(result.inserted_id)
        
        # Convert ObjectIds to strings
        if document_doc.get("employeeId"):
            document_doc["employeeId"] = str(document_doc["employeeId"])
        document_doc["uploadedBy"] = str(document_doc["uploadedBy"])
        
        return Document(**document_doc)
        
    except Exception as e:
        # Clean up file if database insert fails
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload document: {str(e)}"
        )

@router.get("", response_model=List[Document])
@router.get("/", response_model=List[Document])
async def get_documents(
    employee_id: Optional[str] = None,
    document_type: Optional[str] = None,
    token_data: dict = Depends(any_authenticated),
    db=Depends(get_database)
):
    """Get documents with optional filtering."""
    
    # Build query
    query = {}
    if employee_id:
        if not ObjectId.is_valid(employee_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid employee ID"
            )
        query["employeeId"] = ObjectId(employee_id)
    
    if document_type:
        query["documentType"] = document_type
    
    # Get documents
    cursor = db.documents.find(query).sort("uploadedAt", -1)
    documents = await cursor.to_list(length=1000)
    
    # Convert ObjectIds to strings
    for doc in documents:
        doc["_id"] = str(doc["_id"])
        if doc.get("employeeId"):
            doc["employeeId"] = str(doc["employeeId"])
        doc["uploadedBy"] = str(doc["uploadedBy"])
    
    return [Document(**doc) for doc in documents]

@router.get("/{document_id}", response_model=Document)
async def get_document(
    document_id: str,
    token_data: dict = Depends(any_authenticated),
    db=Depends(get_database)
):
    """Get a specific document."""
    
    if not ObjectId.is_valid(document_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid document ID"
        )
    
    document_doc = await db.documents.find_one({"_id": ObjectId(document_id)})
    if not document_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Convert ObjectIds to strings
    document_doc["_id"] = str(document_doc["_id"])
    if document_doc.get("employeeId"):
        document_doc["employeeId"] = str(document_doc["employeeId"])
    document_doc["uploadedBy"] = str(document_doc["uploadedBy"])
    
    return Document(**document_doc)

@router.get("/{document_id}/download")
async def download_document(
    document_id: str,
    token_data: dict = Depends(any_authenticated),
    db=Depends(get_database)
):
    """Download a document file."""
    
    if not ObjectId.is_valid(document_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid document ID"
        )
    
    document_doc = await db.documents.find_one({"_id": ObjectId(document_id)})
    if not document_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    file_path = Path(document_doc["filePath"])
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk"
        )
    
    return FileResponse(
        path=str(file_path),
        filename=document_doc["filename"],
        media_type=document_doc.get("mimeType", "application/octet-stream")
    )

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    token_data: dict = Depends(any_authenticated),
    db=Depends(get_database)
):
    """Delete a document."""
    
    if not ObjectId.is_valid(document_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid document ID"
        )
    
    document_doc = await db.documents.find_one({"_id": ObjectId(document_id)})
    if not document_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check permissions - admin or uploader can delete
    user_role = token_data.get("role")
    user_id = token_data.get("user_id")
    
    if user_role != "admin" and str(document_doc["uploadedBy"]) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Delete from database
    await db.documents.delete_one({"_id": ObjectId(document_id)})
    
    # Delete file from disk
    file_path = Path(document_doc["filePath"])
    if file_path.exists():
        try:
            file_path.unlink()
        except Exception as e:
            print(f"Warning: Failed to delete file {file_path}: {e}")
    
    return {"message": "Document deleted successfully"}
