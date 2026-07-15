"""
Mentor Matching Router
POST /match/mentors

Request Body:
{
  "team_id": 5,
  "team_skills": { "Python": 3, "IoT": 2, "React": 2 },
  "candidates": {
    "20": { "Python": 4, "ML": 4, "Data Science": 3 },
    "21": { "IoT": 4, "Embedded Systems": 4 },
    ...
  },
  "faculty_loads": { "20": 2, "21": 1 },   // current team count
  "top_n": 3
}

Response:
[
  {
    "faculty_id": "20",
    "match_score": 0.831,
    "matching_skills": ["Python", "ML"],
    "workload": 2,
    "recommendation_rank": 1
  },
  ...
]
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, List, Optional
from services.cosine_engine import (
    build_skill_vocabulary, vectorize, overlap_score_with_penalty
)

router = APIRouter()

MAX_CAPACITY_DEFAULT = 5


class MentorMatchRequest(BaseModel):
    team_id: int
    team_skills: Dict[str, int]
    candidates: Dict[str, Dict[str, int]]
    faculty_loads: Dict[str, int]           # { facultyId_str: current_load }
    faculty_capacities: Optional[Dict[str, int]] = None
    top_n: Optional[int] = 3


class MentorMatchResult(BaseModel):
    faculty_id: str
    match_score: float
    matching_skills: List[str]
    workload: int
    recommendation_rank: int


@router.post("/mentors", response_model=List[MentorMatchResult])
def match_mentors(req: MentorMatchRequest) -> List[MentorMatchResult]:
    """
    Returns top_n faculty ranked by expertise-overlap score with workload penalty.
    Pre-filter (available faculty only) is applied by Spring Boot before calling here.
    """
    if not req.candidates:
        return []

    all_skill_maps = [req.team_skills] + list(req.candidates.values())
    vocab = build_skill_vocabulary(all_skill_maps)

    team_vec = vectorize(req.team_skills, vocab)

    results = []
    for faculty_id, skills in req.candidates.items():
        faculty_vec = vectorize(skills, vocab)
        current_load = req.faculty_loads.get(faculty_id, 0)
        max_cap = (req.faculty_capacities or {}).get(faculty_id, MAX_CAPACITY_DEFAULT)

        score, matched = overlap_score_with_penalty(
            team_vec, faculty_vec, vocab, current_load, max_cap
        )

        if score == 0:
            continue

        results.append({
            "faculty_id": faculty_id,
            "match_score": score,
            "matching_skills": matched,
            "workload": current_load,
        })

    results.sort(key=lambda x: x["match_score"], reverse=True)

    return [
        MentorMatchResult(**r, recommendation_rank=i + 1)
        for i, r in enumerate(results[:req.top_n])
    ]
