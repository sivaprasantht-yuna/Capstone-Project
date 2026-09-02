import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from security import get_current_user, require_role

router = APIRouter(prefix="/api/v1/certificates", tags=["Certificates"])

@router.post("/generate/{team_id}")
def generate_certificate(
    team_id: int,
    current_user: models.User = Depends(require_role(["ADMIN", "FACULTY"])),
    db: Session = Depends(get_db)
):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    existing = db.query(models.Certificate).filter(models.Certificate.team_id == team_id).first()
    if existing:
        return {
            "id": existing.id,
            "teamId": existing.team_id,
            "certificateNumber": existing.certificate_number,
            "pdfUrl": existing.pdf_url,
            "issuedAt": existing.issued_at
        }

    cert_number = f"CERT-CAPSTONE-{uuid.uuid4().hex[:8].upper()}"
    cert = models.Certificate(
        tenant_id="INST-001",
        team_id=team_id,
        certificate_number=cert_number,
        pdf_url=f"https://res.cloudinary.com/wc8fbkbj/image/upload/v1/certificates/{cert_number}.pdf",
        issued_at=datetime.utcnow()
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)

    return {
        "id": cert.id,
        "teamId": cert.team_id,
        "certificateNumber": cert.certificate_number,
        "pdfUrl": cert.pdf_url,
        "issuedAt": cert.issued_at
    }


@router.get("/team/{team_id}")
def get_team_certificate(
    team_id: int,
    db: Session = Depends(get_db)
):
    cert = db.query(models.Certificate).filter(models.Certificate.team_id == team_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return {
        "id": cert.id,
        "teamId": cert.team_id,
        "certificateNumber": cert.certificate_number,
        "pdfUrl": cert.pdf_url,
        "issuedAt": cert.issued_at
    }


@router.get("/verify/{cert_number}")
def verify_certificate(
    cert_number: str,
    db: Session = Depends(get_db)
):
    cert = db.query(models.Certificate).filter(models.Certificate.certificate_number == cert_number).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate is invalid or not found")

    team = cert.team
    project = team.project if team else None
    members = []
    if team:
        for m in team.members:
            u = m.user
            if u:
                members.append({"name": u.name, "email": u.email, "role": m.role_in_team})

    return {
        "verified": True,
        "certificateNumber": cert.certificate_number,
        "issuedAt": cert.issued_at,
        "teamName": team.team_name if team else "Unknown",
        "projectTitle": project.title if project else "Capstone Project",
        "members": members
    }
