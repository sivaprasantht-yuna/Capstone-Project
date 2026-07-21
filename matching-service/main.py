"""
Capstone Matching Service — Python FastAPI
=========================================
Provides AI-powered skill-vector cosine similarity matching for:
  - POST /match/teammates         — complementary teammate matching (Cosine + BoundedMaxHeap)
  - POST /match/mentors           — faculty mentor matching (Overlap + Workload Penalty)
  - POST /match/idea-similarity   — TF-IDF idea duplicate detection (Merge Sort ranking)
  - GET  /graph/info              — skill graph metadata (Adjacency List)
  - POST /graph/skill-bridges     — BFS-based complementary skill suggestions
  - POST /graph/shortest-path     — shortest skill-path between two skills (BFS)
  - GET  /graph/components        — skill clusters via Union-Find (DSU)
  - GET  /graph/bfs/{skill}       — BFS hop distances from a skill node
  - GET  /health                  — health check

DSA used: BoundedMaxHeap, Merge Sort, Adjacency List, BFS, DFS, Union-Find
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import teammate_match, mentor_match, idea_similarity
from routers import graph_analysis, document_sanitizer

app = FastAPI(
    title="Capstone Matching Microservice",
    description="Skill-vector cosine similarity & NLP-based project idea matching",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",                          # local dev
        "http://localhost:8081",                          # local dev alt port
        "https://tgashwinyt-paatu-padava.hf.space",      # HF Space Java backend
    ],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

app.include_router(teammate_match.router, prefix="/match",  tags=["Teammate Matching"])
app.include_router(mentor_match.router,   prefix="/match",  tags=["Mentor Matching"])
app.include_router(idea_similarity.router,prefix="/match",  tags=["Idea Similarity"])
app.include_router(graph_analysis.router)                                       # /graph/*
app.include_router(document_sanitizer.router)


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "capstone-matching-service"}
