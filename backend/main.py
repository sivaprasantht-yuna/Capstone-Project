"""
Capstone Unified Backend — Single Python FastAPI Platform
===========================================================
Unifies:
  • Auth & User Management (JWT, BCrypt, RBAC)
  • Team Lifecycle, Join Requests & Invites
  • Project Idea Repository & Plagiarism Detection
  • Team Chat (REST & WebSockets + Read Receipts)
  • Milestones, Submissions & Grading
  • AI Matching (Gale-Shapley, ILP, Dual-Pass NLP, Cosine Vectors)
  • Graph Analytics & Document Sanitizer
"""

import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from websocket_manager import ws_manager

# Import all unified routers
from routers import (
    auth, users, projects, teams, messages, milestones,
    mentorships, notifications, matching, admin,
    tasks, progress,
    teammate_match, mentor_match, idea_similarity,
    graph_analysis, document_sanitizer
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Clean startup and shutdown lifecycle management."""
    try:
        yield
    except (asyncio.CancelledError, KeyboardInterrupt):
        pass

app = FastAPI(
    title="Capstone Platform Unified Backend",
    description="Full-stack AI-Driven Capstone Collaboration & Matching Platform",
    version="2.0.0",
    lifespan=lifespan
)

# ─── CORS Middleware ──────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Mount All Routers ────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(teams.router)
app.include_router(tasks.router)
app.include_router(progress.router)
app.include_router(messages.router)
app.include_router(milestones.router)
app.include_router(mentorships.router)
app.include_router(notifications.router)
app.include_router(matching.router)
app.include_router(admin.router)

# AI Matching & Graph algorithms
app.include_router(teammate_match.router, prefix="/match", tags=["AI Teammate Matching"])
app.include_router(mentor_match.router,   prefix="/match", tags=["AI Mentor Matching"])
app.include_router(idea_similarity.router, prefix="/match", tags=["AI Idea Similarity"])
app.include_router(graph_analysis.router)
app.include_router(document_sanitizer.router)

# Zero-Storage Idea Distillation & Vector Deduplication Engine
try:
    from app.main import (
        scan_document as vector_scan_document,
        get_indexed_ideas as vector_get_indexed_ideas,
        health_check as vector_health_check
    )
    app.add_api_route("/api/scan-document", vector_scan_document, methods=["POST"], tags=["Vector Deduplication Engine"])
    app.add_api_route("/api/ideas", vector_get_indexed_ideas, methods=["GET"], tags=["Vector Deduplication Engine"])
    app.add_api_route("/api/health/vector-engine", vector_health_check, methods=["GET"], tags=["Vector Deduplication Engine"])
except Exception as e:
    print(f"[Warning] Could not mount vector engine routes: {e}")



# ─── Static Uploads Mount ───────────────────────────────────────────────────
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ─── WebSocket Chat Endpoint ──────────────────────────────────────────────────
@app.websocket("/ws/chat/{team_id}")
async def websocket_chat_endpoint(websocket: WebSocket, team_id: int):
    await ws_manager.connect(websocket, team_id)
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "PING":
                await websocket.send_json({"type": "PONG"})
                continue
            # Handle incoming WebSocket message or read receipt
            msg_type = data.get("type", "CHAT_MESSAGE")
            await ws_manager.broadcast_to_team(team_id, data)
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, team_id)
    except Exception:
        ws_manager.disconnect(websocket, team_id)


@app.websocket("/ws")
async def websocket_generic_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            if "PING" in data:
                await websocket.send_text('{"type": "PONG"}')
                continue
            await websocket.send_text(f"echo: {data}")
    except WebSocketDisconnect:
        pass


# ─── SockJS Compatibility (frontend may probe this during transition) ────────
@app.get("/ws/info", tags=["WebSocket"])
def ws_info():
    """SockJS info endpoint — returns enough for SockJS handshake to not 404."""
    return {
        "websocket": True,
        "cookie_needed": False,
        "origins": ["*:*"],
        "entropy": 0
    }


@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "UP",
        "service": "capstone-unified-fastapi-backend",
        "version": "2.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
