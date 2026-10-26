from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from security import get_current_user

router = APIRouter(prefix="/api/v1/progress", tags=["Progress & Analytics"])

@router.get("/team/{team_id}")
def get_team_progress(
    team_id: int,
    db: Session = Depends(get_db)
):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    milestones = db.query(models.Milestone).filter(
        models.Milestone.team_id == team_id
    ).order_by(models.Milestone.sequence_order.asc(), models.Milestone.id.asc()).all()
    tasks = db.query(models.StudentTask).filter(models.StudentTask.team_id == team_id).all()
    members = db.query(models.TeamMember).filter(models.TeamMember.team_id == team_id).all()

    total_milestones = len(milestones)
    completed_milestones = sum(1 for m in milestones if (m.status or "").upper() in ["COMPLETED", "APPROVED"])
    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if (t.status or "").upper() == "COMPLETED")
    in_progress_tasks = sum(1 for t in tasks if (t.status or "").upper() == "IN_PROGRESS")
    pending_tasks = sum(1 for t in tasks if (t.status or "").upper() in ["PENDING", "TODO"])
    overdue_tasks = sum(1 for t in tasks if t.due_date and t.due_date < datetime.utcnow() and (t.status or "").upper() != "COMPLETED")

    progress_pct = 0.0
    if total_milestones > 0:
        progress_pct = round((completed_milestones / total_milestones) * 100, 1)

    milestones_data = [
        {
            "id": m.id,
            "title": m.title,
            "description": m.description or "",
            "status": m.status or "PENDING",
            "dueDate": m.due_date.isoformat() if m.due_date else None,
            "sequenceOrder": m.sequence_order or (idx + 1),
            "submittedAt": m.submitted_at.isoformat() if m.submitted_at else None,
        }
        for idx, m in enumerate(milestones)
    ]

    contributions_data = []
    for member in members:
        u = member.user
        if not u:
            continue
        user_tasks = [t for t in tasks if t.assigned_to_id == u.id]
        user_completed = sum(1 for t in user_tasks if (t.status or "").upper() == "COMPLETED")
        contrib_pct = round((len(user_tasks) / total_tasks * 100), 1) if total_tasks > 0 else (
            round(100.0 / len(members), 1) if members else 0.0
        )
        contributions_data.append({
            "studentId": u.id,
            "studentName": u.name or "Student",
            "avatarInitial": (u.name[0].upper() if u.name else "U"),
            "contributionPercentage": contrib_pct,
            "tasksCompleted": user_completed,
            "tasksTotal": len(user_tasks),
            "membershipStatus": getattr(member, "membership_status", "ACTIVE") or "ACTIVE"
        })

    # Mentorship is mapped through team.mentorships relationship
    has_mentor = False
    if team.mentorships:
        has_mentor = any(getattr(ms, "status", "") == "ACCEPTED" for ms in team.mentorships)

    project_title = "Capstone Project"
    if team.project and team.project.title:
        project_title = team.project.title

    team_health = "ON_TRACK"
    if team.is_at_risk or overdue_tasks > 2:
        team_health = "AT_RISK"
    elif overdue_tasks > 0 or (total_tasks > 0 and completed_tasks == 0):
        team_health = "NEEDS_ATTENTION"

    current_phase = "INITIALIZATION"
    if progress_pct >= 100:
        current_phase = "COMPLETED"
    elif progress_pct >= 60:
        current_phase = "TESTING & EVALUATION"
    elif progress_pct >= 25:
        current_phase = "DEVELOPMENT"
    elif total_milestones > 0:
        current_phase = "PLANNING"

    return {
        "teamId": team.id,
        "teamName": team.team_name,
        "teamStatus": team.status,
        "status": team.status,
        "projectTitle": project_title,
        "totalScore": team.total_score or 0,
        "isAtRisk": bool(team.is_at_risk),
        "teamHealth": team_health,
        "currentPhase": current_phase,
        "progressPercentage": progress_pct,
        "overallProgress": progress_pct,
        "totalMilestones": total_milestones,
        "completedMilestones": completed_milestones,
        "totalTasks": total_tasks,
        "completedTasks": completed_tasks,
        "inProgressTasks": in_progress_tasks,
        "pendingTasks": pending_tasks,
        "overdueTasks": overdue_tasks,
        "evidenceSubmitted": 0,
        "memberCount": len(members),
        "hasMentor": has_mentor,
        "milestones": milestones_data,
        "contributions": contributions_data,
        "createdAt": team.created_at.isoformat() if team.created_at else None,
        "lastActivityAt": team.last_activity_at.isoformat() if team.last_activity_at else None
    }


