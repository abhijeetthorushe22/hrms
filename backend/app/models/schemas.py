from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from typing import Optional, List, Dict, Any, Annotated
from datetime import datetime
from enum import Enum
from bson import ObjectId

# Simple ObjectId handling - using string representation
def validate_object_id(v: str) -> str:
    """Validate ObjectId string."""
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, str):
        if ObjectId.is_valid(v):
            return v
        raise ValueError("Invalid ObjectId format")
    raise ValueError("ObjectId must be a valid ObjectId string")

class UserRole(str, Enum):
    """User role enumeration."""
    ADMIN = "admin"
    MANAGER = "manager"
    RECRUITER = "recruiter"
    EMPLOYEE = "employee"

class JobStatus(str, Enum):
    """Job posting status enumeration."""
    OPEN = "open"
    CLOSED = "closed"

class CandidateStatus(str, Enum):
    """Candidate status enumeration."""
    NEW = "new"
    SCREENING = "screening"
    INTERVIEW = "interview"
    HIRED = "hired"
    REJECTED = "rejected"

# Base Models
class MongoBaseModel(BaseModel):
    """Base model for MongoDB documents."""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        str_strip_whitespace=True
    )
    
    id: Optional[str] = Field(default=None, alias="_id")

# User Models
class UserBase(BaseModel):
    """Base user model."""
    email: EmailStr
    role: UserRole

class UserCreate(BaseModel):
    """User creation model."""
    email: EmailStr
    password: str
    role: UserRole = UserRole.EMPLOYEE

class UserLogin(BaseModel):
    """User login model."""
    email: EmailStr
    password: str

class User(MongoBaseModel, UserBase):
    """User database model."""
    password: str
    employee_id: Optional[str] = Field(None, alias="employeeId")
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="createdAt")

class UserResponse(UserBase):
    """User response model (without password)."""
    id: str
    employee_id: Optional[str] = None
    created_at: datetime

# Employee Models
class ContactInfo(BaseModel):
    """Contact information model."""
    phone: Optional[str] = None
    address: Optional[str] = None

class EmployeeBase(BaseModel):
    """Base employee model."""
    first_name: str = Field(..., alias="firstName")
    last_name: str = Field(..., alias="lastName")
    job_title: str = Field(..., alias="jobTitle")
    department: str
    contact_info: Optional[ContactInfo] = Field(None, alias="contactInfo")
    extracted_skills: List[str] = Field(default_factory=list, alias="extractedSkills")
    career_goals: Optional[str] = Field(None, alias="careerGoals")

class EmployeeCreate(EmployeeBase):
    """Employee creation model."""
    manager_id: Optional[str] = Field(None, alias="managerId")
    hire_date: datetime = Field(..., alias="hireDate")

class Employee(MongoBaseModel, EmployeeBase):
    """Employee database model."""
    manager_id: Optional[str] = Field(None, alias="managerId")
    hire_date: datetime = Field(..., alias="hireDate")
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="createdAt")

# Job Posting Models
class JobPostingBase(BaseModel):
    """Base job posting model."""
    title: str
    department: str
    description: str
    requirements: List[str] = Field(default_factory=list)
    location: Optional[str] = "Remote"
    salary_range: Optional[str] = Field(default="Competitive", alias="salaryRange")
    employment_type: Optional[str] = Field(default="full-time", alias="employmentType")

class JobPostingCreate(JobPostingBase):
    """Job posting creation model."""
    pass

class JobPosting(MongoBaseModel, JobPostingBase):
    """Job posting database model."""
    posted_by: Optional[str] = Field(default=None, alias="postedBy")
    posted_at: datetime = Field(default_factory=datetime.utcnow, alias="postedAt")
    is_active: bool = Field(default=True, alias="isActive")
    description_vector: Optional[List[float]] = Field(None, alias="descriptionVector")
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="createdAt")

# Candidate Models
class CandidateBase(BaseModel):
    """Base candidate model."""
    name: str
    email: EmailStr
    phone: Optional[str] = None

class CandidateCreate(CandidateBase):
    """Candidate creation model."""
    job_posting_id: str = Field(..., alias="jobPostingId")

class Candidate(MongoBaseModel, CandidateBase):
    """Candidate database model."""
    job_posting_id: str = Field(..., alias="jobPostingId")
    resume_s3_key: Optional[str] = Field(None, alias="resumeS3Key")
    extracted_text: Optional[str] = Field(None, alias="extractedText")
    chroma_vector_id: Optional[str] = Field(None, alias="chromaVectorId")
    match_score: Optional[float] = Field(None, alias="matchScore")
    status: CandidateStatus = CandidateStatus.NEW
    interview_summary: Optional[str] = Field(None, alias="interviewSummary")
    applied_at: datetime = Field(default_factory=datetime.utcnow, alias="appliedAt")

