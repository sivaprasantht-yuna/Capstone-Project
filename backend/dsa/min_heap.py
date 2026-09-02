"""
dsa/min_heap.py
───────────────────────────────────────────────────────────────────────────────
Battle-tested Top-N and Min-Heap abstractions powered by Python's standard 
library `heapq` module (C-optimized, audited, and memory-efficient).

WHY HEAPQ?
  • Python's `heapq` is implemented in C with proven correctness and optimization.
  • BoundedMaxHeap maintains O(K) memory and O(N log K) time complexity for 
    top-K candidate extraction without hand-rolled pointer manipulation.
"""

import heapq
from typing import Any, List, Tuple


class MinHeap:
    """
    A generic min-heap operating on (key, value) pairs, backed by python's `heapq`.
    Operations: push O(log n), pop O(log n), peek O(1).
    """

    def __init__(self):
        self._data: List[Tuple[float, int, Any]] = []
        self._counter: int = 0  # Tie-breaker to prevent comparing non-comparable values

    def push(self, key: float, value: Any) -> None:
        """Insert (key, value). Smaller key = higher priority."""
        self._counter += 1
        heapq.heappush(self._data, (key, self._counter, value))

    def pop(self) -> Tuple[float, Any]:
        """Remove and return the minimum (key, value) pair."""
        if not self._data:
            raise IndexError("pop from empty heap")
        key, _, value = heapq.heappop(self._data)
        return (key, value)

    def peek(self) -> Tuple[float, Any]:
        """Return minimum without removing. O(1)."""
        if not self._data:
            raise IndexError("peek on empty heap")
        return (self._data[0][0], self._data[0][2])

    def __len__(self) -> int:
        return len(self._data)


class BoundedMaxHeap:
    """
    A bounded max-heap of size K for top-K extraction backed by standard library `heapq`.

    Internally uses a min-heap of size K:
    - When heap is full and a new score > heap minimum, evict the minimum via heappushpop
    - Keeps only the K largest scores in memory at all times
    - Time: O(N log K), Space: O(K)

    Usage:
        heap = BoundedMaxHeap(k=5)
        for candidate in large_candidate_list:
            heap.push(candidate["match_score"], candidate)
        top_5 = heap.extract_all_sorted()   # descending by score
    """

    def __init__(self, k: int):
        if k <= 0:
            raise ValueError("k must be positive")
        self._k = k
        self._heap: List[Tuple[float, int, Any]] = []
        self._counter: int = 0

    def push(self, score: float, value: Any) -> None:
        self._counter += 1
        entry = (score, self._counter, value)
        if len(self._heap) < self._k:
            heapq.heappush(self._heap, entry)
        elif score > self._heap[0][0]:
            heapq.heappushpop(self._heap, entry)

    def extract_all_sorted(self) -> List[dict]:
        """
        Extract all K results in DESCENDING order of score.
        The heap is emptied after this call.
        """
        results: List[dict] = []
        # Sort current items descending by score
        sorted_entries = sorted(self._heap, key=lambda x: x[0], reverse=True)
        self._heap.clear()
        return [{"score": score, "data": value} for score, _, value in sorted_entries]

    def __len__(self) -> int:
        return len(self._heap)

