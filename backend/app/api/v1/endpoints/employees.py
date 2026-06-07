from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from typing import List, Any, Optional
from bson import ObjectId
from datetime import datetime
import uuid
import shutil
from pathlib import Path

from app.core.database import get_database
from app.core.security import any_authenticated, manager_or_admin, admin_required, recruiter_or_admin
from app.core.config import settings
from app.models.schemas import (
    EmployeeCreate, Employee, PerformanceReviewCreate, PerformanceReview,
    DevelopmentPlan, DevelopmentPlanContent, Document
)
from app.services.ai_service import ai_service

router = APIRouter()

@router.post("", response_model=Employee)
@router.post("/", response_model=Employee)
async def create_employee(
    employee_data: EmployeeCreate,
    token_data: dict = Depends(admin_required),
    db=Depends(get_database)
):
    """Create a new employee."""
    
    # Validate manager ID if provided
    if employee_data.manager_id:
        if not ObjectId.is_valid(employee_data.manager_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid manager ID"
            )
        
        manager_doc = await db.employees.find_one({"_id": ObjectId(employee_data.manager_id)})
        if not manager_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Manager not found"
            )
    
    # Create employee document
    employee_doc = {
        "firstName": employee_data.first_name,
        "lastName": employee_data.last_name,
        "jobTitle": employee_data.job_title,
        "department": employee_data.department,
        "managerId": ObjectId(employee_data.manager_id) if employee_data.manager_id else None,
        "hireDate": employee_data.hire_date,
        "contactInfo": employee_data.contact_info.dict() if employee_data.contact_info else {},
        "extractedSkills": employee_data.extracted_skills,
        "careerGoals": employee_data.career_goals or "",
        "createdAt": datetime.utcnow()
    }
    
    # Insert employee
    result = await db.employees.insert_one(employee_doc)
    employee_doc["_id"] = str(result.inserted_id)
    
    return Employee(**employee_doc)

@router.get("", response_model=List[Employee])
@router.get("/", response_model=List[Employee])
async def get_employees(
    department: str = None,
    manager_id: str = None,
    token_data: dict = Depends(any_authenticated),
    db=Depends(get_database)
):
    """Get all employees with optional filtering."""
    
    # Build query
    query = {}
    if department:
        query["department"] = department
    if manager_id:
        query["managerId"] = ObjectId(manager_id) if ObjectId.is_valid(manager_id) else None
    
    # Get employees
    cursor = db.employees.find(query).sort("lastName", 1)
    employees = await cursor.to_list(length=1000)
    
    # Convert ObjectIds to strings for Pydantic models
    for emp in employees:
        emp["_id"] = str(emp["_id"])
        if emp.get("managerId"):
            emp["managerId"] = str(emp["managerId"])
    
    return [Employee(**emp) for emp in employees]

@router.get("/{employee_id}", response_model=Employee)
async def get_employee(
    employee_id: str,
    token_data: dict = Depends(any_authenticated),
    db=Depends(get_database)
):
    """Get a specific employee by ID."""
    
    if not ObjectId.is_valid(employee_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid employee ID"
        )
    
    # Check if user can access this employee data
    user_role = token_data.get("role")
    user_id = token_data.get("user_id")
    
    # Get user's employee_id if they're an employee
    user_employee_id = None
    if user_role == "employee":
        user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
        if user_doc and user_doc.get("employeeId"):
            user_employee_id = str(user_doc["employeeId"])
    
    # Allow access if:
    # 1. User is admin, manager, or recruiter
    # 2. User is accessing their own profile
    if user_role not in ["admin", "manager", "recruiter"] and user_employee_id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    employee_doc = await db.employees.find_one({"_id": ObjectId(employee_id)})
    if not employee_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Convert ObjectIds to strings
    employee_doc["_id"] = str(employee_doc["_id"])
    if employee_doc.get("managerId"):
        employee_doc["managerId"] = str(employee_doc["managerId"])
    
    return Employee(**employee_doc)

