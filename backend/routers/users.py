from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from security import get_current_user

router = APIRouter(tags=["Users & Profile"])

@router.get("/api/v1/users/profile", response_model=schemas.StudentProfileDto)
def get_user_profile(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    
    # Skills
    user_skills = db.query(models.UserSkill).filter(models.UserSkill.user_id == current_user.id).all()
    skills_dto = [
        schemas.UserSkillDto(
            id=us.id,
            skillName=us.skill.skill_name if us.skill else "Unknown",
            proficiencyLevel=us.proficiency_level,
            category=us.skill.category if us.skill else "General"
        )
        for us in user_skills
    ]

    return schemas.StudentProfileDto(
        userId=current_user.id,
        name=current_user.name,
        email=current_user.email,
        department=current_user.department,
        rollNumber=profile.roll_number if profile else None,
        yearOfStudy=profile.year_of_study if profile else 3,
        domain=None,
        bio=profile.bio if profile else "",
        githubLink=profile.github_link if profile else None,
        linkedinLink=profile.linkedin_link if profile else None,
        avatarUrl=current_user.avatar_url,
        skills=skills_dto
    )


@router.put("/api/v1/users/profile", response_model=schemas.StudentProfileDto)
def update_user_profile(
    req: schemas.ProfileUpdateRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Update User base fields
    if req.name:
        current_user.name = req.name
    if req.department:
        current_user.department = req.department
    if req.avatarUrl:
        current_user.avatar_url = req.avatarUrl

    # Update or create Student Profile
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    if not profile:
        profile = models.StudentProfile(user_id=current_user.id)
        db.add(profile)

    if req.rollNumber is not None:
        profile.roll_number = req.rollNumber
    if req.yearOfStudy is not None:
        profile.year_of_study = req.yearOfStudy
    if req.bio is not None:
        profile.bio = req.bio
    if req.githubLink is not None:
        profile.github_link = req.githubLink
    if req.linkedinLink is not None:
        profile.linkedin_link = req.linkedinLink

    # Update Skills if provided
    if req.skills is not None:
        # Clear existing
        db.query(models.UserSkill).filter(models.UserSkill.user_id == current_user.id).delete()
        for item in req.skills:
            if isinstance(item, str):
                sname = item.strip()
                category = "General"
                level = 3
            elif isinstance(item, dict):
                sname = (item.get("skillName") or item.get("name") or "").strip()
                category = item.get("category", "General")
                level = int(item.get("proficiencyLevel", 3))
            else:
                continue

            if sname:
                skill_obj = db.query(models.Skill).filter(models.Skill.skill_name.ilike(sname)).first()
                if not skill_obj:
                    skill_obj = models.Skill(skill_name=sname, category=category)
                    db.add(skill_obj)
                    db.commit()
                    db.refresh(skill_obj)
                
                us = models.UserSkill(user_id=current_user.id, skill_id=skill_obj.id, proficiency_level=level)
                db.add(us)

    db.commit()
    return get_user_profile(current_user, db)


@router.head("/api/v1/skills")
@router.get("/api/v1/skills")
def skills_health_check():
    """Health-check probe used by the frontend WebSocket connector."""
    return {"status": "ok"}


@router.get("/api/v1/skills/autocomplete")
def autocomplete_skills(
    prefix: str = Query("", description="Skill search prefix"),
    db: Session = Depends(get_db)
):
    if not prefix:
        skills = db.query(models.Skill).limit(20).all()
    else:
        skills = db.query(models.Skill).filter(models.Skill.skill_name.ilike(f"{prefix}%")).limit(10).all()
    return [{"id": s.id, "name": s.skill_name, "category": s.category} for s in skills]


@router.get("/api/v1/users/skills")
def get_user_skills(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_skills = db.query(models.UserSkill).filter(models.UserSkill.user_id == current_user.id).all()
    return [
        {
            "id": us.id,
            "skillName": us.skill.skill_name if us.skill else "Unknown",
            "proficiencyLevel": us.proficiency_level,
            "category": us.skill.category if us.skill else "General"
        }
        for us in user_skills
    ]


@router.get("/api/v1/users/faculty")
def get_faculty_members(db: Session = Depends(get_db)):
    faculty = db.query(models.User).filter(models.User.role == "FACULTY", models.User.is_active == True).all()
    res = []
    for f in faculty:
        fp = db.query(models.FacultyProfile).filter(models.FacultyProfile.user_id == f.id).first()
        res.append({
            "id": f.id,
            "name": f.name,
            "email": f.email,
            "department": f.department,
            "designation": fp.designation if fp else "Associate Professor",
            "maxTeamCapacity": fp.max_team_capacity if fp else 5,
            "currentTeamCount": fp.current_team_count if fp else 0,
            "mentorRating": fp.mentor_rating if fp else 4.8
        })
    return res