@router.get("/team/{team_id}/timeline")
def get_team_timeline(
    team_id: int,
    db: Session = Depends(get_db)
):
    events = db.query(models.Event).filter(
        models.Event.team_id == team_id
    ).order_by(models.Event.created_at.desc()).limit(30).all()

    if not events:
        # Fallback to team creation / message milestones
        return [
            {
                "id": 1,
                "eventType": "TEAM_CREATED",
                "title": "Team Initialized",
                "description": "Team workspace was created.",
                "timestamp": datetime.utcnow()
            }
        ]

    return [
        {
            "id": e.id,
            "eventType": e.event_type,
            "data": e.event_data,
            "timestamp": e.created_at
        }
        for e in events
    ]


@router.get("/student/{student_id}/team/{team_id}")
def get_student_progress(
    student_id: int,
    team_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    team = db.query(models.Team).filter(models.Team.id == team_id).first()

    tasks = db.query(models.StudentTask).filter(
        models.StudentTask.team_id == team_id,
        models.StudentTask.assigned_to_id == student_id
    ).all()

    tasks_total = len(tasks)
    tasks_completed = sum(1 for t in tasks if (t.status or "").upper() == "COMPLETED")
    tasks_in_progress = sum(1 for t in tasks if (t.status or "").upper() == "IN_PROGRESS")
    tasks_pending = sum(1 for t in tasks if (t.status or "").upper() in ["PENDING", "TODO"])
    tasks_overdue = sum(1 for t in tasks if t.due_date and t.due_date < datetime.utcnow() and (t.status or "").upper() != "COMPLETED")
    points_earned = sum(t.point_value or 0 for t in tasks if (t.status or "").upper() == "COMPLETED")

    contribution_pct = 0.0
    all_team_tasks = db.query(models.StudentTask).filter(models.StudentTask.team_id == team_id).all()
    if all_team_tasks:
        contribution_pct = round((len(tasks) / len(all_team_tasks)) * 100, 1)

    task_history_data = []
    for t in tasks:
        assigned_at = getattr(t, "assigned_at", None) or getattr(t, "created_at", None) or datetime.utcnow()
        task_history_data.append({
            "id": t.id,
            "title": t.title,
            "description": t.description or "",
            "status": t.status,
            "dueDate": t.due_date.isoformat() if t.due_date else None,
            "assignedAt": assigned_at.isoformat() if isinstance(assigned_at, datetime) else str(assigned_at),
            "completedAt": t.completed_at.isoformat() if t.completed_at else None,
            "teamId": team_id,
            "teamName": team.team_name if team else "Team",
            "pointValue": t.point_value or 10
        })

    evidences = db.query(models.ProjectEvidence).filter(
        models.ProjectEvidence.team_id == team_id,
        models.ProjectEvidence.uploaded_by_id == student_id
    ).all()

    evidence_data = [
        {
            "id": ev.id,
            "title": ev.title or "Project Evidence",
            "description": ev.description or "",
            "evidenceType": ev.evidence_type or "DOCUMENT",
            "fileUrl": ev.file_url,
            "submittedAt": ev.submitted_at.isoformat() if ev.submitted_at else datetime.utcnow().isoformat(),
            "verificationStatus": ev.verification_status or "PENDING",
            "taskTitle": None
        }
        for ev in evidences
    ]

    return {
        "studentId": student_id,
        "studentName": user.name or "Student",
        "department": user.department or "Engineering",
        "email": user.email or "",
        "teamId": team_id,
        "personalProgress": contribution_pct,
        "tasksTotal": tasks_total,
        "tasksCompleted": tasks_completed,
        "tasksInProgress": tasks_in_progress,
        "tasksPending": tasks_pending,
        "tasksOverdue": tasks_overdue,
        "pointsEarned": points_earned,
        "contributionPercentage": contribution_pct,
        "membershipStatus": "ACTIVE",
        "taskHistory": task_history_data,
        "evidence": evidence_data
    }


@router.get("/student/me/team/{team_id}")
def get_my_team_progress(
    team_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_student_progress(current_user.id, team_id, db)


@router.get("/student/{student_id}/history")
def get_student_history(
    student_id: int,
    db: Session = Depends(get_db)
):
    memberships = db.query(models.TeamMember).filter(
        models.TeamMember.user_id == student_id
    ).all()

    res = []
    for m in memberships:
        team = m.team
        if team:
            project = team.project
            res.append({
                "teamId": team.id,
                "teamName": team.team_name,
                "projectTitle": project.title if project else "General Project",
                "roleInTeam": m.role_in_team or "MEMBER",
                "status": team.status,
                "joinedAt": m.joined_at,
                "totalScore": team.total_score
            })
    return res


@router.get("/student/me/history")
def get_my_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_student_history(current_user.id, db)
