from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

# ─── Auth Schemas ─────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "STUDENT" # STUDENT, FACULTY, ADMIN
    department: Optional[str] = None
    rollNumber: Optional[str] = None
    yearOfStudy: Optional[int] = 3
    domain: Optional[str] = None
    skills: Optional[List[str]] = []
    designation: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshTokenRequest(BaseModel):
    refreshToken: str

class UserDto(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department: Optional[str] = None
    avatarUrl: Optional[str] = None
    accessToken: Optional[str] = None
    refreshToken: Optional[str] = None

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    accessToken: str
    refreshToken: str
    userId: int
    name: str
    email: str
    role: str
    department: Optional[str] = None


# ─── User & Profile Schemas ───────────────────────────────────────────────────
class UserSkillDto(BaseModel):
    id: Optional[int] = None
    skillName: str
    proficiencyLevel: int = 3
    category: Optional[str] = None

class StudentProfileDto(BaseModel):
    userId: int
    name: str
    email: str
    department: Optional[str] = None
    rollNumber: Optional[str] = None
    yearOfStudy: Optional[int] = 3
    domain: Optional[str] = None
    bio: Optional[str] = None
    githubLink: Optional[str] = None
    linkedinLink: Optional[str] = None
    avatarUrl: Optional[str] = None
    skills: List[UserSkillDto] = []

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    rollNumber: Optional[str] = None
    yearOfStudy: Optional[int] = None
    domain: Optional[str] = None
    bio: Optional[str] = None
    githubLink: Optional[str] = None
    linkedinLink: Optional[str] = None
    avatarUrl: Optional[str] = None
    skills: Optional[List[dict]] = None


# ─── Project Schemas ──────────────────────────────────────────────────────────
class ProjectCreateRequest(BaseModel):
    title: str
    description: str
    domain: Optional[str] = None
    techStack: Optional[str] = None

class ProjectDto(BaseModel):
    id: int
    title: str
    description: str
    domain: Optional[str] = None
    techStack: Optional[str] = None
    postedById: Optional[int] = None
    postedByName: Optional[str] = None
    status: str
    upvoteCount: int = 0
    ideaSimilarityScore: Optional[float] = None
    createdAt: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Team Schemas ─────────────────────────────────────────────────────────────
class TeamMemberDto(BaseModel):
    id: int
    userId: int
    name: str
    email: str
    department: Optional[str] = None
    roleInTeam: str # LEADER, MEMBER
    techRole: Optional[str] = None
    inviteStatus: str # PENDING, ACCEPTED, REJECTED
    joinedAt: Optional[datetime] = None
    rollNumber: Optional[str] = None
    bio: Optional[str] = None
    githubLink: Optional[str] = None
    linkedinLink: Optional[str] = None
    skills: List[str] = []

    class Config:
        from_attributes = True

class TeamCreateRequest(BaseModel):
    teamName: str
    projectTitle: str
    projectDescription: str
    domain: Optional[str] = None
    techStack: Optional[str] = None
    techRole: Optional[str] = "Full-Stack Developer"

class TeamDto(BaseModel):
    id: int
    teamName: str
    status: str
    totalScore: int = 0
    isAtRisk: bool = False
    project: Optional[ProjectDto] = None
    members: List[TeamMemberDto] = []
    createdAt: Optional[datetime] = None

class JoinRequestCreate(BaseModel):
    techRole: Optional[str] = "Team Member"
    message: Optional[str] = None

class JoinRequestRespond(BaseModel):
    accept: bool

class TeamGovernanceRequestCreate(BaseModel):
    reason: str

class TeamGovernanceReviewRequest(BaseModel):
    action: str # "APPROVE" or "REJECT"
    adminNotes: Optional[str] = None

class TeamGovernanceRequestDto(BaseModel):
    id: int
    teamId: int
    teamName: str
    userId: int
    userName: str
    userRoleInTeam: str
    userDepartment: str
    requestType: str # "DISMANTLE_TEAM" or "LEAVE_TEAM"
    reason: str
    status: str # "PENDING", "APPROVED", "REJECTED"
    adminNotes: Optional[str] = None
    createdAt: Optional[datetime] = None
    reviewedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Message & Chat Schemas ───────────────────────────────────────────────────
class SendMessageRequest(BaseModel):
    content: str
    type: Optional[str] = "TEXT"
    fileUrl: Optional[str] = None

class MessageDto(BaseModel):
    id: int
    teamId: int
    senderId: int
    senderName: str
    senderEmail: str
    senderRole: Optional[str] = None
    content: str
    type: str
    fileUrl: Optional[str] = None
    isRead: bool = False
    createdAt: datetime

    class Config:
        from_attributes = True


# ─── Milestone Schemas ────────────────────────────────────────────────────────
class MilestoneDto(BaseModel):
    id: int
    teamId: int
    title: str
    description: Optional[str] = None
    dueDate: Optional[datetime] = None
    status: str
    pointsReward: Optional[int] = None
    sequenceOrder: Optional[int] = None
    submittedAt: Optional[datetime] = None
    deliverableUrl: Optional[str] = None
    githubUrl: Optional[str] = None
    submissionRemarks: Optional[str] = None
    createdAt: Optional[datetime] = None

class MilestoneSubmitRequest(BaseModel):
    remarks: Optional[str] = None
    githubUrl: Optional[str] = None

class MilestoneGradeRequest(BaseModel):
    marks: Optional[float] = None
    pointsReward: Optional[int] = None
    feedback: Optional[str] = None
    feedbackData: Optional[dict] = None
    status: str = "APPROVED"

class MilestoneEvaluateRequest(MilestoneGradeRequest):
    pass


# ─── Notification Schemas ─────────────────────────────────────────────────────
class NotificationDto(BaseModel):
    id: int
    userId: int
    message: str
    type: str
    isRead: bool = False
    linkUrl: Optional[str] = None
    createdAt: datetime

    class Config:
        from_attributes = True
