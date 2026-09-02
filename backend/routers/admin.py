from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models
from security import get_current_user, require_role

router = APIRouter(prefix="/api/v1/admin", tags=["Admin & Oversight"])

@router.get("/analytics/overview")
def get_admin_overview(
    current_user: models.User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Returns all KPI analytics data for the admin overview dashboard."""
    total_students = db.query(models.User).filter(models.User.role == "STUDENT").count()
    total_faculty = db.query(models.User).filter(models.User.role == "FACULTY").count()
    total_projects = db.query(models.Project).count()
    total_teams = db.query(models.Team).count()
    active_teams = db.query(models.Team).filter(models.Team.status == "ACTIVE").count()
    completed_teams = db.query(models.Team).filter(models.Team.status == "COMPLETED").count()
    at_risk_teams = db.query(models.Team).filter(models.Team.is_at_risk == True).count()

    # Domain distribution
    projects = db.query(models.Project).all()
    domain_counts: Dict[str, int] = {}
    for p in projects:
        d = p.domain or "General"
        domain_counts[d] = domain_counts.get(d, 0) + 1

    # Mentor load distribution
    faculty_profiles = db.query(models.FacultyProfile).all()
    mentor_load = []
    for fp in faculty_profiles:
        u = fp.user
        max_cap = fp.max_team_capacity or 5
        curr_load = fp.current_team_count or 0
        mentor_load.append({
            "facultyId": fp.user_id,
            "name": u.name if u else f"Faculty #{fp.user_id}",
            "currentLoad": curr_load,
            "maxCapacity": max_cap,
            "utilizationPct": round((curr_load * 100.0 / max_cap), 1) if max_cap > 0 else 0
        })

    # Department participation
    students = db.query(models.User).filter(models.User.role == "STUDENT").all()
    dept_participation: Dict[str, int] = {}
    for s in students:
        dept = s.department or "General"
        dept_participation[dept] = dept_participation.get(dept, 0) + 1

    return {
        "totalStudents": total_students,
        "totalFaculty": total_faculty,
        "totalProjects": total_projects,
        "totalTeams": total_teams,
        "activeTeams": active_teams,
        "completedTeams": completed_teams,
        "atRiskTeams": at_risk_teams,
        "domainDistribution": domain_counts,
        "mentorLoadDistribution": mentor_load,
        "departmentParticipation": dept_participation
    }


@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db)):
    total_students = db.query(models.User).filter(models.User.role == "STUDENT").count()
    total_faculty = db.query(models.User).filter(models.User.role == "FACULTY").count()
    total_teams = db.query(models.Team).count()
    total_projects = db.query(models.Project).count()
    active_teams = db.query(models.Team).filter(models.Team.status != "DISSOLVED").count()

    return {
        "totalStudents": total_students,
        "totalFaculty": total_faculty,
        "totalTeams": total_teams,
        "activeTeams": active_teams,
        "totalProjects": total_projects
    }


@router.get("/teams")
def get_all_teams(
    current_user: models.User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    teams = db.query(models.Team).all()
    res = []
    for t in teams:
        res.append({
            "id": t.id,
            "teamName": t.team_name,
            "status": t.status,
            "totalScore": t.total_score or 0,
            "isAtRisk": t.is_at_risk or False,
            "memberCount": len(t.members),
            "projectTitle": t.project.title if t.project else "No Project",
            "createdAt": t.created_at
        })
    return res


@router.get("/at-risk-teams")
def get_at_risk_teams(
    current_user: models.User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    teams = db.query(models.Team).filter(models.Team.is_at_risk == True).all()
    res = []
    for t in teams:
        res.append({
            "id": t.id,
            "teamName": t.team_name,
            "status": t.status,
            "totalScore": t.total_score or 0,
            "isAtRisk": True,
            "memberCount": len(t.members),
            "createdAt": t.created_at
        })
    return res
