from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from security import get_current_user

router = APIRouter(prefix="/api/v1/teams", tags=["Teams"])

def build_team_dto(team: models.Team, db: Session) -> schemas.TeamDto:
    members_dto = []
    for m in team.members:
        user = m.user
        sp = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user.id).first() if user else None
        members_dto.append(schemas.TeamMemberDto(
            id=m.id,
            userId=user.id if user else 0,
            name=user.name if user else "Unknown",
            email=user.email if user else "",
            department=user.department if user else "",
            roleInTeam=m.role_in_team or "MEMBER",
            techRole=m.role_in_team or "Member",
            inviteStatus=m.invite_status,
            joinedAt=m.joined_at,
            rollNumber=sp.roll_number if sp else None,
            githubLink=sp.github_link if sp else None,
            linkedinLink=sp.linkedin_link if sp else None
        ))

    project_dto = None
    if team.project:
        p = team.project
        project_dto = schemas.ProjectDto(
            id=p.id,
            title=p.title,
            description=p.description,
            domain=p.domain,
            techStack=p.tech_stack,
            postedById=p.posted_by_id,
            postedByName=p.posted_by.name if p.posted_by else "Team",
            status=p.status,
            upvoteCount=p.upvote_count or 0,
            createdAt=p.created_at
        )

    return schemas.TeamDto(
        id=team.id,
        teamName=team.team_name,
        status=team.status,
        totalScore=team.total_score or 0,
        isAtRisk=team.is_at_risk or False,
        project=project_dto,
        members=members_dto,
        createdAt=team.created_at
    )


