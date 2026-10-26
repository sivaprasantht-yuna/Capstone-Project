import csv
import io
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models
from security import get_current_user, require_role
from tenant import tenant_filter, get_user_tenant_id

router = APIRouter(prefix="/api/v1/admin", tags=["Admin & Oversight"])

@router.get("/analytics/overview")
def get_admin_overview(
    current_user: models.User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Returns all KPI analytics data for the admin overview dashboard (tenant-scoped)."""
    tid = get_user_tenant_id(current_user)
    total_students = tenant_filter(db.query(models.User).filter(models.User.role == "STUDENT"), models.User, tid).count()
    total_faculty = tenant_filter(db.query(models.User).filter(models.User.role == "FACULTY"), models.User, tid).count()
    total_projects = tenant_filter(db.query(models.Project), models.Project, tid).count()
    total_teams = tenant_filter(db.query(models.Team), models.Team, tid).count()
    active_teams = tenant_filter(db.query(models.Team).filter(models.Team.status == "ACTIVE"), models.Team, tid).count()
    completed_teams = tenant_filter(db.query(models.Team).filter(models.Team.status == "COMPLETED"), models.Team, tid).count()
    at_risk_teams = tenant_filter(db.query(models.Team).filter(models.Team.is_at_risk == True), models.Team, tid).count()

    # Domain distribution (tenant-scoped)
    projects = tenant_filter(db.query(models.Project), models.Project, tid).all()
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

    # Department participation (tenant-scoped)
    students = tenant_filter(db.query(models.User).filter(models.User.role == "STUDENT"), models.User, tid).all()
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
def get_admin_stats(
    current_user: models.User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    tid = get_user_tenant_id(current_user)
    total_students = tenant_filter(db.query(models.User).filter(models.User.role == "STUDENT"), models.User, tid).count()
    total_faculty = tenant_filter(db.query(models.User).filter(models.User.role == "FACULTY"), models.User, tid).count()
    total_teams = tenant_filter(db.query(models.Team), models.Team, tid).count()
    total_projects = tenant_filter(db.query(models.Project), models.Project, tid).count()
    active_teams = tenant_filter(db.query(models.Team).filter(models.Team.status != "DISSOLVED"), models.Team, tid).count()

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
    teams = tenant_filter(db.query(models.Team), models.Team, get_user_tenant_id(current_user)).all()
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
    teams = tenant_filter(
        db.query(models.Team).filter(models.Team.is_at_risk == True),
        models.Team, get_user_tenant_id(current_user)
    ).all()
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


@router.get("/governance-requests")
def get_admin_governance_requests(
    current_user: models.User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    requests = tenant_filter(
        db.query(models.TeamGovernanceRequest),
        models.TeamGovernanceRequest, get_user_tenant_id(current_user)
    ).order_by(
        models.TeamGovernanceRequest.status.asc(),
        models.TeamGovernanceRequest.created_at.desc()
    ).all()

    res = []
    for r in requests:
        u = r.user
        t = r.team
        res.append({
            "id": r.id,
            "teamId": r.team_id,
            "teamName": t.team_name if t else "Dissolved Team",
            "userId": r.user_id,
            "userName": u.name if u else "User",
            "userRoleInTeam": "LEADER" if r.request_type == "DISMANTLE_TEAM" else "MEMBER",
            "userDepartment": u.department or "Engineering" if u else "Engineering",
            "requestType": r.request_type,
            "reason": r.reason,
            "status": r.status,
            "adminNotes": r.admin_notes,
            "createdAt": r.created_at,
            "reviewedAt": r.reviewed_at
        })
    return res


@router.post("/governance-requests/{request_id}/review")
def review_governance_request(
    request_id: int,
    action_data: Dict[str, Any],
    current_user: models.User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    from datetime import datetime

    gov_req = db.query(models.TeamGovernanceRequest).filter(
        models.TeamGovernanceRequest.id == request_id
    ).first()
    if not gov_req:
        raise HTTPException(status_code=404, detail="Governance request not found")

    action = action_data.get("action", "").upper() # "APPROVE" or "REJECT"
    admin_notes = action_data.get("adminNotes")

    if action not in ["APPROVE", "REJECT"]:
        raise HTTPException(status_code=400, detail="Action must be APPROVE or REJECT")

    team = db.query(models.Team).filter(models.Team.id == gov_req.team_id).first()

    if action == "APPROVE":
        gov_req.status = "APPROVED"
        gov_req.reviewed_at = datetime.utcnow()
        gov_req.admin_notes = admin_notes or "Approved by Institutional Admin"

        if gov_req.request_type == "DISMANTLE_TEAM":
            if team:
                team.status = "DISSOLVED"
                # Release all members
                db.query(models.TeamMember).filter(models.TeamMember.team_id == team.id).delete()
        elif gov_req.request_type == "LEAVE_TEAM":
            # Remove this specific member from the team
            db.query(models.TeamMember).filter(
                models.TeamMember.team_id == gov_req.team_id,
                models.TeamMember.user_id == gov_req.user_id
            ).delete()
    else: # REJECT
        gov_req.status = "REJECTED"
        gov_req.reviewed_at = datetime.utcnow()
        gov_req.admin_notes = admin_notes or "Rejected by Institutional Admin"

        if gov_req.request_type == "DISMANTLE_TEAM" and team:
            team.status = "ACTIVE"

    db.commit()
    return {
        "message": f"Request {gov_req.status.lower()} successfully",
        "requestId": gov_req.id,
        "status": gov_req.status
    }


@router.get("/grades/export")
def export_cohort_grades(
    current_user: models.User = Depends(require_role(["ADMIN", "FACULTY"])),
    db: Session = Depends(get_db)
):
    """Exports cohort-wide team grades and milestone evaluations as an RFC4180 CSV spreadsheet (tenant-scoped)."""
    teams = tenant_filter(
        db.query(models.Team), models.Team, get_user_tenant_id(current_user)
    ).order_by(models.Team.id.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Team ID",
        "Team Name",
        "Project Title",
        "Domain",
        "Team Leader",
        "Faculty Mentor",
        "Milestone 1 (Literature)",
        "Milestone 2 (Architecture)",
        "Milestone 3 (Implementation)",
        "Milestone 4 (Viva/Final)",
        "Total Score (Max 400)",
        "Percentage",
        "Team Status"
    ])

    for t in teams:
        leader_name = "N/A"
        for m in (t.members or []):
            if m.role_in_team in ["LEADER", "Team Lead"]:
                leader_name = m.user.name if m.user else "Leader"
                break
        if leader_name == "N/A" and t.members and t.members[0].user:
            leader_name = t.members[0].user.name

        mentor_name = "Not Assigned"
        active_mentorship = next((ms for ms in (t.mentorships or []) if ms.status == "ACCEPTED"), None)
        if active_mentorship and active_mentorship.faculty:
            mentor_name = active_mentorship.faculty.name

        # Map milestone points in sequence
        milestones = sorted(t.milestones or [], key=lambda m: (m.sequence_order or 99, m.id))
        m_scores = []
        for i in range(4):
            if i < len(milestones) and milestones[i].points_reward is not None:
                m_scores.append(str(milestones[i].points_reward))
            elif i < len(milestones) and milestones[i].status == "APPROVED":
                m_scores.append("100")
            else:
                m_scores.append("0")

        total = t.total_score or sum(int(s) for s in m_scores)
        pct = round((total / 400.0) * 100, 1) if total > 0 else 0.0

        writer.writerow([
            t.id,
            t.team_name,
            t.project.title if t.project else "Untitled Project",
            t.project.domain if t.project else "General",
            leader_name,
            mentor_name,
            m_scores[0],
            m_scores[1],
            m_scores[2],
            m_scores[3],
            total,
            f"{pct}%",
            t.status
        ])

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=capstone_grades_cohort.csv",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