# Performance Review Models
class Ratings(BaseModel):
    """Performance ratings model."""
    communication: int = Field(..., ge=1, le=5)
    technical_skills: int = Field(..., ge=1, le=5, alias="technicalSkills")
    teamwork: int = Field(..., ge=1, le=5)

class PerformanceReviewBase(BaseModel):
    """Base performance review model."""
    ratings: Ratings
    feedback_text: str = Field(..., alias="feedbackText")

class PerformanceReviewCreate(PerformanceReviewBase):
    """Performance review creation model."""
    employee_id: str = Field(..., alias="employeeId")

class PerformanceReview(MongoBaseModel, PerformanceReviewBase):
    """Performance review database model."""
    employee_id: str = Field(..., alias="employeeId")
    reviewer_id: str = Field(..., alias="reviewerId")
    review_date: datetime = Field(default_factory=datetime.utcnow, alias="reviewDate")

# Development Plan Models
class GrowthArea(BaseModel):
    """Growth area model for development plans."""
    area: str
    justification: str
    learning_resources: List[str] = Field(..., alias="learningResources")
    internal_actions: List[str] = Field(..., alias="internalActions")

class DevelopmentPlanContent(BaseModel):
    """Development plan content model."""
    growth_areas: List[GrowthArea] = Field(..., alias="growthAreas")

class DevelopmentPlan(MongoBaseModel):
    """Development plan database model."""
    employee_id: str = Field(..., alias="employeeId")
    generated_at: datetime = Field(default_factory=datetime.utcnow, alias="generatedAt")
    plan_json: DevelopmentPlanContent = Field(..., alias="planJson")

# Team Member Models
class TeamMemberStatus(str, Enum):
    """Team member status enumeration."""
    ACTIVE = "active"
    AWAY = "away"
    BUSY = "busy"
    OFFLINE = "offline"

class TeamMemberBase(BaseModel):
    """Base team member model."""
    name: str
    role: str
    department: str
    email: EmailStr
    phone: Optional[str] = None
    location: Optional[str] = None
    avatar: Optional[str] = None
    status: TeamMemberStatus = TeamMemberStatus.ACTIVE

class TeamMember(MongoBaseModel, TeamMemberBase):
    """Team member with performance metrics."""
    employee_id: str = Field(..., alias="employeeId")
    join_date: datetime = Field(..., alias="joinDate")
    performance: float = Field(default=0.0, ge=0, le=100)  # 0-100 percentage
    projects: int = Field(default=0, ge=0)
    last_activity: Optional[datetime] = Field(None, alias="lastActivity")
    skills: List[str] = Field(default_factory=list)
    manager_id: Optional[str] = Field(None, alias="managerId")

class TeamMemberWithInsights(TeamMember):
    """Team member with AI-powered insights."""
    ai_insights: Optional[Dict[str, Any]] = Field(None, alias="aiInsights")
    performance_trend: Optional[str] = Field(None, alias="performanceTrend")  # "improving", "stable", "declining"
    collaboration_score: Optional[float] = Field(None, alias="collaborationScore")

class TeamStatsResponse(BaseModel):
    """Team statistics response."""
    total_members: int = Field(..., alias="totalMembers")
    active_members: int = Field(..., alias="activeMembers")
    departments: List[str]
    average_performance: float = Field(..., alias="averagePerformance")
    average_collaboration: float = Field(..., alias="averageCollaboration")
    top_performers: List[TeamMember] = Field(..., alias="topPerformers")
    recent_joiners: List[TeamMember] = Field(..., alias="recentJoiners")

# Chat Models
class ChatMessage(BaseModel):
    """Chat message model."""
    message: str

class ChatResponse(BaseModel):
    """Chat response model."""
    reply: str

class ChatStart(BaseModel):
    """Chat start response model."""
    chat_id: str = Field(..., alias="chatId")
    first_message: str = Field(..., alias="firstMessage")

# Token Models
class Token(BaseModel):
    """JWT token model."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# API Response Models
class APIResponse(BaseModel):
    """Generic API response model."""
    message: str
    data: Optional[Any] = None
    success: bool = True

class FileUploadResponse(BaseModel):
    """File upload response model."""
    message: str
    candidate_id: str = Field(..., alias="candidateId")

# Document Models
class DocumentBase(BaseModel):
    """Base document model."""
    filename: str
    document_type: str = Field(default="general", alias="documentType")
    description: Optional[str] = ""
    employee_id: Optional[str] = Field(default=None, alias="employeeId")

class DocumentCreate(DocumentBase):
    """Document creation model."""
    pass

class Document(MongoBaseModel, DocumentBase):
    """Document response model."""
    stored_filename: str = Field(..., alias="storedFilename")
    file_path: str = Field(..., alias="filePath")
    file_size: int = Field(..., alias="fileSize")
    mime_type: Optional[str] = Field(default=None, alias="mimeType")
    uploaded_by: str = Field(..., alias="uploadedBy")
    uploaded_at: datetime = Field(..., alias="uploadedAt")