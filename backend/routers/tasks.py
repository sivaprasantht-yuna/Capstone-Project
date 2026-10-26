from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from security import get_current_user
from tenant import get_user_tenant_id
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/teams", tags=["Tasks & Evidence"])

class CreateTaskRequest(BaseModel):
    assignedToId: int
    title: str
    description: Optional[str] = None
    dueDate: Optional[str] = None
    pointValue: Optional[int] = 10

class UpdateTaskRequest(BaseModel):
    status: Optional[str] = None
    completionNote: Optional[str] = None

class AddEvidenceRequest(BaseModel):
    title: str
    description: Optional[str] = None
    evidenceType: Optional[str] = "CODE_COMMIT"
    fileUrl: Optional[str] = None

@router.post("/{teamId}/tasks")
def create_task(
    teamId: int,
    req: CreateTaskRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Parse due date if provided
    due_dt = None
    if req.dueDate:
        try:
            due_dt = datetime.fromisoformat(req.dueDate.replace("Z", "+00:00"))
        except Exception:
            due_dt = None

    task = models.StudentTask(
        tenant_id=get_user_tenant_id(current_user),
        team_id=teamId,
        assigned_to_id=req.assignedToId,
        assigned_by_id=current_user.id,
        title=req.title,
        description=req.description,
        due_date=due_dt,
        point_value=req.pointValue or 10,
        status="TODO"
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return {
        "id": task.id,
        "teamId": task.team_id,
        "assignedToId": task.assigned_to_id,
        "assignedById": task.assigned_by_id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "pointValue": task.point_value,
        "dueDate": task.due_date,
        "assignedAt": task.assigned_at
    }


@router.get("/{teamId}/tasks")
def get_team_tasks(
    teamId: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tasks = db.query(models.StudentTask).filter(models.StudentTask.team_id == teamId).all()
    res = []
    for t in tasks:
        assignee = t.assigned_to
        res.append({
            "id": t.id,
            "teamId": t.team_id,
            "assignedToId": t.assigned_to_id,
            "assignedToName": assignee.name if assignee else "Unknown",
            "assignedById": t.assigned_by_id,
            "title": t.title,
            "description": t.description,
            "status": t.status,
            "pointValue": t.point_value,
            "completionNote": t.completion_note,
            "dueDate": t.due_date,
            "assignedAt": t.assigned_at,
            "completedAt": t.completed_at
        })
    return res


@router.get("/{teamId}/tasks/my")
def get_my_tasks(
    teamId: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tasks = db.query(models.StudentTask).filter(
        models.StudentTask.team_id == teamId,
        models.StudentTask.assigned_to_id == current_user.id
    ).all()
    return [
        {
            "id": t.id,
            "teamId": t.team_id,
            "assignedToId": t.assigned_to_id,
            "title": t.title,
            "description": t.description,
            "status": t.status,
            "pointValue": t.point_value,
            "completionNote": t.completion_note,
            "dueDate": t.due_date,
            "assignedAt": t.assigned_at,
            "completedAt": t.completed_at
        }
        for t in tasks
    ]


@router.patch("/{teamId}/tasks/{taskId}")
def update_task(
    teamId: int,
    taskId: int,
    req: UpdateTaskRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(models.StudentTask).filter(
        models.StudentTask.id == taskId,
        models.StudentTask.team_id == teamId
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if req.status:
        task.status = req.status
        if req.status == "COMPLETED":
            task.completed_at = datetime.utcnow()
    if req.completionNote:
        task.completion_note = req.completionNote
    task.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(task)
    return {
        "id": task.id,
        "teamId": task.team_id,
        "title": task.title,
        "status": task.status,
        "completionNote": task.completion_note,
        "completedAt": task.completed_at
    }


@router.post("/{teamId}/tasks/{taskId}/evidence")
def add_evidence(
    teamId: int,
    taskId: int,
    req: AddEvidenceRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(models.StudentTask).filter(
        models.StudentTask.id == taskId,
        models.StudentTask.team_id == teamId
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    ev = models.ProjectEvidence(
        tenant_id=get_user_tenant_id(current_user),
        team_id=teamId,
        task_id=taskId,
        uploaded_by_id=current_user.id,
        title=req.title,
        description=req.description,
        evidence_type=req.evidenceType or "CODE_COMMIT",
        file_url=req.fileUrl,
        verification_status="PENDING"
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return {
        "id": ev.id,
        "teamId": ev.team_id,
        "taskId": ev.task_id,
        "title": ev.title,
        "evidenceType": ev.evidence_type,
        "fileUrl": ev.file_url,
        "verificationStatus": ev.verification_status,
        "submittedAt": ev.submitted_at
    }


@router.get("/{teamId}/tasks/{taskId}/evidence")
def get_task_evidence(
    teamId: int,
    taskId: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    evidence = db.query(models.ProjectEvidence).filter(
        models.ProjectEvidence.task_id == taskId,
        models.ProjectEvidence.team_id == teamId
    ).all()
    return [
        {
            "id": e.id,
            "teamId": e.team_id,
            "taskId": e.task_id,
            "title": e.title,
            "description": e.description,
            "evidenceType": e.evidence_type,
            "fileUrl": e.file_url,
            "verificationStatus": e.verification_status,
            "submittedAt": e.submitted_at
        }
        for e in evidence
    ]