@router.get("/{employee_id}/development-plan", response_model=DevelopmentPlan)
async def get_development_plan(
    employee_id: str,
    token_data: dict = Depends(any_authenticated),
    db=Depends(get_database)
):
    """Get the latest development plan for an employee."""
    
    if not ObjectId.is_valid(employee_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid employee ID"
        )
    
    # Check access permissions (same as get_employee)
    user_role = token_data.get("role")
    user_id = token_data.get("user_id")
    
    user_employee_id = None
    if user_role == "employee":
        user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
        if user_doc and user_doc.get("employeeId"):
            user_employee_id = str(user_doc["employeeId"])
    
    if user_role not in ["admin", "manager", "recruiter"] and user_employee_id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get latest development plan
    plan_doc = await db.development_plans.find_one(
        {"employeeId": ObjectId(employee_id)},
        sort=[("generatedAt", -1)]
    )
    
    if not plan_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No development plan found for this employee"
        )
    
    # Convert ObjectIds to strings for Pydantic model
    plan_doc["_id"] = str(plan_doc["_id"])
    plan_doc["employeeId"] = str(plan_doc["employeeId"])
    
    return DevelopmentPlan(**plan_doc)

@router.post("/{employee_id}/development-plan", response_model=DevelopmentPlan)
async def generate_development_plan(
    employee_id: str,
    token_data: dict = Depends(any_authenticated),
    db=Depends(get_database)
):
    """Generate a new AI-powered development plan for an employee."""
    
    if not ObjectId.is_valid(employee_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid employee ID"
        )
    
    # Check access permissions
    user_role = token_data.get("role")
    user_id = token_data.get("user_id")
    
    user_employee_id = None
    if user_role == "employee":
        user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
        if user_doc and user_doc.get("employeeId"):
            user_employee_id = str(user_doc["employeeId"])
    
    if user_role not in ["admin", "manager", "recruiter"] and user_employee_id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get employee data
    employee_doc = await db.employees.find_one({"_id": ObjectId(employee_id)})
    if not employee_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Get latest performance review
    review_doc = await db.performance_reviews.find_one(
        {"employeeId": ObjectId(employee_id)},
        sort=[("reviewDate", -1)]
    )
    
    # Prepare data for AI model
    employee_context = {
        "employee": {
            "name": f"{employee_doc['firstName']} {employee_doc['lastName']}",
            "jobTitle": employee_doc["jobTitle"],
            "department": employee_doc["department"],
            "extractedSkills": employee_doc.get("extractedSkills", []),
            "careerGoals": employee_doc.get("careerGoals", ""),
            "hireDate": employee_doc["hireDate"].isoformat()
        }
    }
    
    if review_doc:
        employee_context["latestPerformanceReview"] = {
            "reviewDate": review_doc["reviewDate"].isoformat(),
            "ratings": review_doc["ratings"],
            "feedbackText": review_doc["feedbackText"]
        }
    else:
        employee_context["latestPerformanceReview"] = {
            "reviewDate": "No review available",
            "ratings": {"communication": 3, "technicalSkills": 3, "teamwork": 3},
            "feedbackText": "No specific feedback available. Focus on general professional development."
        }
    
    try:
        # Generate development plan using AI
        plan_data = await ai_service.generate_development_plan(employee_context)
        
        # Create development plan document
        plan_doc = {
            "employeeId": ObjectId(employee_id),
            "generatedAt": datetime.utcnow(),
            "planJson": plan_data
        }
        
        # Insert development plan
        result = await db.development_plans.insert_one(plan_doc)
        plan_doc["_id"] = str(result.inserted_id)
        plan_doc["employeeId"] = str(plan_doc["employeeId"])  # Convert ObjectId to string
        
        return DevelopmentPlan(**plan_doc)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating development plan: {str(e)}"
        )

