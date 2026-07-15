"""
dsa/merge_sort.py
───────────────────────────────────────────────────────────────────────────────
Generic Multi-Key Merge Sort for the Leaderboard ranking system.

WHY CUSTOM MERGE SORT?
  • Python's built-in sort uses Timsort (also O(N log N)) — we implement our
    own to demonstrate the algorithm explicitly for the mini-project.
  • Our version supports multiple sort keys with per-key sort direction,
    which is needed for leaderboard tiebreaking:
        Primary   → total_score (DESC)
        Secondary → milestone_completion_pct (DESC)
        Tertiary  → team_name (ASC alphabetical)

COMPLEXITY:
  • Time:  O(N log N) — always (no worst case like quicksort)
  • Space: O(N)       — merge step requires temporary arrays

The merge sort is also used to rank idea similarity results (descending
by TF-IDF cosine score) in the idea_similarity router.
"""

from typing import Any, Callable, List, TypeVar

T = TypeVar("T")


def merge_sort(
    arr: List[T],
    key: Callable[[T], Any] = lambda x: x,
    reverse: bool = False,
) -> List[T]:
    """
    Recursive merge sort with a custom key function and sort direction.

    Args:
        arr:     Input list (not modified in place — returns new list)
        key:     Key extractor function, default identity
        reverse: True = descending, False = ascending

    Returns:
        New sorted list
    """
    if len(arr) <= 1:
        return list(arr)  # Base case

    mid   = len(arr) // 2
    left  = merge_sort(arr[:mid],  key=key, reverse=reverse)
    right = merge_sort(arr[mid:],  key=key, reverse=reverse)

    return _merge(left, right, key, reverse)


def _merge(left: List[T], right: List[T], key: Callable, reverse: bool) -> List[T]:
    """
    Merge two sorted lists into one sorted list.
    This is the core O(N) step of merge sort.
    """
    result: List[T] = []
    i = j = 0

    while i < len(left) and j < len(right):
        lk = key(left[i])
        rk = key(right[j])

        # Take from left if:
        #   ascending  → left_key ≤ right_key
        #   descending → left_key ≥ right_key
        if (not reverse and lk <= rk) or (reverse and lk >= rk):
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1

    # Append remaining elements
    result.extend(left[i:])
    result.extend(right[j:])
    return result


def multi_key_sort(arr: List[dict], sort_spec: List[dict]) -> List[dict]:
    """
    Sort a list of dicts by multiple keys with independent directions.

    Args:
        arr:       List of dicts to sort
        sort_spec: List of {"key": str, "reverse": bool} dicts,
                   applied left-to-right (first = primary sort key)

    Example:
        multi_key_sort(teams, [
            {"key": "total_score",             "reverse": True},   # DESC
            {"key": "milestone_completion_pct","reverse": True},   # DESC
            {"key": "team_name",               "reverse": False},  # ASC
        ])
    """
    # Apply specs from LAST to FIRST (stable sort maintains order)
    result = list(arr)
    for spec in reversed(sort_spec):
        field   = spec["key"]
        reverse = spec.get("reverse", False)
        result  = merge_sort(result, key=lambda x, f=field: x.get(f, 0), reverse=reverse)
    return result


def rank_candidates(candidates: List[dict], score_field: str = "match_score") -> List[dict]:
    """
    Sort matching candidates by score (descending) using merge sort.
    Adds a "rank" field (1-indexed) to each candidate.

    Used by:
      - teammate_match router  (sort by complementarity score)
      - mentor_match router    (sort by adjusted_score)
      - idea_similarity router (sort by cosine similarity)
    """
    sorted_candidates = merge_sort(
        candidates,
        key=lambda c: c.get(score_field, 0.0),
        reverse=True,   # Highest score first
    )
    for idx, candidate in enumerate(sorted_candidates):
        candidate["rank"] = idx + 1
    return sorted_candidates
