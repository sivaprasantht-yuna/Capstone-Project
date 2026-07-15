"""
dsa/skill_graph.py
───────────────────────────────────────────────────────────────────────────────
Skill Compatibility Graph using Adjacency List representation.

PURPOSE:
  Finds "skill bridges" between departments — students who possess skills that
  connect otherwise isolated departments. Used by the /graph/skill-bridges API
  to suggest cross-disciplinary team compositions.

GRAPH MODEL:
  • Vertices  : skill nodes (e.g., "Python", "IoT", "UI/UX Design")
  • Edges     : weighted by co-occurrence in real teams or by semantic
                compatibility (predefined compatibility matrix)
  • Direction : undirected (skill A compatible with skill B = B compatible with A)

DSA USED:
  • Adjacency List  → dict[str, list[(str, float)]]  space O(V + E)
  • BFS             → O(V + E) for reachability / shortest skill path
  • DFS             → O(V + E) for connected component discovery
  • Union-Find      → O(α(N)) amortized for cluster merging
"""

from collections import deque, defaultdict
from typing import Dict, List, Optional, Set, Tuple


# Predefined skill compatibility weights (0.0 – 1.0)
# A higher weight = skills pair naturally in real projects
SKILL_COMPATIBILITY: Dict[str, Dict[str, float]] = {
    "Python":           {"Machine Learning": 0.95, "Data Science": 0.90, "IoT": 0.75, "Deep Learning": 0.90, "Computer Vision": 0.85},
    "Machine Learning": {"Python": 0.95, "Data Science": 0.90, "TensorFlow": 0.95, "Deep Learning": 0.88, "Computer Vision": 0.80},
    "Deep Learning":    {"TensorFlow": 0.95, "Python": 0.90, "Computer Vision": 0.92, "Machine Learning": 0.88},
    "TensorFlow":       {"Deep Learning": 0.95, "Machine Learning": 0.90, "Python": 0.85},
    "Computer Vision":  {"Deep Learning": 0.92, "Python": 0.85, "Machine Learning": 0.80},
    "IoT":              {"Embedded C": 0.95, "Arduino": 0.90, "PCB Design": 0.80, "Python": 0.75, "React": 0.40},
    "Embedded C":       {"IoT": 0.95, "Arduino": 0.88, "PCB Design": 0.85},
    "Arduino":          {"IoT": 0.90, "Embedded C": 0.88, "3D Printing": 0.50},
    "PCB Design":       {"Embedded C": 0.85, "IoT": 0.80},
    "React":            {"Node.js": 0.92, "UI/UX Design": 0.75, "Figma": 0.60, "MongoDB": 0.55},
    "Node.js":          {"React": 0.92, "MongoDB": 0.85, "PostgreSQL": 0.65},
    "Spring Boot":      {"PostgreSQL": 0.88, "Java": 0.95, "Docker": 0.70},
    "Java":             {"Spring Boot": 0.95, "PostgreSQL": 0.80},
    "PostgreSQL":       {"Spring Boot": 0.88, "Node.js": 0.65, "Data Science": 0.55},
    "MongoDB":          {"Node.js": 0.85, "React": 0.55},
    "Docker":           {"Cloud (AWS/GCP)": 0.88, "Spring Boot": 0.70},
    "Cloud (AWS/GCP)":  {"Docker": 0.88, "Cybersecurity": 0.60},
    "UI/UX Design":     {"Figma": 0.95, "React": 0.75, "AR/VR": 0.65},
    "Figma":            {"UI/UX Design": 0.95, "React": 0.60},
    "AR/VR":            {"UI/UX Design": 0.65, "3D Printing": 0.55},
    "Data Science":     {"Python": 0.90, "Machine Learning": 0.90, "PostgreSQL": 0.55},
    "Blockchain":       {"Cybersecurity": 0.65},
    "Cybersecurity":    {"Cloud (AWS/GCP)": 0.60, "Blockchain": 0.65},
    "3D Printing":      {"Arduino": 0.50, "AR/VR": 0.55},
    "Business Analysis":{"Data Science": 0.60},
}


