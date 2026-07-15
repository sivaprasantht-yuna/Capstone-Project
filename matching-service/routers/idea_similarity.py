"""
Idea Similarity Router  (TF-IDF based plagiarism checker)
POST /match/idea-similarity

Request Body:
{
  "new_idea": "IoT-based smart agriculture monitoring system using sensors",
  "existing_ideas": [
    "Smart farming with sensor nodes and cloud analytics",
    "Real-time weather monitoring using Arduino",
    ...
  ]
}

Response:
[
  {
    "max_similarity": 0.72,
    "most_similar_idea": "Smart farming with sensor nodes...",
    "is_duplicate": true,
    "all_scores": [0.72, 0.21, ...]
  }
]
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

router = APIRouter()

SIMILARITY_THRESHOLD = 0.65   # ideas above this are flagged as potential duplicates


class IdeaSimilarityRequest(BaseModel):
    new_idea: str
    existing_ideas: List[str]


class IdeaSimilarityResult(BaseModel):
    max_similarity: float
    most_similar_idea: str
    is_duplicate: bool
    similarity_scores: List[float]


@router.post("/idea-similarity", response_model=List[IdeaSimilarityResult])
def check_idea_similarity(req: IdeaSimilarityRequest) -> List[IdeaSimilarityResult]:
    """
    Uses TF-IDF + cosine similarity to detect duplicate project ideas.
    Returns similarity scores against all existing ideas.
    """
    if not req.existing_ideas:
        return [IdeaSimilarityResult(
            max_similarity=0.0,
            most_similar_idea="",
            is_duplicate=False,
            similarity_scores=[],
        )]

    corpus = req.existing_ideas + [req.new_idea]

    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        max_features=5000,
        sublinear_tf=True
    )
    tfidf_matrix = vectorizer.fit_transform(corpus)

    # Compare new idea (last row) against all existing ideas
    new_vec = tfidf_matrix[-1]
    existing_vecs = tfidf_matrix[:-1]
    scores = cosine_similarity(new_vec, existing_vecs)[0].tolist()

    max_score = max(scores)
    most_similar_idx = int(np.argmax(scores))

    return [IdeaSimilarityResult(
        max_similarity=round(max_score, 4),
        most_similar_idea=req.existing_ideas[most_similar_idx],
        is_duplicate=max_score >= SIMILARITY_THRESHOLD,
        similarity_scores=[round(s, 4) for s in scores],
    )]
