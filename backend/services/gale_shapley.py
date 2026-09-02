"""
Gale-Shapley Deferred Acceptance Algorithm (Many-to-One / Hospitals-Residents Variant)
======================================================================================
Grounded in academic literature:
  • Gale & Shapley (1962), "College Admissions and the Stability of Marriage",
    American Mathematical Monthly, 69(1), 9-15.
  • Roth & Shapley — 2012 Nobel Prize in Economic Sciences for the theory of
    stable allocations and market design.
  • OPRA Framework (arXiv:2005.13714), "Optimal Program Allocation via Stable Matching".

Problem Formulation:
  • Two disjoint sets: Student Teams T = {t_1, ..., t_n} and Faculty Mentors M = {m_1, ..., m_k}.
  • Each mentor m_j has a capacity constraint C(m_j) (maximum teams they can mentor, e.g., 3-5).
  • Two-sided preference profiles:
      - Team t_i has a strict preference ranking >_{t_i} over feasible mentors,
        computed via expertise-overlap dot-product / cosine similarity.
      - Mentor m_j has a strict preference ranking >_{m_j} over student teams,
        computed via mutual project-domain alignment and skill requirements.

Properties & Guarantees:
  • Student-Optimal Stable Matching: No blocking pair (t, m) exists where team t prefers
    mentor m over its assigned mentor AND mentor m prefers team t over one of its currently
    assigned teams (or has unused capacity).
  • Time Complexity: O(|T| · |M|) operations.
  • Strategy-proof for the proposing side (Student Teams).
"""

from typing import Dict, List, Optional, Set, Tuple
from pydantic import BaseModel


class StableAllocationResult(BaseModel):
    team_id: str
    mentor_id: Optional[str]
    match_score: float
    matching_skills: List[str]
    is_stable: bool
    preference_rank: int  # Rank of assigned mentor in team's preference list (1 = top choice)


class MentorAllocationSummary(BaseModel):
    mentor_id: str
    capacity: int
    assigned_count: int
    assigned_teams: List[str]


class GlobalMatchingReport(BaseModel):
    allocations: List[StableAllocationResult]
    mentor_summaries: List[MentorAllocationSummary]
    unassigned_teams: List[str]
    total_teams: int
    total_matched: int
    is_globally_stable: bool
    iterations_run: int


