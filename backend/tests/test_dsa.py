"""
tests/test_dsa.py
───────────────────────────────────────────────────────────────────────────────
Unit tests for all three custom DSA modules:
  1. MinHeap / BoundedMaxHeap  (dsa/min_heap.py)
  2. SkillGraph + BFS + Union-Find  (dsa/skill_graph.py)
  3. Merge Sort  (dsa/merge_sort.py)
"""

import pytest
import sys
import os

# Make sure the matching-service root is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dsa.min_heap   import MinHeap, BoundedMaxHeap
from dsa.skill_graph import SkillGraph, SKILL_GRAPH
from dsa.merge_sort  import merge_sort, multi_key_sort, rank_candidates


# ══════════════════════════════════════════════════════════════════════════════
# MinHeap Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestMinHeap:

    def test_push_and_pop_single(self):
        heap = MinHeap()
        heap.push(5.0, "a")
        key, val = heap.pop()
        assert key == 5.0
        assert val == "a"

    def test_min_property(self):
        """After multiple pushes, pop should always return the minimum."""
        heap = MinHeap()
        for k in [3.0, 1.0, 4.0, 1.5, 9.0, 2.6]:
            heap.push(k, str(k))
        assert heap.pop()[0] == 1.0
        assert heap.pop()[0] == 1.5
        assert heap.pop()[0] == 2.6

    def test_peek_does_not_remove(self):
        heap = MinHeap()
        heap.push(2.0, "x")
        heap.push(1.0, "y")
        assert heap.peek()[0] == 1.0
        assert len(heap) == 2       # Still 2 elements

    def test_pop_empty_raises(self):
        heap = MinHeap()
        with pytest.raises(IndexError):
            heap.pop()

    def test_heap_sort(self):
        """Popping all elements from a heap gives a sorted sequence."""
        import random
        keys = [random.random() for _ in range(20)]
        heap = MinHeap()
        for k in keys:
            heap.push(k, k)
        sorted_keys = [heap.pop()[0] for _ in range(len(keys))]
        assert sorted_keys == sorted(keys)


class TestBoundedMaxHeap:

    def test_keeps_top_k(self):
        heap = BoundedMaxHeap(k=3)
        for score in [0.1, 0.9, 0.5, 0.7, 0.3, 0.8]:
            heap.push(score, score)
        results = heap.extract_all_sorted()
        scores = [r["score"] for r in results]
        assert scores == sorted([0.9, 0.8, 0.7], reverse=True)

    def test_descending_order(self):
        heap = BoundedMaxHeap(k=5)
        for s in [0.6, 0.2, 0.9, 0.4, 0.7, 0.1, 0.8]:
            heap.push(s, s)
        results = heap.extract_all_sorted()
        scores = [r["score"] for r in results]
        assert scores == sorted(scores, reverse=True)

    def test_k_equals_1(self):
        heap = BoundedMaxHeap(k=1)
        heap.push(0.3, "a")
        heap.push(0.9, "b")
        heap.push(0.5, "c")
        results = heap.extract_all_sorted()
        assert len(results) == 1
        assert results[0]["score"] == 0.9

    def test_fewer_elements_than_k(self):
        heap = BoundedMaxHeap(k=10)
        heap.push(0.5, "x")
        heap.push(0.3, "y")
        results = heap.extract_all_sorted()
        assert len(results) == 2

    def test_invalid_k(self):
        with pytest.raises(ValueError):
            BoundedMaxHeap(k=0)


