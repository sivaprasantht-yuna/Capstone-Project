"""
dsa/min_heap.py
───────────────────────────────────────────────────────────────────────────────
Custom Min-Heap implementation used for efficient Top-N candidate extraction
in the teammate and mentor matching algorithms.

WHY A HEAP?
  • Naïve approach: sort all N candidates → O(N log N)
  • Heap approach: extract top-K → O(N log K)
  • For large cohorts (1000+ students) with small K (5-10), this is ~10× faster.

DESIGN:
  • Generic min-heap on (score, payload) tuples
  • Higher match_score → higher priority  ∴ we negate score for the min-heap
  • Fixed-size "bounded heap" keeps memory at O(K) instead of O(N)
"""

from typing import Any, List, Tuple


class MinHeap:
    """
    A generic min-heap operating on (key, value) pairs.
    Standard heap operations: push O(log n), pop O(log n), peek O(1).
    """

    def __init__(self):
        self._data: List[Tuple[float, Any]] = []

    # ── Core operations ──────────────────────────────────────────────────────

    def push(self, key: float, value: Any) -> None:
        """Insert (key, value). Smaller key = higher priority."""
        self._data.append((key, value))
        self._sift_up(len(self._data) - 1)

    def pop(self) -> Tuple[float, Any]:
        """Remove and return the minimum (key, value) pair."""
        if not self._data:
            raise IndexError("pop from empty heap")
        self._swap(0, len(self._data) - 1)
        item = self._data.pop()
        if self._data:
            self._sift_down(0)
        return item

    def peek(self) -> Tuple[float, Any]:
        """Return minimum without removing. O(1)."""
        if not self._data:
            raise IndexError("peek on empty heap")
        return self._data[0]

    def __len__(self) -> int:
        return len(self._data)

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _sift_up(self, i: int) -> None:
        """Bubble element at index i up to maintain heap property."""
        while i > 0:
            parent = (i - 1) // 2
            if self._data[i][0] < self._data[parent][0]:
                self._swap(i, parent)
                i = parent
            else:
                break

    def _sift_down(self, i: int) -> None:
        """Push element at index i down to maintain heap property."""
        n = len(self._data)
        while True:
            left  = 2 * i + 1
            right = 2 * i + 2
            smallest = i

            if left < n and self._data[left][0] < self._data[smallest][0]:
                smallest = left
            if right < n and self._data[right][0] < self._data[smallest][0]:
                smallest = right

            if smallest != i:
                self._swap(i, smallest)
                i = smallest
            else:
                break

    def _swap(self, i: int, j: int) -> None:
        self._data[i], self._data[j] = self._data[j], self._data[i]


class BoundedMaxHeap:
    """
    A bounded max-heap of size K for top-K extraction.

    Internally uses a MIN-heap of size K:
    - When heap is full and a new score > heap minimum, evict the minimum
    - This keeps only the K largest scores in memory at all times
    - Time: O(N log K),  Space: O(K)

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
        self._heap = MinHeap()

    def push(self, score: float, value: Any) -> None:
        if len(self._heap) < self._k:
            self._heap.push(score, value)
        elif score > self._heap.peek()[0]:
            # New score beats the current minimum → evict minimum, insert new
            self._heap.pop()
            self._heap.push(score, value)
        # else: score is too small to make the top-K, ignore it

    def extract_all_sorted(self) -> List[dict]:
        """
        Extract all K results in DESCENDING order of score.
        The heap is emptied after this call.
        """
        results: List[Tuple[float, Any]] = []
        while len(self._heap) > 0:
            results.append(self._heap.pop())
        # Results come out in ascending order (min-heap); reverse for descending
        results.reverse()
        return [{"score": score, "data": value} for score, value in results]

    def __len__(self) -> int:
        return len(self._heap)