@router.post("/{employee_id}/performance-review", response_model=PerformanceReview)
async def create_performance_review(
    employee_id: str,
    review_data: PerformanceReviewCreate,
    token_data: dict = Depends(manager_or_admin),
    db=Depends(get_database)
):
    """Create a performance review for an employee."""
    
    if not ObjectId.is_valid(employee_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid employee ID"
        )
    
    # Check if employee exists
    employee_doc = await db.employees.find_one({"_id": ObjectId(employee_id)})
    if not employee_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Get reviewer ID from token
    reviewer_user = await db.users.find_one({"_id": ObjectId(token_data["user_id"])})
    if not reviewer_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reviewer user not found"
        )
    
    # For admin users, allow creating reviews without employee profile
    reviewer_id = reviewer_user.get("employeeId")
    is_admin = reviewer_user.get("role") == "admin"
    
    if not reviewer_id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reviewer must have an employee profile"
        )
    
    # Create performance review document
    try:
        # For admin users without employee profile, use the user ID as reviewer
        actual_reviewer_id = reviewer_id if reviewer_id else ObjectId(token_data["user_id"])
        
        review_doc = {
            "employeeId": ObjectId(employee_id),
            "reviewerId": actual_reviewer_id,
            "reviewDate": datetime.utcnow(),
            "ratings": review_data.ratings.dict(),
            "feedbackText": review_data.feedback_text
        }
        
        # Insert performance review
        result = await db.performance_reviews.insert_one(review_doc)
        review_doc["_id"] = result.inserted_id
        
        # Convert ObjectIds to strings for Pydantic validation
        review_doc["_id"] = str(review_doc["_id"])
        review_doc["employeeId"] = str(review_doc["employeeId"]) 
        review_doc["reviewerId"] = str(review_doc["reviewerId"])
        
        # Convert field names to match Pydantic aliases
        ratings_dict = review_doc["ratings"]
        if "technical_skills" in ratings_dict:
            ratings_dict["technicalSkills"] = ratings_dict.pop("technical_skills")
        
        print(f"Debug - review_doc after field conversion: {review_doc}")
        
        return PerformanceReview(**review_doc)
    except Exception as e:
        print(f"Error in performance review creation: {str(e)}")
        print(f"Error type: {type(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Performance review creation failed: {str(e)}"
        )

@router.get("/{employee_id}/performance-reviews", response_model=List[PerformanceReview])
async def get_performance_reviews(
    employee_id: str,
    token_data: dict = Depends(any_authenticated),
    db=Depends(get_database)
):
    """Get all performance reviews for an employee."""
    
    if not ObjectId.is_valid(employee_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid employee ID"
        )
    
    # Check access permissions
    user_role = token_data.get("role")
    user_id = token_data.get("user_id")
    
    user_employee_id = None
    if user_role == "employee":
        user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
        if user_doc and user_doc.get("employeeId"):
            user_employee_id = str(user_doc["employeeId"])
    
    if user_role not in ["admin", "manager", "recruiter"] and user_employee_id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get performance reviews
    cursor = db.performance_reviews.find(
        {"employeeId": ObjectId(employee_id)}
    ).sort("reviewDate", -1)
    
    reviews = await cursor.to_list(length=100)
    
    return [PerformanceReview(**review) for review in reviews]

