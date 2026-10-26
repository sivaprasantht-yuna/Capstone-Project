from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from security import (
    get_password_hash, verify_password, create_access_token,
    create_refresh_token, decode_token, get_current_user
)
from tenant import resolve_tenant_from_email, get_tenant_name

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

@router.post("/register", response_model=schemas.AuthResponse)
def register(req: schemas.RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    # Resolve tenant from email domain (e.g. @bitsathy.ac.in → INST-BIT)
    tenant_id = resolve_tenant_from_email(req.email, db)

    # Create User
    new_user = models.User(
        tenant_id=tenant_id,
        name=req.name,
        email=req.email,
        password_hash=get_password_hash(req.password),
        role=req.role.upper(),
        department=req.department or "Computer Science and Engineering (CSE)",
        is_verified=True,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create profile based on role
    if new_user.role == "STUDENT":
        profile = models.StudentProfile(
            user_id=new_user.id,
            tenant_id=tenant_id,
            roll_number=req.rollNumber,
            year_of_study=req.yearOfStudy or 3,
            bio=""
        )
        db.add(profile)
        # Add skills if provided
        if req.skills:
            for skill_name in req.skills:
                skill_obj = db.query(models.Skill).filter(models.Skill.skill_name.ilike(skill_name.strip())).first()
                if not skill_obj:
                    skill_obj = models.Skill(skill_name=skill_name.strip(), category="General")
                    db.add(skill_obj)
                    db.commit()
                    db.refresh(skill_obj)
                user_skill = models.UserSkill(
                    user_id=new_user.id, skill_id=skill_obj.id,
                    tenant_id=tenant_id, proficiency_level=3
                )
                db.add(user_skill)

    elif new_user.role == "FACULTY":
        f_profile = models.FacultyProfile(
            user_id=new_user.id,
            designation=req.designation or "Associate Professor",
            max_team_capacity=5,
            current_team_count=0,
            availability_status="AVAILABLE",
            mentor_rating=4.8
        )
        db.add(f_profile)

    db.commit()

    # Generate Tokens (with tenant_id embedded)
    institution_name = get_tenant_name(tenant_id, db)
    token_data = {
        "sub": new_user.email, "role": new_user.role, "id": new_user.id,
        "tenant_id": tenant_id
    }
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return schemas.AuthResponse(
        accessToken=access_token,
        refreshToken=refresh_token,
        userId=new_user.id,
        name=new_user.name,
        email=new_user.email,
        role=new_user.role,
        department=new_user.department,
        tenantId=tenant_id,
        institutionName=institution_name
    )


@router.post("/login", response_model=schemas.AuthResponse)
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    tenant_id = user.tenant_id or resolve_tenant_from_email(req.email, db)
    institution_name = get_tenant_name(tenant_id, db)

    token_data = {
        "sub": user.email, "role": user.role, "id": user.id,
        "tenant_id": tenant_id
    }
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return schemas.AuthResponse(
        accessToken=access_token,
        refreshToken=refresh_token,
        userId=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        department=user.department,
        tenantId=tenant_id,
        institutionName=institution_name
    )


def _do_refresh(token: str, db: Session):
    """Shared refresh logic used by both /refresh-token and /refresh."""
    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    tenant_id = user.tenant_id or payload.get("tenant_id", "INST-001")
    token_data = {
        "sub": user.email, "role": user.role, "id": user.id,
        "tenant_id": tenant_id
    }
    new_access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)

    return {
        "accessToken": new_access_token,
        "refreshToken": new_refresh_token,
        "tokenType": "Bearer"
    }


@router.post("/refresh-token")
def refresh_token(req: schemas.RefreshTokenRequest, db: Session = Depends(get_db)):
    return _do_refresh(req.refreshToken, db)


@router.post("/refresh")
def refresh_via_header(request: Request, db: Session = Depends(get_db)):
    """Frontend sends the refresh token in X-Refresh-Token header."""
    token = request.headers.get("X-Refresh-Token") or request.headers.get("x-refresh-token")
    if not token:
        raise HTTPException(status_code=400, detail="Missing X-Refresh-Token header")
    return _do_refresh(token, db)


@router.get("/me", response_model=schemas.UserDto)
def get_me(current_user: models.User = Depends(get_current_user)):
    return schemas.UserDto(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        department=current_user.department,
        avatarUrl=current_user.avatar_url
    )


@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}
