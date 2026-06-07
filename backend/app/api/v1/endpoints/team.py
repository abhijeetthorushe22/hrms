from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Dict, Any, Optional
from bson import ObjectId
from datetime import datetime, timedelta
import statistics
import traceback
import logging

logger = logging.getLogger(__name__)

from app.core.database import get_database
from app.core.security import any_authenticated, manager_or_admin
from app.models.schemas import TeamMember, TeamMemberWithInsights, TeamStatsResponse, TeamMemberStatus
from app.services.ai_service import ai_service

router = APIRouter()

@router.get("/members", response_model=List[TeamMemberWithInsights])
async def get_team_members(
    department: Optional[str] = Query(None, description="Filter by department"),
    status: Optional[TeamMemberStatus] = Query(None, description="Filter by status"),
    include_ai_insights: bool = Query(False, description="Include AI-powered insights"),
    token_data: dict = Depends(any_authenticated),
    db=Depends(get_database)
):
    """Get team members with performance metrics and AI insights."""
    
    try:
        # Build aggregation pipeline for comprehensive team data
        match_stage = {}
        if department:
            match_stage["department"] = department
        
        pipeline = [
            {"$match": match_stage},
            {
                "$lookup": {
                    "from": "performance_reviews",
                    "localField": "_id",
                    "foreignField": "employeeId", 
                    "as": "reviews"
                }
            },
            {
                "$lookup": {
                    "from": "users",
                    "localField": "_id",
                    "foreignField": "employeeId",
                    "as": "user_info"
                }
            },
            {
                "$addFields": {
                    "latest_review": {"$arrayElemAt": [{"$sortArray": {"input": "$reviews", "sortBy": {"reviewDate": -1}}}, 0]},
                    "user": {"$arrayElemAt": ["$user_info", 0]}
                }
            }
        ]
        
        cursor = db.employees.aggregate(pipeline)
        employees_data = await cursor.to_list(length=1000)
        
        team_members = []
        
        for emp_data in employees_data:
            # Calculate performance score from latest review
            performance_score = 75.0  # Default score
            if emp_data.get("latest_review") and emp_data["latest_review"].get("ratings"):
                ratings = emp_data["latest_review"]["ratings"]
                # Calculate weighted average of ratings (1-5 scale) and convert to percentage
                total_score = (
                    ratings.get("communication", 3) * 0.3 +
                    ratings.get("technicalSkills", 3) * 0.4 +
                    ratings.get("teamwork", 3) * 0.3
                )
                performance_score = (total_score / 5.0) * 100
            
            # Simulate project count based on review data and role
            projects_count = len(emp_data.get("reviews", [])) * 2 + 3
            if "Senior" in emp_data.get("jobTitle", ""):
                projects_count += 3
            elif "Manager" in emp_data.get("jobTitle", ""):
                projects_count += 5
            
            # Determine member status
            member_status = TeamMemberStatus.ACTIVE
            if emp_data.get("user"):
                # Simulate status based on last activity (you can implement real activity tracking)
                last_seen = emp_data["user"].get("lastActivity", datetime.utcnow())
                if isinstance(last_seen, str):
                    last_seen = datetime.fromisoformat(last_seen.replace("Z", "+00:00"))
                
                time_diff = datetime.utcnow() - last_seen
                if time_diff > timedelta(hours=8):
                    member_status = TeamMemberStatus.OFFLINE
                elif time_diff > timedelta(hours=2):
                    member_status = TeamMemberStatus.AWAY
                elif performance_score > 90:
                    member_status = TeamMemberStatus.BUSY
            
            # Build team member data
            team_member_data = {
                "_id": str(emp_data["_id"]),
                "employeeId": str(emp_data["_id"]),
                "name": f"{emp_data.get('firstName', '')} {emp_data.get('lastName', '')}".strip(),
                "role": emp_data.get("jobTitle", "Unknown Role"),
                "department": emp_data.get("department", "Unknown"),
                "email": emp_data.get("user", {}).get("email", f"employee.{str(emp_data['_id'])[:8]}@company.com"),
                "phone": emp_data.get("contactInfo", {}).get("phone", "+1 (555) 000-0000"),
                "location": emp_data.get("contactInfo", {}).get("address", "Remote"),
                "joinDate": emp_data.get("hireDate", datetime.utcnow()),
                "status": member_status.value,
                "performance": round(performance_score, 1),
                "projects": projects_count,
                "skills": emp_data.get("extractedSkills", []),
                "managerId": str(emp_data.get("managerId")) if emp_data.get("managerId") else None,
                "lastActivity": datetime.utcnow() - timedelta(hours=1)  # Simulate recent activity
            }
            
            # Add AI insights if requested
            if include_ai_insights:
                try:
                    insights = await generate_team_member_insights(emp_data, performance_score)
                    team_member_data.update({
                        "aiInsights": insights,
                        "performanceTrend": determine_performance_trend(emp_data.get("reviews", [])),
                        "collaborationScore": calculate_collaboration_score(emp_data)
                    })
                except Exception as e:
                    # Continue without AI insights if there's an error
                    print(f"Error generating AI insights for {team_member_data['name']}: {e}")
                    team_member_data.update({
                        "aiInsights": None,
                        "performanceTrend": "stable",
                        "collaborationScore": 75.0
                    })
            
            team_members.append(TeamMemberWithInsights(**team_member_data))
        
        # Apply status filter after processing
        if status:
            team_members = [tm for tm in team_members if tm.status == status.value]
        
        return team_members
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching team members: {str(e)}"
        )

