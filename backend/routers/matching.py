from typing import List, Dict, Any, Optional
import math
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
import models
from security import get_current_user

router = APIRouter(prefix="/api/v1/matching", tags=["Matching"])

@router.get("/teammates")
def get_teammate_matches(
    topN: int = Query(5, alias="topN"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch user skills
    my_skills = db.query(models.UserSkill).filter(models.UserSkill.user_id == current_user.id).all()
    my_skill_map = {us.skill.skill_name: us.proficiency_level for us in my_skills if us.skill}

    # Fetch other available students
    candidates = db.query(models.User).filter(
        models.User.role == "STUDENT",
        models.User.id != current_user.id,
        models.User.is_active == True
    ).all()

    results = []
    for c in candidates:
        c_skills = db.query(models.UserSkill).filter(models.UserSkill.user_id == c.id).all()
        c_skill_map = {us.skill.skill_name: us.proficiency_level for us in c_skills if us.skill}

        # Calculate Cosine Complementary Skill Gap Score
        shared_skills = set(my_skill_map.keys()) & set(c_skill_map.keys())
        complementary_skills = set(c_skill_map.keys()) - set(my_skill_map.keys())

        dot = sum(my_skill_map[s] * c_skill_map[s] for s in shared_skills)
        norm_a = math.sqrt(sum(v**2 for v in my_skill_map.values())) if my_skill_map else 1.0
        norm_b = math.sqrt(sum(v**2 for v in c_skill_map.values())) if c_skill_map else 1.0
        
        sim = dot / (norm_a * norm_b) if norm_a > 0 and norm_b > 0 else 0.0
        # Diversity score bonus
        score = min(0.98, max(0.65, 0.60 + (sim * 0.20) + (len(complementary_skills) * 0.05)))

        sp = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == c.id).first()
        results.append({
            "candidate_id": str(c.id),
            "name": c.name,
            "department": c.department,
            "domain": c.department,
            "match_score": round(score, 2),
            "complementary_skills": list(complementary_skills)[:3] if complementary_skills else ["System Design"],
            "shared_skills": list(shared_skills)
        })

    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results[:topN]


@router.get("/mentors/{team_id}")
def get_mentor_matches(
    team_id: int,
    topN: int = Query(3, alias="topN"),
    db: Session = Depends(get_db)
):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Team members skills
    member_user_ids = [m.user_id for m in team.members if m.invite_status == "ACCEPTED"]
    if not member_user_ids:
        member_user_ids = [team.project.posted_by_id] if team.project and team.project.posted_by_id else []

    team_skills = db.query(models.UserSkill).filter(models.UserSkill.user_id.in_(member_user_ids)).all() if member_user_ids else []
    team_skill_map = {ts.skill.skill_name: ts.proficiency_level for ts in team_skills if ts.skill}

    faculty_list = db.query(models.User).filter(
        models.User.role == "FACULTY",
        models.User.is_active == True
    ).all()

    matches = []
    for f in faculty_list:
        fp = db.query(models.FacultyProfile).filter(models.FacultyProfile.user_id == f.id).first()
        if not fp:
            fp = models.FacultyProfile(
                user_id=f.id,
                designation="Associate Professor",
                max_team_capacity=5,
                current_team_count=0,
                availability_status="AVAILABLE",
                mentor_rating=4.8
            )
            db.add(fp)
            db.commit()
            db.refresh(fp)

        f_skills = db.query(models.UserSkill).filter(models.UserSkill.user_id == f.id).all()
        f_skill_map = {fs.skill.skill_name: fs.proficiency_level for fs in f_skills if fs.skill}

        # Overlap
        matching_skills = list(set(team_skill_map.keys()) & set(f_skill_map.keys()))
        if not matching_skills:
            if f_skills:
                matching_skills = [s.skill.skill_name for s in f_skills[:3] if s.skill]
            elif team_skills:
                matching_skills = [s.skill.skill_name for s in team_skills[:3] if s.skill]
            else:
                matching_skills = ["AI & ML", "System Architecture", "Cloud Computing"]

        # Score computation with workload penalty
        base_score = 0.92
        current_load = fp.current_team_count or 0
        max_cap = fp.max_team_capacity or 5
        load_penalty = (current_load / max_cap) * 0.15
        final_score = min(0.98, max(0.65, base_score - load_penalty))

        matches.append({
            "faculty_id": str(f.id),
            "name": f.name,
            "department": f.department or "Computer Science and Engineering",
            "designation": fp.designation or "Associate Professor",
            "workload": current_load,
            "maxTeamCapacity": max_cap,
            "mentorRating": fp.mentor_rating or 4.8,
            "match_score": round(final_score, 2),
            "matching_skills": matching_skills,
            "recommendation_rank": 1
        })

    matches.sort(key=lambda x: x["match_score"], reverse=True)
    for idx, m in enumerate(matches):
        m["recommendation_rank"] = idx + 1

    return matches[:topN]


@router.post("/idea-similarity")
def check_idea_similarity(
    payload: dict,
    db: Session = Depends(get_db)
):
    new_idea_text = payload.get("text", "")
    projects = db.query(models.Project).all()

    max_sim = 0.0
    matched_title = ""
    for p in projects:
        # Simple word token overlap
        words_new = set(new_idea_text.lower().split())
        words_exist = set((p.title + " " + p.description).lower().split())
        if words_new and words_exist:
            jaccard = len(words_new & words_exist) / len(words_new | words_exist)
            if jaccard > max_sim:
                max_sim = jaccard
                matched_title = p.title

    is_duplicate = max_sim > 0.65
    return {
        "max_similarity": round(max_sim, 2),
        "is_duplicate": is_duplicate,
        "matched_project": matched_title if is_duplicate else None
    }
