from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Form
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from security import get_current_user

router = APIRouter(prefix="/api/v1/milestones", tags=["Milestones"])

@router.get("/team/{team_id}", response_model=List[schemas.MilestoneDto])
def get_team_milestones(
    team_id: int,
    db: Session = Depends(get_db)
):
    milestones = db.query(models.Milestone).filter(
        models.Milestone.team_id == team_id
    ).order_by(models.Milestone.sequence_order.asc().nullslast(), models.Milestone.id.asc()).all()

    return [
        schemas.MilestoneDto(
            id=m.id,
            teamId=m.team_id,
            title=m.title,
            description=m.description,
            dueDate=m.due_date,
            status=m.status,
            pointsReward=m.points_reward,
            sequenceOrder=m.sequence_order,
            submittedAt=m.submitted_at,
            createdAt=m.created_at
        )
        for m in milestones
    ]


@router.post("/{id}/submit")
def submit_milestone(
    id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    milestone = db.query(models.Milestone).filter(models.Milestone.id == id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    milestone.status = "SUBMITTED"
    milestone.submitted_at = datetime.utcnow()
    db.commit()
    return {"message": "Milestone submitted successfully", "status": milestone.status}


@router.post("/{id}/grade")
def grade_milestone(
    id: int,
    req: schemas.MilestoneGradeRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    milestone = db.query(models.Milestone).filter(models.Milestone.id == id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    if req.pointsReward is not None:
        milestone.points_reward = req.pointsReward
    milestone.status = req.status

    # Recalculate team total score
    team = db.query(models.Team).filter(models.Team.id == milestone.team_id).first()
    if team:
        all_milestones = db.query(models.Milestone).filter(models.Milestone.team_id == team.id).all()
        total = sum(m.points_reward or 0 for m in all_milestones)
        team.total_score = total

    db.commit()
    return {"message": "Milestone graded", "pointsReward": milestone.points_reward, "status": milestone.status}
