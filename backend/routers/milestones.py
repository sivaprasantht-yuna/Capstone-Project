import os
import shutil
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Form, File, UploadFile
from sqlalchemy.orm import Session
from database import get_db
from config import settings
import models, schemas
from security import get_current_user

router = APIRouter(prefix="/api/v1/milestones", tags=["Milestones"])

# Setup Cloudinary
try:
    import cloudinary
    import cloudinary.uploader
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True
    )
except Exception as e:
    print(f"[Milestones] Cloudinary config note: {e}")


@router.get("/team/{team_id}", response_model=List[schemas.MilestoneDto])
def get_team_milestones(
    team_id: int,
    db: Session = Depends(get_db)
):
    milestones = db.query(models.Milestone).filter(
        models.Milestone.team_id == team_id
    ).order_by(models.Milestone.sequence_order.asc().nullslast(), models.Milestone.id.asc()).all()

    # Pre-fetch evidence for all milestones of this team
    evidences = db.query(models.ProjectEvidence).filter(
        models.ProjectEvidence.team_id == team_id
    ).order_by(models.ProjectEvidence.id.desc()).all()

    evidence_map = {}
    for ev in evidences:
        if ev.milestone_id and ev.milestone_id not in evidence_map:
            evidence_map[ev.milestone_id] = ev

    result = []
    for m in milestones:
        ev = evidence_map.get(m.id)
        file_url = ev.file_url if ev else None
        is_github = file_url and ("github.com" in file_url or "gitlab.com" in file_url)

        result.append(
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
                deliverableUrl=file_url if not is_github else None,
                githubUrl=file_url if is_github else None,
                submissionRemarks=ev.description if ev else None,
                createdAt=m.created_at
            )
        )
    return result


@router.post("/{id}/submit")
async def submit_milestone(
    id: int,
    file: Optional[UploadFile] = File(None),
    remarks: Optional[str] = Form(None),
    githubUrl: Optional[str] = Form(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    milestone = db.query(models.Milestone).filter(models.Milestone.id == id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    deliverable_url = None
    if file and file.filename:
        # 1. Attempt Cloudinary upload
        try:
            upload_result = cloudinary.uploader.upload(
                file.file,
                resource_type="auto",
                folder="capstone_milestones",
                public_id=f"team_{milestone.team_id}_m_{milestone.id}_{int(datetime.utcnow().timestamp())}"
            )
            deliverable_url = upload_result.get("secure_url") or upload_result.get("url")
        except Exception as upload_err:
            print(f"[Storage] Cloudinary fallback to local: {upload_err}")
            # 2. Local disk fallback
            os.makedirs("uploads/milestones", exist_ok=True)
            safe_filename = f"team_{milestone.team_id}_m_{milestone.id}_{file.filename.replace(' ', '_')}"
            local_path = os.path.join("uploads", "milestones", safe_filename)
            file.file.seek(0)
            with open(local_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            deliverable_url = f"/uploads/milestones/{safe_filename}"

    final_evidence_url = deliverable_url or githubUrl

    # Save ProjectEvidence record
    evidence = models.ProjectEvidence(
        tenant_id=milestone.tenant_id or "INST-001",
        team_id=milestone.team_id,
        milestone_id=milestone.id,
        uploaded_by_id=current_user.id,
        title=f"Deliverable: {milestone.title}",
        description=remarks or "Milestone deliverable submitted by student.",
        evidence_type="REPORT" if deliverable_url else "LINK",
        file_url=final_evidence_url,
        verification_status="PENDING",
        submitted_at=datetime.utcnow()
    )
    db.add(evidence)

    milestone.status = "SUBMITTED"
    milestone.submitted_at = datetime.utcnow()
    db.commit()

    return {
        "message": "Milestone submitted successfully",
        "status": milestone.status,
        "deliverableUrl": final_evidence_url,
        "submittedAt": milestone.submitted_at
    }


@router.post("/{id}/grade")
@router.post("/{id}/evaluate")
def grade_or_evaluate_milestone(
    id: int,
    req: schemas.MilestoneGradeRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    milestone = db.query(models.Milestone).filter(models.Milestone.id == id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    # Determine awarded marks
    awarded_points = req.pointsReward
    if awarded_points is None and req.marks is not None:
        awarded_points = int(round(req.marks))
    if awarded_points is None:
        awarded_points = 100

    milestone.points_reward = awarded_points
    milestone.status = req.status or "APPROVED"

    # Mark associated evidence as VERIFIED
    evidences = db.query(models.ProjectEvidence).filter(
        models.ProjectEvidence.milestone_id == milestone.id
    ).all()
    for ev in evidences:
        ev.verification_status = "VERIFIED"
        ev.verified_by_id = current_user.id

    # Recalculate team total score
    team = db.query(models.Team).filter(models.Team.id == milestone.team_id).first()
    if team:
        all_milestones = db.query(models.Milestone).filter(models.Milestone.team_id == team.id).all()
        total = sum(m.points_reward or 0 for m in all_milestones)
        team.total_score = total

        # Send notification to team members
        for member in team.members:
            notif = models.Notification(
                tenant_id=team.tenant_id or "INST-001",
                user_id=member.user_id,
                message=f"Milestone '{milestone.title}' evaluated! Score: {awarded_points}/100. {req.feedback or ''}".strip(),
                notification_type="EVALUATION"
            )
            db.add(notif)

    db.commit()
    return {
        "message": "Milestone evaluated successfully",
        "pointsReward": milestone.points_reward,
        "status": milestone.status,
        "feedback": req.feedback
    }
