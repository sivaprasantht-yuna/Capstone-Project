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

    milestones = db.query(models.Milestone).filter(models.Milestone.team_id == team_id).all()
    tasks = db.query(models.StudentTask).filter(models.StudentTask.team_id == team_id).all()
    members = db.query(models.TeamMember).filter(models.TeamMember.team_id == team_id).all()

    total_milestones = len(milestones)
    completed_milestones = sum(1 for m in milestones if m.status in ["COMPLETED", "APPROVED"])
    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.status == "COMPLETED")

    progress_pct = 0.0
    if total_milestones > 0:
        progress_pct = round((completed_milestones / total_milestones) * 100, 1)

    return {
        "teamId": team.id,
        "teamName": team.team_name,
        "status": team.status,
        "totalScore": team.total_score,
        "isAtRisk": team.is_at_risk,
        "progressPercentage": progress_pct,
        "totalMilestones": total_milestones,
        "completedMilestones": completed_milestones,
        "totalTasks": total_tasks,
        "completedTasks": completed_tasks,
        "memberCount": len(members),
        "lastActivityAt": team.last_activity_at
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

    tasks = db.query(models.StudentTask).filter(
        models.StudentTask.team_id == team_id,
        models.StudentTask.assigned_to_id == student_id
    ).all()

    tasks_total = len(tasks)
    tasks_completed = sum(1 for t in tasks if t.status == "COMPLETED")
    points_earned = sum(t.point_value or 0 for t in tasks if t.status == "COMPLETED")

    contribution_pct = 0.0
    all_team_tasks = db.query(models.StudentTask).filter(models.StudentTask.team_id == team_id).all()
    if all_team_tasks:
        contribution_pct = round((len(tasks) / len(all_team_tasks)) * 100, 1)

    return {
        "studentId": student_id,
        "studentName": user.name,
        "teamId": team_id,
        "tasksTotal": tasks_total,
        "tasksCompleted": tasks_completed,
        "pointsEarned": points_earned,
        "contributionPercentage": contribution_pct,
        "membershipStatus": "ACTIVE"
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
