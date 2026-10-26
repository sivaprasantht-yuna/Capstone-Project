import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, BigInteger, String, Boolean, Float, Text,
    DateTime, ForeignKey, Enum as SQLEnum, JSON
)
from sqlalchemy.orm import relationship
from database import Base

class Tenant(Base):
    """
    Institutional tenant for multi-college SaaS isolation (Model B).
    Each college is a tenant with allowed email domains and an opt-in showcase flag.
    """
    __tablename__ = "tenants"

    id = Column(String(64), primary_key=True)                        # e.g. "INST-BIT"
    name = Column(String(200), nullable=False)                       # "Bannari Amman Institute of Technology"
    email_domains = Column(Text, nullable=False)                     # "bitsathy.ac.in" (comma-separated)
    allow_public_showcase = Column(Boolean, default=False)           # Opt-in inter-college idea showcase
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(String(50), default="INST-001", nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="STUDENT", nullable=False)
    department = Column(String(100), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    is_verified = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    faculty_profile = relationship("FacultyProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    skills = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")
    team_memberships = relationship("TeamMember", back_populates="user")
    notifications = relationship("Notification", back_populates="user")


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    tenant_id = Column(String(64), default="INST-001", nullable=True)
    roll_number = Column(String(50), nullable=True)
    year_of_study = Column(Integer, default=3)
    bio = Column(String(1000), nullable=True)
    github_link = Column(String(255), nullable=True)
    linkedin_link = Column(String(255), nullable=True)
    is_looking_for_team = Column(Boolean, default=True, nullable=True)
    resume_link = Column(String(255), nullable=True)
    total_points = Column(Integer, default=0, nullable=True)

    user = relationship("User", back_populates="student_profile")


class FacultyProfile(Base):
    __tablename__ = "faculty_profiles"

    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    designation = Column(String(100), default="Associate Professor")
    max_team_capacity = Column(Integer, default=5)
    current_team_count = Column(Integer, default=0)
    availability_status = Column(String(50), default="AVAILABLE")
    office_location = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    mentor_rating = Column(Float, default=4.8)
    total_ratings = Column(Integer, default=0)

    user = relationship("User", back_populates="faculty_profile")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    skill_name = Column(String(100), unique=True, nullable=False)
    category = Column(String(50), nullable=True)

    user_skills = relationship("UserSkill", back_populates="skill")


class UserSkill(Base):
    __tablename__ = "user_skills"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(BigInteger, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(String(50), default="INST-001", nullable=False)
    proficiency_level = Column(Integer, default=3)

    user = relationship("User", back_populates="skills")
    skill = relationship("Skill", back_populates="user_skills")


class Project(Base):
    __tablename__ = "projects"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(String(50), default="INST-001", nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    domain = Column(String(100), nullable=True)
    tech_stack = Column(String(255), nullable=True)
    posted_by_id = Column("posted_by", BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="APPROVED", nullable=False)
    upvote_count = Column(Integer, default=0)
    similarity_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    posted_by = relationship("User")
    team = relationship("Team", back_populates="project", uselist=False)


class Team(Base):
    __tablename__ = "teams"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(String(50), default="INST-001", nullable=False)
    team_name = Column(String(150), nullable=False)
    project_id = Column(BigInteger, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="FORMING", nullable=False)
    total_score = Column(Integer, default=0)
    is_at_risk = Column(Boolean, default=False)
    last_activity_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="team")
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    milestones = relationship("Milestone", back_populates="team", cascade="all, delete-orphan")
    mentorships = relationship("Mentorship", back_populates="team", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="team", cascade="all, delete-orphan")


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(String(50), default="INST-001", nullable=False)
    team_id = Column(BigInteger, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role_in_team = Column(String(100), default="MEMBER", nullable=True) # LEADER or MEMBER
    invite_status = Column(String(50), default="ACCEPTED", nullable=False) # PENDING, ACCEPTED, REJECTED
    membership_status = Column(String(50), default="ACTIVE", nullable=True) # ACTIVE, INACTIVE, LEFT
    joined_at = Column(DateTime, default=datetime.utcnow)

    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="team_memberships")


class TeamGovernanceRequest(Base):
    __tablename__ = "team_governance_requests"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(String(50), default="INST-001", nullable=False)
    team_id = Column(BigInteger, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    request_type = Column(String(50), nullable=False) # 'DISMANTLE_TEAM' or 'LEAVE_TEAM'
    reason = Column(Text, nullable=False)
    status = Column(String(50), default="PENDING", nullable=False) # 'PENDING', 'APPROVED', 'REJECTED'
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)

    team = relationship("Team")
    user = relationship("User")


class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(String(64), default="INST-001", nullable=False)
    team_id = Column(BigInteger, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="PENDING", nullable=False)
    points_reward = Column(Integer, nullable=True)
    sequence_order = Column(Integer, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    team = relationship("Team", back_populates="milestones")


class Mentorship(Base):
    __tablename__ = "mentorships"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(String(50), default="INST-001", nullable=False)
    team_id = Column(BigInteger, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    faculty_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="PENDING", nullable=False)
    match_score = Column(Float, nullable=True)
    matching_skills = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    team = relationship("Team", back_populates="mentorships")
    faculty = relationship("User")


class Message(Base):
    __tablename__ = "messages"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(String(64), default="INST-001", nullable=False)
    team_id = Column(BigInteger, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    type = Column(String(255), default="TEXT", nullable=True)
    file_url = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    team = relationship("Team", back_populates="messages")
    sender = relationship("User")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(String(50), default="INST-001", nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column("notification_type", String(50), default="INFO", nullable=True)
    reference_id = Column(BigInteger, nullable=True)
    reference_type = Column(String(50), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class StudentTask(Base):
    __tablename__ = "student_tasks"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(String(64), default="INST-001", nullable=False)
    team_id = Column(BigInteger, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    assigned_to_id = Column("assigned_to", BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assigned_by_id = Column("assigned_by", BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=True)
    point_value = Column(Integer, default=10)
    status = Column(String(255), default="TODO", nullable=False) # TODO, IN_PROGRESS, COMPLETED, BLOCKED
    completion_note = Column(Text, nullable=True)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    team = relationship("Team")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])
    evidence = relationship("ProjectEvidence", back_populates="task", cascade="all, delete-orphan")


class ProjectEvidence(Base):
    __tablename__ = "project_evidence"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(String(64), default="INST-001", nullable=False)
    team_id = Column(BigInteger, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    task_id = Column(BigInteger, ForeignKey("student_tasks.id", ondelete="SET NULL"), nullable=True)
    milestone_id = Column(BigInteger, ForeignKey("milestones.id", ondelete="SET NULL"), nullable=True)
    uploaded_by_id = Column("uploaded_by", BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    verified_by_id = Column("verified_by", BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    evidence_type = Column(String(255), default="CODE_COMMIT", nullable=False)
    file_url = Column(Text, nullable=True)
    verification_status = Column(String(255), default="PENDING", nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    team = relationship("Team")
    task = relationship("StudentTask", back_populates="evidence")
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])
    verified_by = relationship("User", foreign_keys=[verified_by_id])

class Event(Base):
    __tablename__ = "events"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(String(64), default="INST-001", nullable=False)
    team_id = Column(BigInteger, ForeignKey("teams.id", ondelete="CASCADE"), nullable=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    event_type = Column(String(50), nullable=False)
    event_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(String(64), default="INST-001", nullable=False)
    mentor_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    milestone_id = Column(BigInteger, ForeignKey("milestones.id", ondelete="CASCADE"), nullable=False)
    total_marks = Column(Float, default=0.0)
    max_marks = Column(Float, default=100.0)
    feedback = Column(Text, nullable=True)
    feedback_data = Column(JSON, nullable=True)
    is_published = Column(Boolean, default=False)
    evaluated_at = Column(DateTime, default=datetime.utcnow)


class StudentContribution(Base):
    __tablename__ = "student_contributions"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    student_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    team_id = Column(BigInteger, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    tasks_total = Column(Integer, default=0)
    tasks_completed = Column(Integer, default=0)
    milestones_contributed = Column(Integer, default=0)
    contribution_percentage = Column(Float, default=0.0)
    membership_status = Column(String(255), default="ACTIVE")
    last_updated = Column(DateTime, default=datetime.utcnow)