@router.put("/{employee_id}", response_model=Employee)
async def update_employee(
    employee_id: str,
    employee_data: EmployeeCreate,
    token_data: dict = Depends(admin_required),
    db=Depends(get_database)
):
    """Update an existing employee."""
    
    if not ObjectId.is_valid(employee_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid employee ID"
        )
    
    # Check if employee exists
    employee_doc = await db.employees.find_one({"_id": ObjectId(employee_id)})
    if not employee_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Validate manager ID if provided
    if employee_data.manager_id:
        if not ObjectId.is_valid(employee_data.manager_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid manager ID"
            )
        
        manager_doc = await db.employees.find_one({"_id": ObjectId(employee_data.manager_id)})
        if not manager_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Manager not found"
            )
    
    # Update employee document
    update_data = {
        "firstName": employee_data.first_name,
        "lastName": employee_data.last_name,
        "jobTitle": employee_data.job_title,
        "department": employee_data.department,
        "managerId": ObjectId(employee_data.manager_id) if employee_data.manager_id else None,
        "hireDate": employee_data.hire_date,
        "contactInfo": employee_data.contact_info.dict() if employee_data.contact_info else {},
        "extractedSkills": employee_data.extracted_skills,
        "careerGoals": employee_data.career_goals or "",
        "updatedAt": datetime.utcnow()
    }
    
    # Update employee
    result = await db.employees.update_one(
        {"_id": ObjectId(employee_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Get updated employee
    updated_employee = await db.employees.find_one({"_id": ObjectId(employee_id)})
    updated_employee["_id"] = str(updated_employee["_id"])
    if updated_employee.get("managerId"):
        updated_employee["managerId"] = str(updated_employee["managerId"])
    
    return Employee(**updated_employee)

@router.delete("/{employee_id}")
async def delete_employee(
    employee_id: str,
    token_data: dict = Depends(manager_or_admin),
    db=Depends(get_database)
):
    """Delete an employee."""
    
    if not ObjectId.is_valid(employee_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid employee ID"
        )
    
    # Check if employee exists
    employee_doc = await db.employees.find_one({"_id": ObjectId(employee_id)})
    if not employee_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Check if employee is a manager for other employees
    managed_employees = await db.employees.find_one({"managerId": ObjectId(employee_id)})
    if managed_employees:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete employee who is a manager. Please reassign managed employees first."
        )
    
    # Delete employee
    result = await db.employees.delete_one({"_id": ObjectId(employee_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Also delete related performance reviews and development plans
    await db.performance_reviews.delete_many({"employeeId": ObjectId(employee_id)})
    await db.development_plans.delete_many({"employeeId": ObjectId(employee_id)})
    await db.documents.delete_many({"employeeId": ObjectId(employee_id)})
    
    return {"message": "Employee deleted successfully"}

# Employee Document Management Endpoints

@router.get("/{employee_id}/documents", response_model=List[Document])
async def get_employee_documents(
    employee_id: str,
    token_data: dict = Depends(any_authenticated),
    db=Depends(get_database)
):
    """Get all documents for a specific employee."""
    
    if not ObjectId.is_valid(employee_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid employee ID"
        )
    
    # Check if employee exists
    employee_doc = await db.employees.find_one({"_id": ObjectId(employee_id)})
    if not employee_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Get documents for this employee
    cursor = db.documents.find({"employeeId": ObjectId(employee_id)}).sort("uploadedAt", -1)
    documents = await cursor.to_list(length=1000)
    
    # Convert ObjectIds to strings
    for doc in documents:
        doc["_id"] = str(doc["_id"])
        if doc.get("employeeId"):
            doc["employeeId"] = str(doc["employeeId"])
        doc["uploadedBy"] = str(doc["uploadedBy"])
    
    return [Document(**doc) for doc in documents]

@router.post("/{employee_id}/documents", response_model=Document)
async def upload_employee_document(
    employee_id: str,
    file: UploadFile = File(...),
    document_type: Optional[str] = Form("general"),
    description: Optional[str] = Form(""),
    token_data: dict = Depends(any_authenticated),
    db=Depends(get_database)
):
    """Upload a document for a specific employee."""
    
    if not ObjectId.is_valid(employee_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid employee ID"
        )
    
    # Check if employee exists
    employee_doc = await db.employees.find_one({"_id": ObjectId(employee_id)})
    if not employee_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
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
            "employeeId": ObjectId(employee_id),
            "documentType": document_type,
            "description": description,
            "uploadedBy": ObjectId(token_data["user_id"]),
            "uploadedAt": datetime.utcnow()
        }
        
        result = await db.documents.insert_one(document_doc)
        document_doc["_id"] = str(result.inserted_id)
        
        # Convert ObjectIds to strings
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

@router.get("/{employee_id}/documents/{document_id}/download")
async def download_employee_document(
    employee_id: str,
    document_id: str,
    token_data: dict = Depends(any_authenticated),
    db=Depends(get_database)
):
    """Download a specific document for an employee."""
    
    if not ObjectId.is_valid(employee_id) or not ObjectId.is_valid(document_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid employee or document ID"
        )
    
    # Get document and verify it belongs to the employee
    document_doc = await db.documents.find_one({
        "_id": ObjectId(document_id),
        "employeeId": ObjectId(employee_id)
    })
    
    if not document_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found for this employee"
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

@router.delete("/{employee_id}/documents/{document_id}")
async def delete_employee_document(
    employee_id: str,
    document_id: str,
    token_data: dict = Depends(any_authenticated),
    db=Depends(get_database)
):
    """Delete a specific document for an employee."""
    
    if not ObjectId.is_valid(employee_id) or not ObjectId.is_valid(document_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid employee or document ID"
        )
    
    # Get document and verify it belongs to the employee
    document_doc = await db.documents.find_one({
        "_id": ObjectId(document_id),
        "employeeId": ObjectId(employee_id)
    })
    
    if not document_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found for this employee"
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