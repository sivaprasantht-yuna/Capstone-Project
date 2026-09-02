"""
Unit tests for Dual-Pass Lexical (TF-IDF) + Semantic Plagiarism Detection
=========================================================================
Tests:
  1. Exact duplicate detection (Lexical Pass 1)
  2. Paraphrased / synonym-substituted idea detection (Semantic Pass 2)
  3. Distinct idea handling
  4. Empty corpus edge cases
"""

import pytest
from routers.idea_similarity import check_idea_similarity, IdeaSimilarityRequest


def test_exact_duplicate_detection():
    """Verify that identical or near-identical text is flagged as an exact duplicate."""
    existing = [
        "IoT-based smart agriculture monitoring system using soil moisture sensors",
        "Blockchain decentralized voting platform for student elections",
    ]
    new_idea = "IoT based smart agriculture monitoring system using sensors and microcontrollers"

    res = check_idea_similarity(IdeaSimilarityRequest(
        new_idea=new_idea,
        existing_ideas=existing,
    ))

    assert len(res) == 1
    result = res[0]
    assert result.is_duplicate is True
    assert result.most_similar_idea == existing[0]
    assert result.lexical_score >= 0.50


def test_paraphrased_semantic_duplicate_detection():
    """Verify that paraphrased descriptions with different vocabulary are caught by Semantic Pass 2."""
    existing = [
        "Autonomous drone navigation using computer vision for obstacle avoidance in orchards",
        "Hospital bed allocation and patient triage management system",
    ]
    # Paraphrased version with synonyms
    new_idea = "Autonomous drone flight using computer cameras for obstacle avoidance in orchards"

    res = check_idea_similarity(IdeaSimilarityRequest(
        new_idea=new_idea,
        existing_ideas=existing,
        enable_semantic_pass=True,
    ))

    assert len(res) == 1
    result = res[0]
    assert result.most_similar_idea == existing[0]
    assert result.semantic_score > 0.40
    assert result.is_duplicate is True


def test_distinct_proposal():
    """Verify that an unrelated idea is marked as a distinct proposal."""
    existing = [
        "Smart grid energy load forecasting with LSTM neural networks",
        "Augmented reality campus navigation app for mobile devices",
    ]
    new_idea = "Automated enzymatic biofuel synthesis pipeline using algae cultures"

    res = check_idea_similarity(IdeaSimilarityRequest(
        new_idea=new_idea,
        existing_ideas=existing,
    ))

    assert len(res) == 1
    result = res[0]
    assert result.is_duplicate is False
    assert result.match_classification in ["DISTINCT_PROPOSAL", "THEMATIC_OVERLAP"]


def test_empty_corpus():
    """Verify edge case when existing ideas list is empty."""
    res = check_idea_similarity(IdeaSimilarityRequest(
        new_idea="Smart water meter",
        existing_ideas=[],
    ))
    assert len(res) == 1
    assert res[0].is_duplicate is False
    assert res[0].max_similarity == 0.0
