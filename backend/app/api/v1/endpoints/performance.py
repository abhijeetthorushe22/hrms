# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
# pyrefly: ignore [missing-import]
from bson import ObjectId
from datetime import datetime

from app.core.database import get_database
from app.core.security import any_authenticated, manager_or_admin
from app.models.schemas import PerformanceReview, PerformanceReviewCreate

router = APIRouter()

@router.get("/reviews", response_model=List[dict])
async def get_all_performance_reviews(
    employee_id: Optional[str] = None,
    reviewer_id: Optional[str] = None,
    period: Optional[str] = None,
    token_data: dict = Depends(any_authenticated),
    db=Depends(get_database)
):
    """Get all performance reviews with optional filtering."""
    
    try:
        # Build query
        query = {}
        if employee_id:
            if ObjectId.is_valid(employee_id):
                query["employeeId"] = ObjectId(employee_id)
        if reviewer_id:
            if ObjectId.is_valid(reviewer_id):
                query["reviewerId"] = ObjectId(reviewer_id)
        if period:
            query["reviewPeriod"] = period
        
        # Get performance reviews with employee details
        pipeline = [
            {"$match": query},
            {
                "$lookup": {
                    "from": "employees",
                    "localField": "employeeId",
                    "foreignField": "_id",
                    "as": "employee"
                }
            },
            {"$unwind": "$employee"},
            {"$sort": {"reviewDate": -1}}
        ]
        
        cursor = db.performance_reviews.aggregate(pipeline)
        reviews = await cursor.to_list(length=1000)
        
        # Transform data to match frontend expectations
        formatted_reviews = []
        for review in reviews:
            # Calculate overall score from ratings
            overall_score = 0
            if review.get("ratings"):
                ratings = review["ratings"]
                overall_score = (
                    ratings.get("communication", 0) + 
                    ratings.get("technicalSkills", 0) + 
                    ratings.get("teamwork", 0)
                ) / 3
            
            # Determine status based on ratings (if no explicit status)
            status_value = "completed" if overall_score > 0 else "pending"
            
            # Extract goals and achievements from feedback
            feedback = review.get("feedbackText", "") or review.get("feedback_text", "")
            goals = []
            achievements = []
            
            # More robust parsing
            if "goals:" in feedback.lower():
                goals_start = feedback.lower().find("goals:") + 6
                if "achievements:" in feedback.lower():
                    goals_end = feedback.lower().find("achievements:")
                    goals_text = feedback[goals_start:goals_end].strip()
                else:
                    goals_text = feedback[goals_start:].strip()
                
                if goals_text:
                    goals = [g.strip() for g in goals_text.split(",") if g.strip()]
            
            if "achievements:" in feedback.lower():
                achievements_start = feedback.lower().find("achievements:") + 13
                achievements_text = feedback[achievements_start:].strip()
                if achievements_text:
                    achievements = [a.strip() for a in achievements_text.split(",") if a.strip()]
            
            # Default values if empty
            if not goals:
                goals = ["Improve performance", "Meet targets"]
            if not achievements:
                achievements = ["Consistent performance", "Team collaboration"]
            
            formatted_review = {
                "id": str(review["_id"]),
                "employeeName": f"{review['employee'].get('firstName', '')} {review['employee'].get('lastName', '')}".strip(),
                "department": review['employee'].get('department', 'Unknown'),
                "reviewDate": review.get("reviewDate", datetime.utcnow()).strftime("%Y-%m-%d"),
                "overallScore": round(overall_score, 1) if overall_score > 0 else 0,
                "status": status_value,
                "goals": goals[:3],  # Limit to 3 goals
                "achievements": achievements[:3]  # Limit to 3 achievements
            }
            
            formatted_reviews.append(formatted_review)
        
        return formatted_reviews
        
    except Exception as e:
        print(f"Error fetching performance reviews: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching performance reviews: {str(e)}"
        )

@router.post("/reviews", response_model=dict)
async def create_performance_review(
    review_data: PerformanceReviewCreate,
    token_data: dict = Depends(manager_or_admin),
    db=Depends(get_database)
):
    """Create a new performance review."""
    
    try:
        # Validate employee exists
        if not ObjectId.is_valid(review_data.employee_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid employee ID"
            )
        
        employee = await db.employees.find_one({"_id": ObjectId(review_data.employee_id)})
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        # Create review document
        review_doc = review_data.model_dump()
        review_doc["employeeId"] = ObjectId(review_data.employee_id)
        review_doc["reviewerId"] = ObjectId(token_data["user_id"])
        review_doc["reviewDate"] = datetime.utcnow()
        review_doc["createdAt"] = datetime.utcnow()
        review_doc["updatedAt"] = datetime.utcnow()
        
        # Remove the string version of employee_id since we're using employeeId
        review_doc.pop("employee_id", None)
        
        # Insert review
        result = await db.performance_reviews.insert_one(review_doc)
        review_doc["_id"] = result.inserted_id
        
        # Calculate overall score for response
        ratings = review_doc.get("ratings", {})
        overall_score = (
            ratings.get("communication", 0) + 
            ratings.get("technicalSkills", 0) + 
            ratings.get("teamwork", 0)
        ) / 3
        
        # Extract goals and achievements from feedback
        feedback = review_doc.get("feedbackText", "")
        goals = []
        achievements = []
        
        # More robust parsing
        feedback = review_doc.get("feedbackText", "") or review_doc.get("feedback_text", "")
        
        if "goals:" in feedback.lower():
            goals_start = feedback.lower().find("goals:") + 6
            if "achievements:" in feedback.lower():
                goals_end = feedback.lower().find("achievements:")
                goals_text = feedback[goals_start:goals_end].strip()
            else:
                goals_text = feedback[goals_start:].strip()
            
            if goals_text:
                goals = [g.strip() for g in goals_text.split(",") if g.strip()]
        
        if "achievements:" in feedback.lower():
            achievements_start = feedback.lower().find("achievements:") + 13
            achievements_text = feedback[achievements_start:].strip()
            if achievements_text:
                achievements = [a.strip() for a in achievements_text.split(",") if a.strip()]
        
        # Default values if empty
        if not goals:
            goals = ["Improve performance", "Meet targets"]
        if not achievements:
            achievements = ["Consistent performance", "Team collaboration"]
        
        # Return formatted response
        return {
            "id": str(review_doc["_id"]),
            "employeeName": f"{employee.get('firstName', '')} {employee.get('lastName', '')}".strip(),
            "department": employee.get('department', 'Unknown'),
            "reviewDate": review_doc["reviewDate"].strftime("%Y-%m-%d"),
            "overallScore": round(overall_score, 1),
            "status": "completed",
            "goals": goals[:3],
            "achievements": achievements[:3]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating performance review: {str(e)}"
        )

