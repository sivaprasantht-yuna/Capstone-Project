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
from services.gale_shapley import (
    deferred_acceptance_many_to_one, GlobalMatchingReport
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


class StableAllocationRequest(BaseModel):
    # { team_id: { skill: level } }
    teams: Dict[str, Dict[str, int]]
    # { faculty_id: { skill: level } }
    mentors: Dict[str, Dict[str, int]]
    # { faculty_id: max_teams_integer }
    capacities: Optional[Dict[str, int]] = None
    # Optional explicit team preference override: { team_id: [mentor_id_rank1, ...] }
    team_preference_overrides: Optional[Dict[str, List[str]]] = None
    # Optional explicit mentor preference override: { mentor_id: [team_id_rank1, ...] }
    mentor_preference_overrides: Optional[Dict[str, List[str]]] = None


@router.post("/mentors", response_model=List[MentorMatchResult])
def match_mentors(req: MentorMatchRequest) -> List[MentorMatchResult]:
    """
    Returns top_n faculty ranked by expertise-overlap score with workload penalty.
    Used for on-demand candidate discovery by student team leaders.
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


@router.post("/mentors/stable-allocation", response_model=GlobalMatchingReport)
def match_mentors_stable_allocation(req: StableAllocationRequest) -> GlobalMatchingReport:
    """
    Gale-Shapley (Hospitals/Residents) Stable Allocation Algorithm.
    Computes two-sided preferences from mutual skill-overlap matrices and runs
    Student-Proposing Deferred Acceptance, guaranteeing a stable, blocking-pair-free matching.
    """
    if not req.teams or not req.mentors:
        return GlobalMatchingReport(
            allocations=[],
            mentor_summaries=[],
            unassigned_teams=list(req.teams.keys()),
            total_teams=len(req.teams),
            total_matched=0,
            is_globally_stable=True,
            iterations_run=0,
        )

    # 1. Build unified vocabulary across all teams and faculty
    all_skills = list(req.teams.values()) + list(req.mentors.values())
    vocab = build_skill_vocabulary(all_skills)

    team_vecs = {t_id: vectorize(skills, vocab) for t_id, skills in req.teams.items()}
    mentor_vecs = {m_id: vectorize(skills, vocab) for m_id, skills in req.mentors.items()}

    # 2. Compute full mutual compatibility matrix and skill overlap
    compat_matrix: Dict[str, Dict[str, float]] = {}
    skills_matrix: Dict[str, Dict[str, List[str]]] = {}

    for t_id, t_vec in team_vecs.items():
        compat_matrix[t_id] = {}
        skills_matrix[t_id] = {}
        for m_id, m_vec in mentor_vecs.items():
            score, matched = overlap_score_with_penalty(
                t_vec, m_vec, vocab, current_load=0, max_capacity=MAX_CAPACITY_DEFAULT
            )
            compat_matrix[t_id][m_id] = score
            skills_matrix[t_id][m_id] = matched

    # 3. Generate two-sided preference rankings
    # Team preferences: rank mentors descending by compatibility score
    team_preferences: Dict[str, List[str]] = {}
    for t_id in req.teams:
        if req.team_preference_overrides and t_id in req.team_preference_overrides:
            team_preferences[t_id] = req.team_preference_overrides[t_id]
        else:
            # Sort all mentors by compatibility score descending
            ranked = sorted(req.mentors.keys(), key=lambda m: compat_matrix[t_id].get(m, 0.0), reverse=True)
            team_preferences[t_id] = ranked

    # Mentor preferences: rank teams descending by compatibility score
    mentor_preferences: Dict[str, List[str]] = {}
    for m_id in req.mentors:
        if req.mentor_preference_overrides and m_id in req.mentor_preference_overrides:
            mentor_preferences[m_id] = req.mentor_preference_overrides[m_id]
        else:
            ranked = sorted(req.teams.keys(), key=lambda t: compat_matrix[t].get(m_id, 0.0), reverse=True)
            mentor_preferences[m_id] = ranked

    # Capacities
    capacities = req.capacities or {m: MAX_CAPACITY_DEFAULT for m in req.mentors}

    # 4. Run Gale-Shapley Deferred Acceptance
    return deferred_acceptance_many_to_one(
        team_preferences=team_preferences,
        mentor_preferences=mentor_preferences,
        mentor_capacities=capacities,
        compatibility_matrix=compat_matrix,
        matching_skills_matrix=skills_matrix,
    )

