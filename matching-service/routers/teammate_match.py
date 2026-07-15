"""
Teammate Matching Router
POST /match/teammates

Request Body:
{
  "requester_id": 42,
  "requester_skills": { "Python": 3, "ML": 2, "React": 1 },
  "candidates": {
    "10": { "IoT": 4, "Embedded C": 3, "PCB Design": 2 },
    "11": { "UI/UX": 4, "Figma": 3, "React": 2 },
    ...
  },
  "top_n": 5
}

Response:
[
  {
    "user_id": "10",
    "match_score": 0.724,
    "gap_filled_skills": ["IoT", "Embedded C", "PCB Design"],
    "complementarity": "HIGH"
  },
  ...
]
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, List, Optional
from services.cosine_engine import (
    build_skill_vocabulary, vectorize, complementary_score
)

router = APIRouter()


class TeammateMatchRequest(BaseModel):
    requester_id: int
    requester_skills: Dict[str, int]
    candidates: Dict[str, Dict[str, int]]   # { userId_str: skill_map }
    top_n: Optional[int] = 5


class TeammateMatchResult(BaseModel):
    user_id: str
    match_score: float
    gap_filled_skills: List[str]
    complementarity: str   # HIGH / MEDIUM / LOW


@router.post("/teammates", response_model=List[TeammateMatchResult])
def match_teammates(req: TeammateMatchRequest) -> List[TeammateMatchResult]:
    """
    Returns top_n candidates ranked by complementary skill-gap score.
    """
    if not req.candidates:
        return []

    # Build unified vocabulary from ALL skill vectors
    all_skill_maps = [req.requester_skills] + list(req.candidates.values())
    vocab = build_skill_vocabulary(all_skill_maps)

    requester_vec = vectorize(req.requester_skills, vocab)

    results = []
    for user_id, skills in req.candidates.items():
        candidate_vec = vectorize(skills, vocab)
        score, gap_skills = complementary_score(requester_vec, candidate_vec, vocab)

        if score == 0:
            continue

        complementarity = (
            "HIGH"   if score >= 0.5 else
            "MEDIUM" if score >= 0.25 else
            "LOW"
        )

        results.append(TeammateMatchResult(
            user_id=user_id,
            match_score=score,
            gap_filled_skills=gap_skills,
            complementarity=complementarity,
        ))

    # Sort descending by score, return top_n
    results.sort(key=lambda x: x.match_score, reverse=True)
    return results[:req.top_n]