class SkillGraph:
    """
    Undirected weighted skill compatibility graph.

    Operations:
        add_skill(name)             → add vertex
        add_compatibility(a, b, w)  → add weighted edge
        bfs(source)                 → shortest-hop reachability
        dfs(source)                 → full component discovery
        shortest_skill_path(a, b)   → BFS path between two skills
        connected_components()      → Union-Find clustering
        skill_bridges(user_skills)  → recommend complementary skills
    """

    def __init__(self):
        # Adjacency list: skill → [(neighbour, weight), ...]
        self._adj: Dict[str, List[Tuple[str, float]]] = defaultdict(list)
        self._vertices: Set[str] = set()

    # ── Build graph ───────────────────────────────────────────────────────────

    def add_skill(self, name: str) -> None:
        self._vertices.add(name)
        if name not in self._adj:
            self._adj[name] = []

    def add_compatibility(self, skill_a: str, skill_b: str, weight: float) -> None:
        """Add undirected edge with weight."""
        self.add_skill(skill_a)
        self.add_skill(skill_b)
        # Prevent duplicate edges
        if not any(nb == skill_b for nb, _ in self._adj[skill_a]):
            self._adj[skill_a].append((skill_b, weight))
            self._adj[skill_b].append((skill_a, weight))

    @classmethod
    def from_compatibility_matrix(cls) -> "SkillGraph":
        """Factory: build the graph from the hardcoded compatibility matrix."""
        g = cls()
        for skill_a, neighbours in SKILL_COMPATIBILITY.items():
            for skill_b, weight in neighbours.items():
                g.add_compatibility(skill_a, skill_b, weight)
        return g

    # ── Traversal algorithms ──────────────────────────────────────────────────

    def bfs(self, source: str) -> Dict[str, int]:
        """
        Breadth-First Search from source.
        Returns dict[skill → hop_distance] for all reachable skills.
        Time: O(V + E)
        """
        if source not in self._vertices:
            return {}

        distance: Dict[str, int] = {source: 0}
        queue: deque[str] = deque([source])

        while queue:
            current = queue.popleft()
            for neighbour, _ in self._adj[current]:
                if neighbour not in distance:
                    distance[neighbour] = distance[current] + 1
                    queue.append(neighbour)

        return distance

    def dfs(self, source: str, visited: Optional[Set[str]] = None) -> Set[str]:
        """
        Depth-First Search from source.
        Returns the set of all reachable skill nodes.
        Time: O(V + E)
        """
        if visited is None:
            visited = set()
        if source not in self._vertices or source in visited:
            return visited

        visited.add(source)
        for neighbour, _ in self._adj[source]:
            self.dfs(neighbour, visited)
        return visited

    def shortest_skill_path(self, skill_a: str, skill_b: str) -> Optional[List[str]]:
        """
        Find shortest hop-path between two skills using BFS.
        Returns the path as a list of skill names, or None if unreachable.
        Time: O(V + E)
        """
        if skill_a not in self._vertices or skill_b not in self._vertices:
            return None
        if skill_a == skill_b:
            return [skill_a]

        parent: Dict[str, Optional[str]] = {skill_a: None}
        queue: deque[str] = deque([skill_a])

        while queue:
            current = queue.popleft()
            if current == skill_b:
                # Reconstruct path
                path = []
                node: Optional[str] = skill_b
                while node is not None:
                    path.append(node)
                    node = parent[node]
                path.reverse()
                return path
            for neighbour, _ in self._adj[current]:
                if neighbour not in parent:
                    parent[neighbour] = current
                    queue.append(neighbour)

        return None  # No path

    # ── Union-Find for connected components ───────────────────────────────────

    def connected_components(self) -> List[Set[str]]:
        """
        Find all connected components using Union-Find (Disjoint Set Union).
        Time: O(V · α(V)) where α is the inverse Ackermann function (≈ O(1))
        """
        parent = {v: v for v in self._vertices}
        rank   = {v: 0 for v in self._vertices}

        def find(x: str) -> str:
            """Path-compressed find."""
            if parent[x] != x:
                parent[x] = find(parent[x])  # Path compression
            return parent[x]

        def union(x: str, y: str) -> None:
            """Union by rank."""
            rx, ry = find(x), find(y)
            if rx == ry:
                return
            if rank[rx] < rank[ry]:
                rx, ry = ry, rx
            parent[ry] = rx
            if rank[rx] == rank[ry]:
                rank[rx] += 1

        for skill_a in self._vertices:
            for skill_b, _ in self._adj[skill_a]:
                union(skill_a, skill_b)

        # Group by representative
        clusters: Dict[str, Set[str]] = defaultdict(set)
        for v in self._vertices:
            clusters[find(v)].add(v)
        return list(clusters.values())

    # ── Application logic ──────────────────────────────────────────────────────

    def skill_bridges(self, user_skills: List[str], top_n: int = 5) -> List[dict]:
        """
        For a given user skill set, suggest complementary skills that:
        1. Are reachable from at least one user skill (connected in graph)
        2. Are NOT already in the user's skill set
        3. Are ranked by average compatibility weight to user's existing skills

        This is the cross-department "bridge" discovery used in the
        teammate matching explanation UI.

        Time: O(S · (V + E)) where S = |user_skills|
        """
        user_set = set(user_skills)
        candidate_scores: Dict[str, float] = defaultdict(float)
        candidate_count:  Dict[str, int]   = defaultdict(int)

        for skill in user_skills:
            if skill not in self._adj:
                continue
            for neighbour, weight in self._adj[skill]:
                if neighbour not in user_set:
                    candidate_scores[neighbour] += weight
                    candidate_count[neighbour]  += 1

        # Average weight across all user skills that connect to this candidate
        scored: List[Tuple[float, str]] = []
        for skill, total_weight in candidate_scores.items():
            avg = total_weight / candidate_count[skill]
            scored.append((avg, skill))

        # Sort descending by average compatibility
        scored.sort(key=lambda x: -x[0])

        return [
            {
                "skill": skill,
                "avg_compatibility": round(score, 4),
                "hop_distance": min(
                    self.bfs(us).get(skill, 99)
                    for us in user_skills if us in self._vertices
                ),
            }
            for score, skill in scored[:top_n]
        ]

    def adjacency_report(self) -> dict:
        """Return graph stats for the /graph/info API endpoint."""
        edge_count = sum(len(v) for v in self._adj.values()) // 2
        components = self.connected_components()
        return {
            "vertex_count": len(self._vertices),
            "edge_count": edge_count,
            "component_count": len(components),
            "largest_component_size": max((len(c) for c in components), default=0),
            "skills": sorted(self._vertices),
        }


# Module-level singleton — built once on import
SKILL_GRAPH = SkillGraph.from_compatibility_matrix()
