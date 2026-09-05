import gc
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.schemas import ScanDocumentResponse, ConceptualProjectIdea, IdeaMatch
from app.services.parser import extract_text_in_memory
from app.services.embedder import embedder_service
from app.services.database import db_service
from app.agents.distiller import distiller_agent

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure embedder is loaded on startup
    _ = embedder_service
    print("[Engine] Zero-Storage Idea Distillation & Vector Deduplication Engine Ready.")
    yield
    print("[Engine] Shutting down cleanly.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.VERSION,
        "embedding_model": settings.EMBEDDING_MODEL_NAME,
        "embedding_dimension": settings.EMBEDDING_DIMENSION,
        "similarity_threshold": settings.SIMILARITY_THRESHOLD,
        "status": "online"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "embedding_engine": "FastEmbed CPU BGE-Small (384-dim)",
        "pgvector_ready": True,
        "storage_mode": "ZERO_STORAGE_RAM_ONLY"
    }

@app.get("/api/ideas")
def get_indexed_ideas(limit: int = 50):
    """Returns list of stored unique conceptual project ideas."""
    return db_service.get_all_ideas(limit=limit)

@app.post("/api/scan-document", response_model=ScanDocumentResponse)
async def scan_document(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None)
):
    """
    1. Extracts text strictly in-memory (RAM).
    2. Distills into pure conceptual overview with implementation blacklist checks.
    3. Generates 384-dim CPU FastEmbed vector.
    4. Evaluates cosine similarity deduplication gate on Supabase pgvector:
       - If similarity >= 0.85: returns stored=False, duplicate alert.
       - If similarity < 0.85: commits record, returns stored=True.
    """
    extracted_text = ""
    
    if file:
        file_bytes = await file.read()
        extracted_text = extract_text_in_memory(file_bytes, file.filename)
        # Free memory buffer immediately
        del file_bytes
        gc.collect()
    elif text:
        extracted_text = text.strip()
    else:
        raise HTTPException(status_code=400, detail="Must provide either a file upload or text content.")

    if not extracted_text or len(extracted_text.strip()) < 5:
        raise HTTPException(status_code=400, detail="Document contains insufficient readable text.")

    # 1. Cognitive Distillation & Sanitization
    concept = distiller_agent.distill(extracted_text)

    # 2. Local CPU Vector Embedding (384-dim)
    semantic_content = (
        f"{concept.title}. {concept.problem_statement} {concept.conceptual_vision} {concept.intended_impact}"
    )
    embedding = embedder_service.embed_text(semantic_content)

    # 3. Supabase pgvector Deduplication Gate
    stored, similarity, existing_match = db_service.check_and_save_idea(
        idea=concept,
        embedding=embedding,
        threshold=settings.SIMILARITY_THRESHOLD
    )

    if stored:
        message = "New unique concept successfully distilled and indexed in vector database."
        status_code = "UNIQUE_INDEXED"
    else:
        match_title = existing_match.title if existing_match else "Existing Concept"
        pct = round(similarity * 100, 1)
        message = f"Concept Exists: '{match_title}' ({pct}% Match) - Storage Skipped."
        status_code = "DUPLICATE_GATED"

    return ScanDocumentResponse(
        status=status_code,
        stored=stored,
        message=message,
        similarity=similarity,
        existing_match=existing_match,
        data=concept
    )
