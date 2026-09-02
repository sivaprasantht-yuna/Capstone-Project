"""
Tests for the cosine similarity matching engine
"""
import pytest
from services.cosine_engine import (
    build_skill_vocabulary, vectorize, complementary_score, overlap_score_with_penalty
)


class TestBuildVocabulary:
    def test_builds_sorted_unique_vocab(self):
        maps = [{"Python": 3, "React": 2}, {"IoT": 4, "Python": 1}]
        vocab = build_skill_vocabulary(maps)
        assert vocab == ["IoT", "Python", "React"]

    def test_empty_maps(self):
        assert build_skill_vocabulary([]) == []


class TestVectorize:
    def test_vectorizes_correctly(self):
        vocab = ["IoT", "Python", "React"]
        v = vectorize({"Python": 3, "React": 1}, vocab)
        assert list(v) == [0.0, 3.0, 1.0]

    def test_unknown_skills_become_zero(self):
        vocab = ["Python"]
        v = vectorize({"JavaScript": 4}, vocab)
        assert v[0] == 0.0


class TestComplementaryScore:
    def test_perfect_complement_scores_high(self):
        vocab = ["A", "B"]
        req  = vectorize({"A": 4}, vocab)   # strong in A, weak in B
        cand = vectorize({"B": 4}, vocab)   # strong in B, weak in A
        score, skills = complementary_score(req, cand, vocab)
        assert score > 0.4
        assert "B" in skills

    def test_identical_skills_scores_low(self):
        vocab = ["A", "B"]
        vec  = vectorize({"A": 4, "B": 4}, vocab)
        score, _ = complementary_score(vec, vec, vocab)
        assert score < 0.1   # no gaps to fill


class TestOverlapScore:
    def test_full_overlap_scores_high(self):
        vocab = ["Python", "ML"]
        team    = vectorize({"Python": 3, "ML": 2}, vocab)
        faculty = vectorize({"Python": 4, "ML": 4}, vocab)
        score, skills = overlap_score_with_penalty(team, faculty, vocab, 0, 5)
        assert score > 0.9
        assert "Python" in skills

    def test_workload_penalty_reduces_score(self):
        vocab = ["Python"]
        team    = vectorize({"Python": 3}, vocab)
        faculty = vectorize({"Python": 4}, vocab)
        score_low_load  = overlap_score_with_penalty(team, faculty, vocab, 0, 5)[0]
        score_high_load = overlap_score_with_penalty(team, faculty, vocab, 5, 5)[0]
        assert score_high_load < score_low_load

    def test_no_overlap_scores_zero(self):
        vocab = ["Python", "IoT"]
        team    = vectorize({"Python": 3}, vocab)
        faculty = vectorize({"IoT": 4}, vocab)
        score, skills = overlap_score_with_penalty(team, faculty, vocab, 0, 5)
        assert score == 0.0
        assert skills == []
