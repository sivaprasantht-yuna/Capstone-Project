"""
routers/graph_analysis.py
───────────────────────────────────────────────────────────────────────────────
Skill Graph Analysis API — exposes the DSA graph operations via REST endpoints.

Endpoints:
  GET  /graph/info                → graph metadata (vertices, edges, components)
  POST /graph/skill-bridges       → BFS-based complementary skill suggestions
  POST /graph/shortest-path       → shortest skill path between two skills
  GET  /graph/components          → all connected skill clusters (Union-Find)
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

from dsa.skill_graph import SKILL_GRAPH

router = APIRouter(prefix="/graph", tags=["Skill Graph (DSA)"])


# ── Request / Response models ─────────────────────────────────────────────────

class SkillBridgesRequest(BaseModel):
    user_skills: List[str]
    top_n: int = 5


class ShortestPathRequest(BaseModel):
    skill_a: str
    skill_b: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/info")
def graph_info():
    """
    Returns the skill compatibility graph metadata.

    DSA: Reports vertex count, edge count, connected components (Union-Find),
    and the largest component size.
    """
    return SKILL_GRAPH.adjacency_report()


@router.post("/skill-bridges")
def skill_bridges(req: SkillBridgesRequest):
    """
    Given a user's current skill set, recommend complementary skills
    that are reachable in the skill compatibility graph.

    DSA used:
      - Adjacency List traversal (O(V + E))
      - BFS hop-distance computation (O(V + E))
      - Result ranking by average compatibility weight

    Used by the frontend 'Team Formation' page to explain WHY certain
    teammates were recommended (they fill the top-N bridges).
    """
    bridges = SKILL_GRAPH.skill_bridges(req.user_skills, top_n=req.top_n)
    return {
        "user_skills": req.user_skills,
        "recommended_skills": bridges,
        "explanation": (
            "Skills are ranked by their average compatibility weight to your "
            "existing skill set. Hop distance shows how many steps away in the "
            "skill graph this skill is from your current skills."
        )
    }


@router.post("/shortest-path")
def shortest_skill_path(req: ShortestPathRequest):
    """
    Find the shortest path between two skills in the compatibility graph.

    DSA used: BFS — O(V + E)

    Example: Python → IoT via [Python, Machine Learning, IoT] (2 hops via shared
    data domains, or direct if weighted edge exists).

    Used to explain why two students from different departments are good matches.
    """
    path = SKILL_GRAPH.shortest_skill_path(req.skill_a, req.skill_b)
    if path is None:
        return {
            "skill_a": req.skill_a,
            "skill_b": req.skill_b,
            "connected": False,
            "path": [],
            "hops": -1,
            "message": f"'{req.skill_a}' and '{req.skill_b}' are in separate components — no compatibility path exists.",
        }
    return {
        "skill_a": req.skill_a,
        "skill_b": req.skill_b,
        "connected": True,
        "path": path,
        "hops": len(path) - 1,
        "message": f"Skills are connected in {len(path) - 1} hop(s).",
    }


@router.get("/components")
def connected_components():
    """
    Discover all connected skill clusters using Union-Find (Disjoint Set Union).

    DSA used: Union-Find with path compression + union by rank → O(V · α(V))

    Returns skill clusters that form natural technology domains.
    Useful for the Admin portal to visualize how skill domains are grouped.
    """
    components = SKILL_GRAPH.connected_components()
    return {
        "component_count": len(components),
        "components": [
            {
                "id": i + 1,
                "size": len(cluster),
                "skills": sorted(cluster),
            }
            for i, cluster in enumerate(
                sorted(components, key=len, reverse=True)  # Largest cluster first
            )
        ]
    }


@router.get("/bfs/{skill}")
def bfs_from_skill(skill: str):
    """
    Run BFS from a given skill and return hop distances to all reachable skills.

    DSA used: Breadth-First Search — O(V + E)

    Visualized in the Admin Portal's Skill Graph diagram.
    """
    distances = SKILL_GRAPH.bfs(skill)
    if not distances:
        return {"source": skill, "error": f"Skill '{skill}' not found in graph"}

    # Group by hop distance for easier visualization
    by_distance: dict = {}
    for s, d in distances.items():
        by_distance.setdefault(d, []).append(s)

    return {
        "source": skill,
        "reachable_count": len(distances) - 1,  # Exclude source itself
        "by_hop_distance": {
            str(d): sorted(skills)
            for d, skills in sorted(by_distance.items())
        }
    }
