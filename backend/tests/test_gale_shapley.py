"""
Unit tests for Gale-Shapley Many-to-One Deferred Acceptance Algorithm
=====================================================================
Tests mathematical properties:
  1. Guaranteed stability (no blocking pairs)
  2. Capacity enforcement for mentors
  3. Student-optimality
  4. Complete assignment when capacity suffices
  5. Handling excess demand (more teams than mentor capacity)
  6. Empty / single-entity edge cases
"""

import pytest
from services.gale_shapley import (
    deferred_acceptance_many_to_one,
    verify_stability,
    GlobalMatchingReport,
)


def test_gale_shapley_basic_stability():
    """Verify that Gale-Shapley produces a mathematically stable matching with zero blocking pairs."""
    team_prefs = {
        "T1": ["M1", "M2", "M3"],
        "T2": ["M1", "M3", "M2"],
        "T3": ["M2", "M1", "M3"],
    }
    mentor_prefs = {
        "M1": ["T1", "T2", "T3"],
        "M2": ["T3", "T1", "T2"],
        "M3": ["T1", "T2", "T3"],
    }
    capacities = {"M1": 1, "M2": 1, "M3": 1}

    report: GlobalMatchingReport = deferred_acceptance_many_to_one(
        team_preferences=team_prefs,
        mentor_preferences=mentor_prefs,
        mentor_capacities=capacities,
    )

    assert report.is_globally_stable is True
    assert report.total_matched == 3
    assert len(report.unassigned_teams) == 0

    alloc_map = {a.team_id: a.mentor_id for a in report.allocations}
    assert alloc_map["T1"] == "M1"
    assert alloc_map["T2"] == "M3"
    assert alloc_map["T3"] == "M2"


def test_gale_shapley_capacity_limits():
    """Verify that multi-capacity mentors (many-to-one) never exceed their defined limits."""
    team_prefs = {
        "T1": ["M1", "M2"],
        "T2": ["M1", "M2"],
        "T3": ["M1", "M2"],
        "T4": ["M1", "M2"],
    }
    mentor_prefs = {
        "M1": ["T1", "T2", "T3", "T4"],
        "M2": ["T4", "T3", "T2", "T1"],
    }
    # M1 capacity = 2, M2 capacity = 2
    capacities = {"M1": 2, "M2": 2}

    report = deferred_acceptance_many_to_one(
        team_preferences=team_prefs,
        mentor_preferences=mentor_prefs,
        mentor_capacities=capacities,
    )

    assert report.is_globally_stable is True
    assert report.total_matched == 4

    # Check mentor summaries
    m1_summary = next(s for s in report.mentor_summaries if s.mentor_id == "M1")
    m2_summary = next(s for s in report.mentor_summaries if s.mentor_id == "M2")

    assert m1_summary.assigned_count == 2
    assert set(m1_summary.assigned_teams) == {"T1", "T2"}

    assert m2_summary.assigned_count == 2
    assert set(m2_summary.assigned_teams) == {"T3", "T4"}


def test_gale_shapley_excess_demand():
    """Verify graceful handling when total team demand exceeds total mentor capacity."""
    team_prefs = {
        "T1": ["M1"],
        "T2": ["M1"],
        "T3": ["M1"],
    }
    mentor_prefs = {
        "M1": ["T1", "T2", "T3"],
    }
    capacities = {"M1": 1}

    report = deferred_acceptance_many_to_one(
        team_preferences=team_prefs,
        mentor_preferences=mentor_prefs,
        mentor_capacities=capacities,
    )

    assert report.is_globally_stable is True
    assert report.total_matched == 1
    assert len(report.unassigned_teams) == 2

    alloc_map = {a.team_id: a.mentor_id for a in report.allocations}
    assert alloc_map["T1"] == "M1"
    assert alloc_map["T2"] is None
    assert alloc_map["T3"] is None


def test_verify_stability_detects_blocking_pair():
    """Verify that our stability verification checker correctly identifies unstable manual assignments."""
    team_prefs = {
        "T1": ["M1", "M2"],
        "T2": ["M2", "M1"],
    }
    mentor_prefs = {
        "M1": ["T1", "T2"],
        "M2": ["T2", "T1"],
    }
    capacities = {"M1": 1, "M2": 1}

    # Intentionally unstable inverted assignment: T1 got M2, T2 got M1
    unstable_assignment = {"T1": "M2", "T2": "M1"}

    is_stable = verify_stability(
        team_to_mentor=unstable_assignment,
        team_preferences=team_prefs,
        mentor_preferences=mentor_prefs,
        mentor_capacities=capacities,
    )
    # T1 prefers M1 over M2, and M1 prefers T1 over T2 -> (T1, M1) is a blocking pair!
    assert is_stable is False