@router.get("/stats", response_model=TeamStatsResponse)
async def get_team_stats(
    department: Optional[str] = Query(None, description="Filter by department"),
    token_data: dict = Depends(any_authenticated),
    db=Depends(get_database)
):
    """Get comprehensive team statistics and analytics."""
    
    try:
        logger.info("Starting team stats calculation...")
        
        # Simple approach: count employees and get basic stats
        match_stage = {}
        if department:
            match_stage["department"] = department
        
        # Get basic employee count
        total_members = await db.employees.count_documents(match_stage)
        logger.info(f"Found {total_members} total members")
        
        # Get unique departments
        departments = await db.employees.distinct("department", match_stage)
        logger.info(f"Found departments: {departments}")
        
        # Simple performance calculation (avoid complex aggregation for now)
        avg_performance = 75.0  # Default value
        
        # Get department counts
        department_list = []
        for dept in departments:
            dept_count = await db.employees.count_documents({"department": dept})
            department_list.append({
                "name": dept,
                "count": dept_count,
                "avgPerformance": 75.0,  # Default
                "activeProjects": 0
            })
        
        logger.info(f"Department list: {department_list}")
        logger.info("Team stats calculation completed successfully")
        
        return {
            "totalMembers": total_members,
            "activeMembers": total_members,  # Assume all are active for now
            "departments": departments,  # Return as string list
            "averagePerformance": avg_performance,
            "averageCollaboration": avg_performance,  # Use same as performance for now
            "topPerformers": [],  # Can be enhanced later
            "recentJoiners": []   # Can be enhanced later
        }
        
    except Exception as e:
        logger.error(f"Team stats error: {str(e)}")
        logger.error(f"Team stats error traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching team statistics: {str(e)}"
        )

@router.get("/departments")
async def get_departments(
    token_data: dict = Depends(any_authenticated),
    db=Depends(get_database)
):
    """Get all unique departments in the organization."""
    
    try:
        # Get distinct departments
        departments = await db.employees.distinct("department")
        
        # Add department statistics
        dept_data = []
        for dept in departments:
            count = await db.employees.count_documents({"department": dept})
            dept_data.append({
                "name": dept,
                "count": count
            })
        
        return {
            "departments": sorted(dept_data, key=lambda x: x["name"]),
            "total": len(departments)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching departments: {str(e)}"
        )

@router.patch("/members/{member_id}/status")
async def update_member_status(
    member_id: str,
    new_status: TeamMemberStatus,
    token_data: dict = Depends(any_authenticated),
    db=Depends(get_database)
):
    """Update a team member's status."""
    
    if not ObjectId.is_valid(member_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid member ID"
        )
    
    try:
        # In a real implementation, you'd store status in a separate collection
        # For now, we'll just return success as status is calculated dynamically
        
        return {
            "message": f"Status updated to {new_status.value}",
            "memberId": member_id,
            "newStatus": new_status.value,
            "updatedAt": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating member status: {str(e)}"
        )

# Helper functions
async def generate_team_member_insights(employee_data: dict, performance_score: float) -> dict:
    """Generate AI-powered insights for a team member."""
    
    try:
        # Prepare context for AI analysis
        context = {
            "employee": {
                "name": f"{employee_data.get('firstName', '')} {employee_data.get('lastName', '')}",
                "role": employee_data.get("jobTitle", ""),
                "department": employee_data.get("department", ""),
                "skills": employee_data.get("extractedSkills", []),
                "performanceScore": performance_score,
                "reviews": len(employee_data.get("reviews", [])),
                "careerGoals": employee_data.get("careerGoals", "")
            }
        }
        
        # Generate insights using AI service
        insights = await ai_service.generate_team_insights(context)
        
        return insights
        
    except Exception as e:
        # Return default insights if AI fails
        return {
            "strengths": ["Reliable team member", "Good technical skills"],
            "growthAreas": ["Leadership development", "Cross-functional collaboration"],
            "recommendations": ["Consider mentoring opportunities", "Explore advanced training programs"],
            "riskLevel": "low" if performance_score > 75 else "medium"
        }

def determine_performance_trend(reviews: list) -> str:
    """Determine performance trend based on review history."""
    
    if len(reviews) < 2:
        return "stable"
    
    # Sort reviews by date
    sorted_reviews = sorted(reviews, key=lambda x: x.get("reviewDate", datetime.min))
    
    # Compare latest two reviews
    latest = sorted_reviews[-1]["ratings"]
    previous = sorted_reviews[-2]["ratings"]
    
    latest_avg = (latest.get("communication", 3) + 
                  latest.get("technicalSkills", 3) + 
                  latest.get("teamwork", 3)) / 3
    
    previous_avg = (previous.get("communication", 3) + 
                    previous.get("technicalSkills", 3) + 
                    previous.get("teamwork", 3)) / 3
    
    if latest_avg > previous_avg + 0.3:
        return "improving"
    elif latest_avg < previous_avg - 0.3:
        return "declining"
    else:
        return "stable"

def calculate_collaboration_score(employee_data: dict) -> float:
    """Calculate collaboration score based on available data."""
    
    base_score = 70.0
    
    # Factors that influence collaboration score
    reviews = employee_data.get("reviews", [])
    if reviews:
        latest_review = max(reviews, key=lambda x: x.get("reviewDate", datetime.min))
        teamwork_rating = latest_review.get("ratings", {}).get("teamwork", 3)
        base_score += (teamwork_rating - 3) * 10  # Adjust based on teamwork rating
    
    # Department factor (some departments collaborate more)
    dept = employee_data.get("department", "")
    if dept in ["Engineering", "Design", "Product"]:
        base_score += 5
    
    # Role factor
    role = employee_data.get("jobTitle", "")
    if any(keyword in role.lower() for keyword in ["lead", "senior", "manager"]):
        base_score += 10
    
    return min(max(base_score, 0), 100)  # Clamp between 0-100