@router.get("/my", response_model=List[schemas.TeamDto])
def get_my_teams(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find accepted memberships
    memberships = db.query(models.TeamMember).filter(
        models.TeamMember.user_id == current_user.id,
        models.TeamMember.invite_status == "ACCEPTED"
    ).all()

    team_ids = [m.team_id for m in memberships]
    teams = db.query(models.Team).filter(
        models.Team.id.in_(team_ids),
        models.Team.status != "DISSOLVED"
    ).all()

    return [build_team_dto(t, db) for t in teams]


@router.get("/open", response_model=List[schemas.TeamDto])
def get_open_teams(db: Session = Depends(get_db)):
    teams = db.query(models.Team).filter(
        models.Team.status.in_(["FORMING", "RECRUITING"])
    ).all()
    return [build_team_dto(t, db) for t in teams]


@router.post("", response_model=schemas.TeamDto)
def create_team(
    req: schemas.TeamCreateRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if user already has an active team
    existing_mem = db.query(models.TeamMember).join(models.Team).filter(
        models.TeamMember.user_id == current_user.id,
        models.TeamMember.invite_status == "ACCEPTED",
        models.Team.status != "DISSOLVED"
    ).first()
    if existing_mem:
        raise HTTPException(status_code=400, detail="You already belong to an active team")

    # Create associated Project
    project = models.Project(
        tenant_id="INST-001",
        title=req.projectTitle,
        description=req.projectDescription,
        domain=req.domain or "Artificial Intelligence",
        tech_stack=req.techStack or "React, Python FastAPI, PostgreSQL",
        posted_by_id=current_user.id,
        status="APPROVED",
        upvote_count=0
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # Create Team
    team = models.Team(
        tenant_id="INST-001",
        team_name=req.teamName,
        project_id=project.id,
        status="FORMING",
        total_score=0,
        is_at_risk=False
    )
    db.add(team)
    db.commit()
    db.refresh(team)

    # Add Creator as LEADER
    leader_member = models.TeamMember(
        team_id=team.id,
        user_id=current_user.id,
        role_in_team=req.techRole or "LEADER",
        invite_status="ACCEPTED",
        membership_status="ACTIVE"
    )
    db.add(leader_member)

    # Seed Default Milestones
    default_milestones = [
        ("Problem Formulation & Scope Definition", "Define objectives, literature review, and architecture specifications."),
        ("Architecture Design & Module Specs", "Complete DB schema design, API contract specifications, and UI wireframes."),
        ("Alpha Prototype & Core Implementation", "Implement core functional pipelines, backend services, and interactive frontend."),
        ("Final Deployment & Capstone Showcase", "End-to-end integration testing, cloud deployment, and final viva presentation.")
    ]
    for title, desc in default_milestones:
        m = models.Milestone(team_id=team.id, title=title, description=desc, status="PENDING")
        db.add(m)

    db.commit()
    return build_team_dto(team, db)


@router.get("/available-students")
def get_available_students(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get students who are NOT in an accepted active team
    active_member_user_ids = db.query(models.TeamMember.user_id).join(models.Team).filter(
        models.TeamMember.invite_status == "ACCEPTED",
        models.Team.status != "DISSOLVED"
    ).all()
    active_ids = {row[0] for row in active_member_user_ids}
    active_ids.add(current_user.id)

    candidates = db.query(models.User).filter(
        models.User.role == "STUDENT",
        models.User.is_active == True,
        ~models.User.id.in_(active_ids)
    ).limit(30).all()

    res = []
    for u in candidates:
        sp = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == u.id).first()
        skills = db.query(models.UserSkill).filter(models.UserSkill.user_id == u.id).all()
        res.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "department": u.department,
            "domain": u.department,
            "yearOfStudy": sp.year_of_study if sp else 3,
            "skills": [s.skill.skill_name for s in skills if s.skill]
        })
    return res


@router.get("/students/{student_id}/profile")
def get_student_profile_for_teammates(
    student_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    sp = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == student_id).first()
    skills = db.query(models.UserSkill).filter(models.UserSkill.user_id == student_id).all()

    return {
        "userId": user.id,
        "name": user.name,
        "email": user.email,
        "department": user.department,
        "rollNumber": sp.roll_number if sp else None,
        "yearOfStudy": sp.year_of_study if sp else 3,
        "domain": user.department,
        "bio": sp.bio if sp else "",
        "githubLink": sp.github_link if sp else None,
        "linkedinLink": sp.linkedin_link if sp else None,
        "avatarUrl": user.avatar_url,
        "skills": [
            {
                "id": s.id,
                "skillName": s.skill.skill_name if s.skill else "General",
                "proficiencyLevel": s.proficiency_level
            }
            for s in skills
        ]
    }


@router.get("/{id}", response_model=schemas.TeamDto)
def get_team_by_id(id: int, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return build_team_dto(team, db)


@router.get("/{id}/join-requests")
def get_team_join_requests(
    id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    requests = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == id,
        models.TeamMember.invite_status == "PENDING"
    ).all()

    res = []
    for r in requests:
        u = r.user
        sp = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == u.id).first() if u else None
        res.append({
            "id": r.id,
            "userId": u.id if u else 0,
            "name": u.name if u else "Candidate",
            "email": u.email if u else "",
            "department": u.department if u else "",
            "techRole": r.role_in_team or "Full-Stack Developer",
            "rollNumber": sp.roll_number if sp else None,
            "githubLink": sp.github_link if sp else None,
            "linkedinLink": sp.linkedin_link if sp else None,
            "createdAt": r.joined_at
        })
    return res


@router.post("/{id}/join-request")
def create_join_request(
    id: int,
    req: schemas.JoinRequestCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    team = db.query(models.Team).filter(models.Team.id == id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    existing = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == id,
        models.TeamMember.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Request or membership already exists")

    member = models.TeamMember(
        team_id=id,
        user_id=current_user.id,
        role_in_team=req.techRole or "MEMBER",
        invite_status="PENDING"
    )
    db.add(member)

    # Notify Leader
    leader = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == id,
        models.TeamMember.role_in_team == "LEADER"
    ).first()
    if leader:
        notif = models.Notification(
            user_id=leader.user_id,
            message=f"{current_user.name} has requested to join your team '{team.team_name}'.",
            notification_type="TEAM_REQUEST"
        )
        db.add(notif)

    db.commit()
    return {"message": "Join request submitted successfully"}


@router.patch("/{id}/join-requests/{request_id}/respond")
def respond_join_request(
    id: int,
    request_id: int,
    req: schemas.JoinRequestRespond,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    membership = db.query(models.TeamMember).filter(
        models.TeamMember.id == request_id,
        models.TeamMember.team_id == id
    ).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Request not found")

    if req.accept:
        membership.invite_status = "ACCEPTED"
        membership.membership_status = "ACTIVE"
        membership.joined_at = datetime.utcnow()
        msg = f"Your request to join team has been accepted!"
    else:
        membership.invite_status = "REJECTED"
        msg = f"Your request to join team was declined."

    notif = models.Notification(
        user_id=membership.user_id,
        message=msg,
        notification_type="TEAM_REQUEST_RESULT"
    )
    db.add(notif)
    db.commit()
    return {"message": "Request processed successfully", "status": membership.invite_status}


@router.post("/{id}/invite/{student_id}")
def invite_student(
    id: int,
    student_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    team = db.query(models.Team).filter(models.Team.id == id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    existing = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == id,
        models.TeamMember.user_id == student_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student is already invited or a member")

    member = models.TeamMember(
        team_id=id,
        user_id=student_id,
        role_in_team="Team Member",
        invite_status="PENDING"
    )
    db.add(member)

    notif = models.Notification(
        user_id=student_id,
        message=f"You have been invited to join team '{team.team_name}' by {current_user.name}.",
        notification_type="TEAM_INVITE"
    )
    db.add(notif)
    db.commit()
    return {"message": "Invitation sent successfully"}


@router.delete("/{id}/members/{member_id}")
def remove_member(
    id: int,
    member_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    member = db.query(models.TeamMember).filter(
        models.TeamMember.id == member_id,
        models.TeamMember.team_id == id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    db.delete(member)
    db.commit()
    return {"message": "Member removed"}


@router.post("/{id}/dismantle")
def dismantle_team(
    id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    team = db.query(models.Team).filter(models.Team.id == id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    team.status = "DISSOLVED"
    db.commit()
    return {"message": "Team dismantled"}
