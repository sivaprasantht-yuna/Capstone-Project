from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from security import get_current_user, require_role

router = APIRouter(prefix="/api/v1/mentorships", tags=["Mentorships"])

@router.post("/request")
def request_mentor(
    req: dict,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    team_id = req.get("teamId")
    faculty_id = req.get("facultyId")
    match_score = req.get("matchScore", 0.90)
    matching_skills = req.get("matchingSkillsJson", "[]")

    if not team_id or not faculty_id:
        raise HTTPException(status_code=400, detail="teamId and facultyId are required")

    existing = db.query(models.Mentorship).filter(
        models.Mentorship.team_id == team_id,
        models.Mentorship.faculty_id == faculty_id
    ).first()
    if existing:
        return {"message": "Mentorship request already exists", "status": existing.status}

    mentorship = models.Mentorship(
        team_id=team_id,
        faculty_id=faculty_id,
        status="PENDING",
        match_score=float(match_score),
        matching_skills=str(matching_skills)
    )
    db.add(mentorship)

    # Notify Faculty
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    team_name = team.team_name if team else f"Team #{team_id}"
    notif = models.Notification(
        user_id=faculty_id,
        message=f"{team_name} has requested you as their project faculty mentor!",
        notification_type="MENTORSHIP_REQUEST"
    )
    db.add(notif)

    db.commit()
    return {"message": "Mentorship request sent successfully", "status": "PENDING"}


@router.get("/pending")
@router.get("/faculty/pending")
def get_pending_mentorship_requests(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    requests = db.query(models.Mentorship).filter(
        models.Mentorship.faculty_id == current_user.id,
        models.Mentorship.status == "PENDING"
    ).all()

    res = []
    for r in requests:
        team = r.team
        project = team.project if team else None
        res.append({
            "id": r.id,
            "teamId": r.team_id,
            "teamName": team.team_name if team else "Team",
            "projectTitle": project.title if project else "Project",
            "projectDescription": project.description if project else "",
            "matchScore": r.match_score,
            "matchingSkills": r.matching_skills,
            "createdAt": r.created_at
        })
    return res


@router.get("/active")
def get_active_mentorships(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    active = db.query(models.Mentorship).filter(
        models.Mentorship.faculty_id == current_user.id,
        models.Mentorship.status.in_(["ACCEPTED", "APPROVED"])
    ).all()

    res = []
    for m in active:
        team = m.team
        project = team.project if team else None
        res.append({
            "id": m.id,
            "teamId": m.team_id,
            "teamName": team.team_name if team else "Team",
            "projectTitle": project.title if project else "Project",
            "status": m.status,
            "matchScore": m.match_score,
            "createdAt": m.created_at
        })
    return res


@router.patch("/{id}/respond")
def respond_mentorship(
    id: int,
    req: dict,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mentorship = db.query(models.Mentorship).filter(models.Mentorship.id == id).first()
    if not mentorship:
        raise HTTPException(status_code=404, detail="Mentorship request not found")

    accept = req.get("accept", False)
    if accept:
        mentorship.status = "ACCEPTED"
        team = db.query(models.Team).filter(models.Team.id == mentorship.team_id).first()
        if team:
            team.status = "MENTOR_ASSIGNED"
        
        # Update faculty load
        fp = db.query(models.FacultyProfile).filter(models.FacultyProfile.user_id == current_user.id).first()
        if fp:
            fp.current_team_count = (fp.current_team_count or 0) + 1
    else:
        mentorship.status = "REJECTED"

    db.commit()
    return {"message": f"Mentorship request {mentorship.status.lower()}", "status": mentorship.status}


@router.post("/{id}/rate")
def rate_mentorship(
    id: int,
    req: dict,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mentorship = db.query(models.Mentorship).filter(models.Mentorship.id == id).first()
    if not mentorship:
        raise HTTPException(status_code=404, detail="Mentorship not found")

    rating = req.get("rating", 5)
    faculty_id = mentorship.faculty_id
    fp = db.query(models.FacultyProfile).filter(models.FacultyProfile.user_id == faculty_id).first()
    if fp:
        total = fp.total_ratings or 0
        curr_rating = fp.mentor_rating or 4.8
        new_rating = round(((curr_rating * total) + rating) / (total + 1), 2)
        fp.mentor_rating = new_rating
        fp.total_ratings = total + 1
        db.commit()

    return {"message": "Rating submitted successfully", "mentorRating": fp.mentor_rating if fp else rating}
