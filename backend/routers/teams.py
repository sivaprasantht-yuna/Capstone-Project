from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from security import get_current_user
from tenant import tenant_filter, get_user_tenant_id

router = APIRouter(prefix="/api/v1/teams", tags=["Teams"])

def build_team_dto(team: models.Team, db: Session) -> schemas.TeamDto:
    members_dto = []
    for m in team.members:
        user = m.user
        sp = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user.id).first() if user else None
        user_skills = db.query(models.UserSkill).filter(models.UserSkill.user_id == user.id).all() if user else []
        skills_list = [us.skill.skill_name for us in user_skills if us.skill and us.skill.skill_name] if user_skills else []
        members_dto.append(schemas.TeamMemberDto(
            id=m.id,
            userId=user.id if user else 0,
            name=user.name if user else "Member",
            email=user.email if user else "",
            department=user.department or "Computer Science and Engineering",
            roleInTeam=m.role_in_team or "MEMBER",
            techRole=m.role_in_team or "Full-Stack Developer",
            inviteStatus=m.invite_status,
            joinedAt=m.joined_at,
            rollNumber=sp.roll_number if (sp and sp.roll_number) else f"22CS{user.id:02d}" if user else "22CS01",
            bio=sp.bio if (sp and sp.bio) else "Passionate engineering student dedicated to collaborative team projects.",
            githubLink=sp.github_link if (sp and sp.github_link) else None,
            linkedinLink=sp.linkedin_link if (sp and sp.linkedin_link) else None,
            skills=skills_list if skills_list else ["React", "FastAPI", "Python", "PostgreSQL"]
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
def get_open_teams(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = tenant_filter(
        db.query(models.Team).filter(models.Team.status.in_(["FORMING", "RECRUITING"])),
        models.Team, get_user_tenant_id(current_user)
    )
    teams = query.all()
    return [build_team_dto(t, db) for t in teams]


@router.get("/pending-actions")
def get_pending_actions(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch dismantle and leave requests for teams mentored by this faculty or institutional requests
    if current_user.role in ["FACULTY", "ADMIN"]:
        mentored_teams = db.query(models.Mentorship).filter(
            models.Mentorship.faculty_id == current_user.id,
            models.Mentorship.status == "ACCEPTED"
        ).all()
        team_ids = [m.team_id for m in mentored_teams]
        
        if current_user.role == "ADMIN":
            gov_requests = db.query(models.TeamGovernanceRequest).filter(
                models.TeamGovernanceRequest.status == "PENDING"
            ).all()
        else:
            gov_requests = db.query(models.TeamGovernanceRequest).filter(
                models.TeamGovernanceRequest.team_id.in_(team_ids) if team_ids else False,
                models.TeamGovernanceRequest.status == "PENDING"
            ).all() if team_ids else []
    else:
        gov_requests = []

    dismantles = []
    removals = []
    for r in gov_requests:
        u = r.user
        t = r.team
        item = {
            "id": r.id,
            "teamId": r.team_id,
            "teamName": t.team_name if t else "Dissolved Team",
            "requestedBy": u.name if u else "Student",
            "reason": r.reason,
            "createdAt": r.created_at
        }
        if r.request_type == "DISMANTLE_TEAM":
            dismantles.append(item)
        else:
            removals.append(item)

    return {
        "dismantleRequests": dismantles,
        "removalRequests": removals
    }


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
    user_tenant = get_user_tenant_id(current_user)
    project = models.Project(
        tenant_id=user_tenant,
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
        tenant_id=user_tenant,
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
        models.User.tenant_id == get_user_tenant_id(current_user),
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
        "bio": sp.bio if (sp and sp.bio) else "Passionate engineering student dedicated to collaborative team projects.",
        "githubLink": sp.github_link.strip() if (sp and sp.github_link and sp.github_link.strip()) else None,
        "linkedinLink": sp.linkedin_link.strip() if (sp and sp.linkedin_link and sp.linkedin_link.strip()) else None,
        "avatarUrl": user.avatar_url,
        "skills": [s.skill.skill_name for s in skills if s.skill and s.skill.skill_name] or ["Python", "FastAPI", "React", "PostgreSQL"],
        "skillDetails": [
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


@router.post("/{id}/request-dismantle", response_model=schemas.TeamGovernanceRequestDto)
def request_dismantle_team(
    id: int,
    req: schemas.TeamGovernanceRequestCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    team = db.query(models.Team).filter(models.Team.id == id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Check that current user is the leader of this team
    leader_member = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == id,
        models.TeamMember.user_id == current_user.id,
        models.TeamMember.role_in_team.in_(["LEADER", "Team Lead"])
    ).first()
    if not leader_member:
        raise HTTPException(status_code=403, detail="Only the Team Leader can submit a team dismantle request.")

    if not req.reason or len(req.reason.strip()) < 5:
        raise HTTPException(status_code=400, detail="Please provide a detailed reason for dismantling the team.")

    # Check for existing pending request
    existing_req = db.query(models.TeamGovernanceRequest).filter(
        models.TeamGovernanceRequest.team_id == id,
        models.TeamGovernanceRequest.request_type == "DISMANTLE_TEAM",
        models.TeamGovernanceRequest.status == "PENDING"
    ).first()
    if existing_req:
        raise HTTPException(status_code=400, detail="A team dismantle request is already pending Institutional Admin approval.")

    gov_req = models.TeamGovernanceRequest(
        tenant_id=get_user_tenant_id(current_user),
        team_id=id,
        user_id=current_user.id,
        request_type="DISMANTLE_TEAM",
        reason=req.reason.strip(),
        status="PENDING"
    )
    team.status = "DISMANTLE_REQUESTED"
    db.add(gov_req)
    db.commit()
    db.refresh(gov_req)

    return schemas.TeamGovernanceRequestDto(
        id=gov_req.id,
        teamId=team.id,
        teamName=team.team_name,
        userId=current_user.id,
        userName=current_user.name,
        userRoleInTeam="LEADER",
        userDepartment=current_user.department or "Engineering",
        requestType="DISMANTLE_TEAM",
        reason=gov_req.reason,
        status=gov_req.status,
        createdAt=gov_req.created_at
    )


@router.post("/{id}/request-leave", response_model=schemas.TeamGovernanceRequestDto)
def request_leave_team(
    id: int,
    req: schemas.TeamGovernanceRequestCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    team = db.query(models.Team).filter(models.Team.id == id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Check that current user is a member of this team
    membership = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == id,
        models.TeamMember.user_id == current_user.id,
        models.TeamMember.invite_status == "ACCEPTED"
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="You are not an active member of this team.")

    if not req.reason or len(req.reason.strip()) < 5:
        raise HTTPException(status_code=400, detail="Please provide a detailed reason for requesting to leave the team.")

    # Check for existing pending leave request from this user
    existing_req = db.query(models.TeamGovernanceRequest).filter(
        models.TeamGovernanceRequest.team_id == id,
        models.TeamGovernanceRequest.user_id == current_user.id,
        models.TeamGovernanceRequest.request_type == "LEAVE_TEAM",
        models.TeamGovernanceRequest.status == "PENDING"
    ).first()
    if existing_req:
        raise HTTPException(status_code=400, detail="Your leave request is already pending Institutional Admin approval.")

    gov_req = models.TeamGovernanceRequest(
        tenant_id=get_user_tenant_id(current_user),
        team_id=id,
        user_id=current_user.id,
        request_type="LEAVE_TEAM",
        reason=req.reason.strip(),
        status="PENDING"
    )
    db.add(gov_req)
    db.commit()
    db.refresh(gov_req)

    return schemas.TeamGovernanceRequestDto(
        id=gov_req.id,
        teamId=team.id,
        teamName=team.team_name,
        userId=current_user.id,
        userName=current_user.name,
        userRoleInTeam=membership.role_in_team or "MEMBER",
        userDepartment=current_user.department or "Engineering",
        requestType="LEAVE_TEAM",
        reason=gov_req.reason,
        status=gov_req.status,
        createdAt=gov_req.created_at
    )


@router.get("/{id}/governance-requests", response_model=List[schemas.TeamGovernanceRequestDto])
def get_team_governance_requests(
    id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    requests = db.query(models.TeamGovernanceRequest).filter(
        models.TeamGovernanceRequest.team_id == id
    ).order_by(models.TeamGovernanceRequest.created_at.desc()).all()

    res = []
    for r in requests:
        u = r.user
        t = r.team
        res.append(schemas.TeamGovernanceRequestDto(
            id=r.id,
            teamId=r.team_id,
            teamName=t.team_name if t else "Team",
            userId=r.user_id,
            userName=u.name if u else "User",
            userRoleInTeam="LEADER" if r.request_type == "DISMANTLE_TEAM" else "MEMBER",
            userDepartment=u.department or "Engineering" if u else "Engineering",
            requestType=r.request_type,
            reason=r.reason,
            status=r.status,
            adminNotes=r.admin_notes,
            createdAt=r.created_at,
            reviewedAt=r.reviewed_at
        ))
    return res


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
