from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from security import get_current_user
from websocket_manager import ws_manager

router = APIRouter(prefix="/api/v1/messages", tags=["Messages & Chat"])

@router.get("/team/{team_id}", response_model=List[schemas.MessageDto])
def get_team_messages(
    team_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    messages = db.query(models.Message).filter(
        models.Message.team_id == team_id
    ).order_by(models.Message.timestamp.asc()).all()

    res = []
    for m in messages:
        sender = m.sender
        sender_role = "Member"
        if sender:
            tm = db.query(models.TeamMember).filter(
                models.TeamMember.team_id == team_id,
                models.TeamMember.user_id == sender.id
            ).first()
            if tm:
                sender_role = tm.role_in_team or "Member"

        res.append(schemas.MessageDto(
            id=m.id,
            teamId=m.team_id,
            senderId=m.sender_id,
            senderName=sender.name if sender else "Unknown",
            senderEmail=sender.email if sender else "",
            senderRole=sender_role,
            content=m.content,
            type=m.type,
            fileUrl=m.file_url,
            isRead=m.is_read or False,
            createdAt=m.timestamp
        ))
    return res


@router.post("/team/{team_id}", response_model=schemas.MessageDto)
async def send_team_message(
    team_id: int,
    req: schemas.SendMessageRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tm = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team_id,
        models.TeamMember.user_id == current_user.id
    ).first()
    sender_role = tm.role_in_team if tm and tm.role_in_team else "Member"

    msg = models.Message(
        team_id=team_id,
        sender_id=current_user.id,
        content=req.content,
        type=req.type or "TEXT",
        file_url=req.fileUrl,
        is_read=False,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    dto = schemas.MessageDto(
        id=msg.id,
        teamId=msg.team_id,
        senderId=msg.sender_id,
        senderName=current_user.name,
        senderEmail=current_user.email,
        senderRole=sender_role,
        content=msg.content,
        type=msg.type,
        fileUrl=msg.file_url,
        isRead=False,
        createdAt=msg.timestamp
    )

    # Broadcast via WebSocket
    await ws_manager.broadcast_to_team(team_id, {
        "type": "CHAT_MESSAGE",
        "id": msg.id,
        "teamId": msg.team_id,
        "senderId": msg.sender_id,
        "senderName": current_user.name,
        "senderEmail": current_user.email,
        "senderRole": sender_role,
        "content": msg.content,
        "messageType": msg.type,
        "isRead": False,
        "createdAt": msg.timestamp.isoformat() if msg.timestamp else datetime.utcnow().isoformat()
    })

    return dto


@router.post("/team/{team_id}/read")
async def mark_messages_as_read(
    team_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Mark messages not sent by current user as read
    db.query(models.Message).filter(
        models.Message.team_id == team_id,
        models.Message.sender_id != current_user.id,
        models.Message.is_read == False
    ).update({"is_read": True})
    db.commit()

    # Broadcast READ_RECEIPT event
    await ws_manager.broadcast_to_team(team_id, {
        "type": "READ_RECEIPT",
        "teamId": team_id,
        "readByUserId": current_user.id,
        "readByName": current_user.name,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    return {"status": "ok", "message": "Marked messages as read"}