# ══════════════════════════════════════════════════════════════════════════════
# SkillGraph Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestSkillGraph:

    def setup_method(self):
        """Build a small test graph for each test."""
        self.g = SkillGraph()
        self.g.add_compatibility("Python",    "Machine Learning", 0.95)
        self.g.add_compatibility("Python",    "IoT",              0.75)
        self.g.add_compatibility("Machine Learning", "TensorFlow",0.92)
        self.g.add_compatibility("React",     "Node.js",          0.90)
        # Note: React cluster is disconnected from Python cluster

    def test_add_skill(self):
        self.g.add_skill("NewSkill")
        assert len(self.g._vertices) >= 5

    def test_no_duplicate_edges(self):
        g = SkillGraph()
        g.add_compatibility("A", "B", 0.9)
        g.add_compatibility("A", "B", 0.9)  # duplicate
        assert len(g._adj["A"]) == 1

    # ── BFS ────────────────────────────────────────────────────────────────────

    def test_bfs_distances(self):
        distances = self.g.bfs("Python")
        assert distances["Python"] == 0
        assert distances["Machine Learning"] == 1
        assert distances["TensorFlow"] == 2
        assert distances["IoT"] == 1

    def test_bfs_disconnected_component(self):
        """React cluster should not appear in BFS from Python."""
        distances = self.g.bfs("Python")
        assert "React" not in distances
        assert "Node.js" not in distances

    def test_bfs_unknown_node(self):
        assert self.g.bfs("UnknownSkill") == {}

    # ── DFS ────────────────────────────────────────────────────────────────────

    def test_dfs_reachability(self):
        reachable = self.g.dfs("Python")
        assert "Python"          in reachable
        assert "Machine Learning" in reachable
        assert "TensorFlow"       in reachable
        assert "IoT"              in reachable
        assert "React"     not in reachable  # Different component

    # ── Shortest Path ──────────────────────────────────────────────────────────

    def test_shortest_path_direct(self):
        path = self.g.shortest_skill_path("Python", "Machine Learning")
        assert path == ["Python", "Machine Learning"]

    def test_shortest_path_two_hops(self):
        path = self.g.shortest_skill_path("Python", "TensorFlow")
        assert path is not None
        assert path[0] == "Python"
        assert path[-1] == "TensorFlow"
        assert len(path) == 3  # Python → Machine Learning → TensorFlow

    def test_shortest_path_same_node(self):
        path = self.g.shortest_skill_path("Python", "Python")
        assert path == ["Python"]

    def test_shortest_path_no_connection(self):
        """React and Python are disconnected — should return None."""
        path = self.g.shortest_skill_path("Python", "React")
        assert path is None

    # ── Connected Components (Union-Find) ──────────────────────────────────────

    def test_two_components(self):
        components = self.g.connected_components()
        assert len(components) == 2

    def test_component_membership(self):
        components = self.g.connected_components()
        python_component = next(c for c in components if "Python" in c)
        assert "Machine Learning" in python_component
        assert "TensorFlow"       in python_component

    # ── Global graph from compatibility matrix ────────────────────────────────

    def test_global_graph_loads(self):
        assert len(SKILL_GRAPH._vertices) >= 20

    def test_global_graph_connected(self):
        """Python should reach TensorFlow in the global graph."""
        path = SKILL_GRAPH.shortest_skill_path("Python", "TensorFlow")
        assert path is not None

    def test_skill_bridges(self):
        bridges = self.g.skill_bridges(["Python"])
        # Machine Learning and IoT are direct neighbours → should appear
        skill_names = [b["skill"] for b in bridges]
        assert "Machine Learning" in skill_names or "IoT" in skill_names


# ══════════════════════════════════════════════════════════════════════════════
# Merge Sort Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestMergeSort:

    def test_sort_ascending(self):
        result = merge_sort([3, 1, 4, 1, 5, 9, 2, 6])
        assert result == sorted([3, 1, 4, 1, 5, 9, 2, 6])

    def test_sort_descending(self):
        result = merge_sort([3, 1, 4, 1, 5], reverse=True)
        assert result == sorted([3, 1, 4, 1, 5], reverse=True)

    def test_sort_with_key(self):
        words = ["banana", "apple", "cherry", "date"]
        result = merge_sort(words, key=len)
        assert result == sorted(words, key=len)

    def test_sort_empty(self):
        assert merge_sort([]) == []

    def test_sort_single(self):
        assert merge_sort([42]) == [42]

    def test_stable_sort(self):
        """Merge sort must be stable — equal elements preserve original order."""
        items = [{"score": 5, "name": "A"}, {"score": 3, "name": "B"},
                 {"score": 5, "name": "C"}, {"score": 3, "name": "D"}]
        result = merge_sort(items, key=lambda x: x["score"], reverse=True)
        # score=5 items should come first, in original order (A before C)
        fives = [r for r in result if r["score"] == 5]
        assert fives[0]["name"] == "A"
        assert fives[1]["name"] == "C"

    def test_original_not_mutated(self):
        original = [5, 3, 1, 4]
        merge_sort(original)
        assert original == [5, 3, 1, 4]  # Original unchanged

    def test_rank_candidates(self):
        candidates = [
            {"user_id": "u1", "match_score": 0.7},
            {"user_id": "u2", "match_score": 0.9},
            {"user_id": "u3", "match_score": 0.4},
        ]
        ranked = rank_candidates(candidates)
        assert ranked[0]["user_id"] == "u2"
        assert ranked[0]["rank"] == 1
        assert ranked[1]["user_id"] == "u1"
        assert ranked[2]["rank"] == 3

    def test_multi_key_sort(self):
        teams = [
            {"name": "Alpha",   "score": 80, "completion": 0.9},
            {"name": "Beta",    "score": 90, "completion": 0.8},
            {"name": "Gamma",   "score": 80, "completion": 1.0},
        ]
        result = multi_key_sort(teams, [
            {"key": "score",      "reverse": True},
            {"key": "completion", "reverse": True},
        ])
        # Beta (90) first, then Gamma (80, 1.0) before Alpha (80, 0.9)
        assert result[0]["name"] == "Beta"
        assert result[1]["name"] == "Gamma"
        assert result[2]["name"] == "Alpha"