@router.get("/{review_id}", response_model=PerformanceReview)
async def get_performance_review(
    review_id: str,
    token_data: dict = Depends(any_authenticated),
    db=Depends(get_database)
):
    """Get a specific performance review by ID."""
    
    if not ObjectId.is_valid(review_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid review ID"
        )
    
    try:
        review = await db.performance_reviews.find_one({"_id": ObjectId(review_id)})
        
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Performance review not found"
            )
        
        # Convert ObjectIds to strings
        review["_id"] = str(review["_id"])
        review["employeeId"] = str(review["employeeId"])
        if review.get("reviewerId"):
            review["reviewerId"] = str(review["reviewerId"])
        
        return PerformanceReview(**review)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching performance review: {str(e)}"
        )

@router.post("", response_model=PerformanceReview)
@router.post("/", response_model=PerformanceReview)
async def create_performance_review(
    review_data: PerformanceReviewCreate,
    token_data: dict = Depends(manager_or_admin),
    db=Depends(get_database)
):
    """Create a new performance review."""
    
    try:
        # Validate employee exists
        if not ObjectId.is_valid(review_data.employee_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid employee ID"
            )
        
        employee = await db.employees.find_one({"_id": ObjectId(review_data.employee_id)})
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        # Create review document
        review_doc = review_data.model_dump()
        review_doc["employeeId"] = ObjectId(review_data.employee_id)
        review_doc["reviewerId"] = ObjectId(token_data["user_id"])
        review_doc["reviewDate"] = datetime.utcnow()
        review_doc["createdAt"] = datetime.utcnow()
        review_doc["updatedAt"] = datetime.utcnow()
        
        # Remove the string version of employee_id since we're using employeeId
        review_doc.pop("employee_id", None)
        
        # Insert review
        result = await db.performance_reviews.insert_one(review_doc)
        review_doc["_id"] = result.inserted_id
        
        # Convert ObjectIds to strings for response
        review_doc["_id"] = str(review_doc["_id"])
        review_doc["employeeId"] = str(review_doc["employeeId"])
        review_doc["reviewerId"] = str(review_doc["reviewerId"])
        
        return PerformanceReview(**review_doc)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating performance review: {str(e)}"
        )

@router.put("/{review_id}", response_model=PerformanceReview)
async def update_performance_review(
    review_id: str,
    review_data: PerformanceReviewCreate,
    token_data: dict = Depends(manager_or_admin),
    db=Depends(get_database)
):
    """Update a performance review."""
    
    if not ObjectId.is_valid(review_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid review ID"
        )
    
    try:
        # Check if review exists
        existing_review = await db.performance_reviews.find_one({"_id": ObjectId(review_id)})
        if not existing_review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Performance review not found"
            )
        
        # Update review document
        update_doc = review_data.model_dump()
        update_doc["employeeId"] = ObjectId(review_data.employee_id)
        update_doc["updatedAt"] = datetime.utcnow()
        
        # Remove the string version of employee_id
        update_doc.pop("employee_id", None)
        
        # Update review
        await db.performance_reviews.update_one(
            {"_id": ObjectId(review_id)},
            {"$set": update_doc}
        )
        
        # Get updated review
        updated_review = await db.performance_reviews.find_one({"_id": ObjectId(review_id)})
        
        # Convert ObjectIds to strings
        updated_review["_id"] = str(updated_review["_id"])
        updated_review["employeeId"] = str(updated_review["employeeId"])
        if updated_review.get("reviewerId"):
            updated_review["reviewerId"] = str(updated_review["reviewerId"])
        
        return PerformanceReview(**updated_review)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating performance review: {str(e)}"
        )

@router.delete("/{review_id}")
async def delete_performance_review(
    review_id: str,
    token_data: dict = Depends(manager_or_admin),
    db=Depends(get_database)
):
    """Delete a performance review."""
    
    if not ObjectId.is_valid(review_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid review ID"
        )
    
    try:
        # Check if review exists
        existing_review = await db.performance_reviews.find_one({"_id": ObjectId(review_id)})
        if not existing_review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Performance review not found"
            )
        
        # Delete review
        await db.performance_reviews.delete_one({"_id": ObjectId(review_id)})
        
        return {"message": "Performance review deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting performance review: {str(e)}"
        )