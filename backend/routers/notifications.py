from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from security import get_current_user

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications"])

@router.get("", response_model=List[schemas.NotificationDto])
def get_notifications(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifs = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.created_at.desc()).limit(50).all()

    return [
        schemas.NotificationDto(
            id=n.id,
            userId=n.user_id,
            message=n.message,
            type=n.notification_type or "INFO",
            isRead=n.is_read or False,
            linkUrl=None,
            createdAt=n.created_at
        )
        for n in notifs
    ]


@router.get("/unread-count")
def get_unread_count(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    count = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).count()
    return {"count": count}


@router.patch("/{id}/read")
def mark_notification_read(
    id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(models.Notification).filter(
        models.Notification.id == id,
        models.Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "ok"}


@router.patch("/mark-all-read")
@router.patch("/read-all")
def mark_all_notifications_read(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"status": "ok"}
