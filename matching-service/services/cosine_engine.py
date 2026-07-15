"""
Skill-Vector Cosine Similarity Engine
======================================
Core algorithm used by both teammate and mentor matching.

Skill representation:
  - Each user has a skill-vector: { skill_name: proficiency_level (1-4) }
  - We build a unified skill vocabulary across all candidates
  - Each user becomes a dense numpy vector in that skill space
  - Cosine similarity is computed between target and all candidates

For teammate matching: we use COMPLEMENTARY logic
  → we look for GAPS in the requester's skill vector and score candidates
    higher if they fill those gaps (low requester score, high candidate score)

For mentor matching: we use OVERLAP logic
  → we look for OVERLAP between the team's combined skill vector
    and the faculty's expertise, and add a workload penalty

DSA Integration:
  - BoundedMaxHeap (dsa.min_heap)  → O(N log K) top-K gap skill extraction
  - rank_candidates (dsa.merge_sort) → O(N log N) merge sort for final ranking
  - SKILL_GRAPH (dsa.skill_graph)  → BFS for skill bridge computation
"""

import numpy as np
from typing import Dict, List, Tuple

# Import custom DSA structures
from dsa.min_heap   import BoundedMaxHeap
from dsa.merge_sort import rank_candidates


def build_skill_vocabulary(skill_vectors: List[Dict[str, int]]) -> List[str]:
    """Build a unified vocabulary of all skill names across all users."""
    vocab = set()
    for sv in skill_vectors:
        vocab.update(sv.keys())
    return sorted(vocab)


def vectorize(skill_map: Dict[str, int], vocab: List[str]) -> np.ndarray:
    """Convert a user's skill map { skill_name: level } to a dense numpy vector."""
    v = np.zeros(len(vocab), dtype=float)
    for i, skill in enumerate(vocab):
        v[i] = skill_map.get(skill, 0)
    return v


def cosine_similarity_score(a: np.ndarray, b: np.ndarray) -> float:
    """Safe cosine similarity — returns 0 if either vector is zero."""
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def complementary_score(requester_vec: np.ndarray, candidate_vec: np.ndarray, vocab: List[str]) -> Tuple[float, List[str]]:
    """
    Complementary matching score:
      - High score when candidate covers skills the requester lacks
      - Each dimension: weight = (1 - requester_normalized[i]) * candidate_normalized[i]
      - Returns score [0,1] and list of top gap-filling skills
    """
    n = len(vocab)
    if n == 0:
        return 0.0, []

    max_level = 4.0
    req_norm = requester_vec / max_level   # normalize to [0,1]
    cand_norm = candidate_vec / max_level

    gap_weights = (1.0 - req_norm) * cand_norm    # element-wise: gap × candidate strength
    score = float(np.sum(gap_weights) / n)          # normalized to [0,1]

    # ── DSA: BoundedMaxHeap for top-5 gap skills ──────────────────────────
    # O(N log 5) instead of O(N log N) with np.argsort over all skills.
    # For large skill vocabularies (100+ skills), this is significantly faster.
    heap = BoundedMaxHeap(k=5)
    for i, w in enumerate(gap_weights):
        if w > 0.1:  # Only skills that meaningfully fill a gap
            heap.push(w, vocab[i])
    top_skills = [item["data"] for item in heap.extract_all_sorted()]
    # ──────────────────────────────────────────────────────────────────────

    return round(score, 4), top_skills


def overlap_score_with_penalty(team_vec: np.ndarray, faculty_vec: np.ndarray,
                                vocab: List[str], current_load: int,
                                max_capacity: int) -> Tuple[float, List[str]]:
    """
    Mentor matching score:
      - Cosine similarity between team skills and faculty expertise
      - Workload penalty: score reduced proportionally to current load
      - Returns final score and list of matching skills
    """
    raw_score = cosine_similarity_score(team_vec, faculty_vec)

    # Workload penalty: 0 load = no penalty, full load = 100% penalty
    load_ratio = current_load / max_capacity if max_capacity > 0 else 1.0
    penalty_factor = 1.0 - (0.4 * load_ratio)   # max 40% reduction at full load
    final_score = round(raw_score * penalty_factor, 4)

    # Find overlapping skills
    overlap_skills = [vocab[i] for i in range(len(vocab))
                      if team_vec[i] > 0 and faculty_vec[i] > 0][:5]

    return final_score, overlap_skills