def deferred_acceptance_many_to_one(
    team_preferences: Dict[str, List[str]],
    mentor_preferences: Dict[str, List[str]],
    mentor_capacities: Dict[str, int],
    compatibility_matrix: Optional[Dict[str, Dict[str, float]]] = None,
    matching_skills_matrix: Optional[Dict[str, Dict[str, List[str]]]] = None,
) -> GlobalMatchingReport:
    """
    Executes the Student-Proposing Deferred Acceptance Algorithm.

    Args:
        team_preferences: { team_id: [mentor_id_rank1, mentor_id_rank2, ...] }
        mentor_preferences: { mentor_id: [team_id_rank1, team_id_rank2, ...] }
        mentor_capacities: { mentor_id: max_teams_integer }
        compatibility_matrix: Optional { team_id: { mentor_id: float_score } }
        matching_skills_matrix: Optional { team_id: { mentor_id: [skill_names] } }

    Returns:
        GlobalMatchingReport with guaranteed stable allocations and verification metrics.
    """
    # 1. Initialize data structures
    # Mentor holdings: { mentor_id: [team_id_1, team_id_2, ...] }
    mentor_holdings: Dict[str, List[str]] = {m: [] for m in mentor_preferences}
    # Track which index in preference list each team should propose to next
    next_proposal_idx: Dict[str, int] = {t: 0 for t in team_preferences}
    # Free teams queue
    free_teams: List[str] = [t for t in team_preferences if team_preferences[t]]

    # Helper: get rank of team in mentor's preference list (lower = more preferred)
    mentor_rank_lookup: Dict[str, Dict[str, int]] = {
        m: {t: rank for rank, t in enumerate(teams)}
        for m, teams in mentor_preferences.items()
    }

    iterations = 0
    max_iterations = len(team_preferences) * max(len(mentor_preferences), 1) * 2

    # 2. Main Deferred Acceptance Loop
    while free_teams and iterations < max_iterations:
        iterations += 1
        team = free_teams.pop(0)
        prefs = team_preferences.get(team, [])

        # If team has exhausted all its preferences, it remains unassigned
        if next_proposal_idx[team] >= len(prefs):
            continue

        # Propose to the highest-ranked mentor not yet proposed to
        preferred_mentor = prefs[next_proposal_idx[team]]
        next_proposal_idx[team] += 1

        if preferred_mentor not in mentor_holdings:
            # Invalid mentor or not participating
            if next_proposal_idx[team] < len(prefs):
                free_teams.append(team)
            continue

        capacity = mentor_capacities.get(preferred_mentor, 1)
        current_held = mentor_holdings[preferred_mentor]
        rank_lookup = mentor_rank_lookup.get(preferred_mentor, {})

        # If the mentor does not have this team in its preference list, reject immediately
        if team not in rank_lookup:
            if next_proposal_idx[team] < len(prefs):
                free_teams.append(team)
            continue

        # Add team to current holdings and sort by mentor's preference
        candidates = current_held + [team]
        # Sort candidates according to mentor's preference ranking (ascending rank = best)
        candidates.sort(key=lambda t: rank_lookup.get(t, float("inf")))

        # Keep top C(m) candidates, reject the rest
        accepted = candidates[:capacity]
        rejected = candidates[capacity:]

        mentor_holdings[preferred_mentor] = accepted

        # If the proposing team was rejected, or another team was displaced, return displaced teams to free pool
        for displaced_team in rejected:
            if next_proposal_idx[displaced_team] < len(team_preferences.get(displaced_team, [])):
                free_teams.append(displaced_team)

    # 3. Construct reverse mapping: { team_id: mentor_id }
    team_to_mentor: Dict[str, str] = {}
    for mentor, held_teams in mentor_holdings.items():
        for t in held_teams:
            team_to_mentor[t] = mentor

    # 4. Verify stability of the matching (Theorem: Gale-Shapley is always stable)
    is_stable = verify_stability(
        team_to_mentor=team_to_mentor,
        team_preferences=team_preferences,
        mentor_preferences=mentor_preferences,
        mentor_capacities=mentor_capacities,
    )

    # 5. Build detailed result records
    allocations: List[StableAllocationResult] = []
    unassigned: List[str] = []

    for team_id, prefs in team_preferences.items():
        assigned_mentor = team_to_mentor.get(team_id)
        if assigned_mentor:
            score = 0.0
            if compatibility_matrix and team_id in compatibility_matrix:
                score = compatibility_matrix[team_id].get(assigned_mentor, 0.0)

            skills = []
            if matching_skills_matrix and team_id in matching_skills_matrix:
                skills = matching_skills_matrix[team_id].get(assigned_mentor, [])

            pref_rank = prefs.index(assigned_mentor) + 1 if assigned_mentor in prefs else 999

            allocations.append(StableAllocationResult(
                team_id=team_id,
                mentor_id=assigned_mentor,
                match_score=score,
                matching_skills=skills,
                is_stable=is_stable,
                preference_rank=pref_rank,
            ))
        else:
            unassigned.append(team_id)
            allocations.append(StableAllocationResult(
                team_id=team_id,
                mentor_id=None,
                match_score=0.0,
                matching_skills=[],
                is_stable=is_stable,
                preference_rank=-1,
            ))

    mentor_summaries: List[MentorAllocationSummary] = [
        MentorAllocationSummary(
            mentor_id=m,
            capacity=mentor_capacities.get(m, 1),
            assigned_count=len(held),
            assigned_teams=held,
        )
        for m, held in mentor_holdings.items()
    ]

    return GlobalMatchingReport(
        allocations=allocations,
        mentor_summaries=mentor_summaries,
        unassigned_teams=unassigned,
        total_teams=len(team_preferences),
        total_matched=len(team_to_mentor),
        is_globally_stable=is_stable,
        iterations_run=iterations,
    )


def verify_stability(
    team_to_mentor: Dict[str, str],
    team_preferences: Dict[str, List[str]],
    mentor_preferences: Dict[str, List[str]],
    mentor_capacities: Dict[str, int],
) -> bool:
    """
    Verifies that no blocking pair (t, m) exists.
    A blocking pair occurs when:
      1. Team t prefers mentor m over its currently assigned mentor (or is unassigned).
      2. Mentor m has unused capacity OR prefers team t over at least one of its currently assigned teams.
    """
    mentor_assignments: Dict[str, List[str]] = {m: [] for m in mentor_preferences}
    for t, m in team_to_mentor.items():
        if m in mentor_assignments:
            mentor_assignments[m].append(t)

    for team, t_prefs in team_preferences.items():
        assigned_m = team_to_mentor.get(team)
        assigned_idx = t_prefs.index(assigned_m) if assigned_m in t_prefs else len(t_prefs)

        # Check all mentors that team prefers over its assigned mentor
        for m in t_prefs[:assigned_idx]:
            if m not in mentor_preferences:
                continue

            m_cap = mentor_capacities.get(m, 1)
            current_held = mentor_assignments.get(m, [])
            m_prefs = mentor_preferences[m]

            # Condition 2a: Mentor m has free capacity and considers team acceptable
            if len(current_held) < m_cap and team in m_prefs:
                return False  # Blocking pair found!

            # Condition 2b: Mentor m prefers team over its worst currently assigned team
            if team in m_prefs:
                team_rank = m_prefs.index(team)
                for held_team in current_held:
                    if held_team in m_prefs and team_rank < m_prefs.index(held_team):
                        return False  # Blocking pair found!

    return True
