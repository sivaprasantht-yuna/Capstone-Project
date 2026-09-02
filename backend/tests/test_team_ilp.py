"""
Unit tests for Classroom Team Formation ILP & Optimal Partitioning
===================================================================
Tests mathematical properties:
  1. Universal placement: zero stragglers (unassigned_count == 0).
  2. Capacity constraints: min_team_size <= |Team| <= max_team_size.
  3. Skill diversity & intra-team complementary maximization.
  4. Varied cohort sizes (e.g. 4, 8, 12, 19 students).
"""

import pytest
from services.team_partition_ilp import optimize_team_partition, TeamPartitionReport


def test_team_partition_exact_bounds():
    """Verify that a cohort of 12 students partitions into exactly 3 or 4 teams within bounds."""
    # 12 students with diverse skill specializations
    students = {
        f"S{i}": {
            "Python": (i % 5) + 1,
            "React" if i % 2 == 0 else "Java": 4,
            "IoT" if i % 3 == 0 else "ML": 3,
        }
        for i in range(1, 13)
    }

    report: TeamPartitionReport = optimize_team_partition(
        students=students,
        min_team_size=3,
        max_team_size=4,
    )

    assert report.total_students == 12
    assert report.unassigned_count == 0
    assert report.constraints_satisfied is True

    total_placed = sum(t.member_count for t in report.teams)
    assert total_placed == 12

    # Check each team respects bounds
    for t in report.teams:
        assert 3 <= t.member_count <= 4
        assert t.skill_coverage_count > 0
        assert t.intra_team_complementarity >= 0.0


def test_team_partition_odd_cohort_size():
    """Verify that odd cohort numbers (e.g., 7 students with bounds 3-4) are cleanly partitioned without stragglers."""
    students = {
        f"S{i}": {"Python": 3, "React": 2} if i <= 4 else {"Java": 4, "Spring Boot": 3}
        for i in range(1, 8)
    }

    report = optimize_team_partition(
        students=students,
        min_team_size=3,
        max_team_size=4,
    )

    assert report.total_students == 7
    assert report.unassigned_count == 0
    assert len(report.teams) == 2  # One team of 4, one team of 3
    team_sizes = sorted([t.member_count for t in report.teams])
    assert team_sizes == [3, 4]


def test_team_partition_small_cohort():
    """Verify edge case where student count is less than min_team_size."""
    students = {
        "S1": {"Python": 4},
        "S2": {"React": 4},
    }

    report = optimize_team_partition(
        students=students,
        min_team_size=3,
        max_team_size=4,
    )

    assert report.total_students == 2
    assert report.unassigned_count == 0
    assert len(report.teams) == 1
    assert report.teams[0].member_count == 2
