"""
dsa/merge_sort.py
───────────────────────────────────────────────────────────────────────────────
Battle-tested multi-key and candidate ranking routines powered by Python's
standard library Timsort (`sorted()`).

WHY PYTHON BUILT-IN SORT?
  • Python's built-in `sorted()` is implemented in C (Timsort).
  • Guarantees O(N log N) worst-case and O(N) best-case time complexity.
  • Stable sort preserves relative order for tiebreaking.
"""

from typing import Any, Callable, List, TypeVar

T = TypeVar("T")


def merge_sort(
    arr: List[T],
    key: Callable[[T], Any] = lambda x: x,
    reverse: bool = False,
) -> List[T]:
    """
    Stable sort using Python's battle-tested standard sorting engine.

    Args:
        arr:     Input list (not modified in place — returns new list)
        key:     Key extractor function, default identity
        reverse: True = descending, False = ascending

    Returns:
        New sorted list
    """
    return sorted(arr, key=key, reverse=reverse)


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
    # Apply specs from LAST to FIRST (stable Timsort maintains previous sort order)
    result = list(arr)
    for spec in reversed(sort_spec):
        field   = spec["key"]
        reverse = spec.get("reverse", False)
        result  = sorted(result, key=lambda x, f=field: x.get(f, 0), reverse=reverse)
    return result


def rank_candidates(candidates: List[dict], score_field: str = "match_score") -> List[dict]:
    """
    Sort matching candidates by score (descending) and assign ranks (1-indexed).

    Used by:
      - teammate_match router  (sort by complementarity score)
      - mentor_match router    (sort by adjusted_score)
      - idea_similarity router (sort by cosine similarity)
    """
    sorted_candidates = sorted(
        candidates,
        key=lambda c: c.get(score_field, 0.0),
        reverse=True,   # Highest score first
    )
    for idx, candidate in enumerate(sorted_candidates):
        candidate["rank"] = idx + 1
    return sorted_candidates

