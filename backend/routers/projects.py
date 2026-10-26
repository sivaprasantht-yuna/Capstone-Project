import gc
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from security import get_current_user, require_role
from tenant import tenant_filter, get_user_tenant_id

# Import Zero-Storage Vector Deduplication Engine components
from app.services.parser import extract_text_in_memory
from app.services.embedder import embedder_service
from app.services.database import db_service
from app.agents.distiller import distiller_agent
from app.config import settings

router = APIRouter(prefix="/api/v1/projects", tags=["Projects & Idea Repository"])

@router.get("", response_model=List[schemas.ProjectDto])
def get_projects(
    search: Optional[str] = None,
    domain: Optional[str] = None,
    status: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = tenant_filter(db.query(models.Project), models.Project, get_user_tenant_id(current_user))
    if status and status != "ALL":
        query = query.filter(models.Project.status == status.upper())
    else:
        query = query.filter(models.Project.status != "REJECTED")

    if domain and domain != "ALL":
        query = query.filter(models.Project.domain == domain)
    if search:
        query = query.filter(
            (models.Project.title.ilike(f"%{search}%")) |
            (models.Project.description.ilike(f"%{search}%"))
        )
    projects = query.order_by(models.Project.upvote_count.desc(), models.Project.created_at.desc()).all()
    
    res = []
    for p in projects:
        res.append(schemas.ProjectDto(
            id=p.id,
            title=p.title,
            description=p.description,
            domain=p.domain,
            techStack=p.tech_stack,
            postedById=p.posted_by_id,
            postedByName=p.posted_by.name if p.posted_by else "Anonymous",
            status=p.status,
            upvoteCount=p.upvote_count or 0,
            ideaSimilarityScore=p.similarity_score,
            createdAt=p.created_at
        ))
    return res


@router.get("/showcase")
def get_inter_college_showcase(db: Session = Depends(get_db)):
    """
    Inter-College Public Idea Showcase (read-only, no auth required).
    Returns approved project ideas from institutions that have opted in (allow_public_showcase=True).
    Only exposes title, domain, description, and institution name — no student PII or grades.
    """
    showcase_tenants = db.query(models.Tenant).filter(
        models.Tenant.allow_public_showcase == True,
        models.Tenant.is_active == True
    ).all()
    tenant_ids = [t.id for t in showcase_tenants]
    tenant_names = {t.id: t.name for t in showcase_tenants}

    if not tenant_ids:
        return []

    projects = db.query(models.Project).filter(
        models.Project.tenant_id.in_(tenant_ids),
        models.Project.status == "APPROVED"
    ).order_by(models.Project.created_at.desc()).limit(50).all()

    return [
        {
            "id": p.id,
            "title": p.title,
            "domain": p.domain or "General",
            "description": p.description[:300] if p.description else "",
            "institutionName": tenant_names.get(p.tenant_id, "Unknown Institution"),
            "createdAt": p.created_at
        }
        for p in projects
    ]


@router.get("/domains")
def get_all_domains(db: Session = Depends(get_db)):
    domains = db.query(models.Project.domain).distinct().all()
    res = [d[0] for d in domains if d[0]]
    if not res:
        res = [
            "Artificial Intelligence & Machine Learning",
            "Full-Stack Web & Cloud Systems",
            "Cybersecurity & Blockchain",
            "Internet of Things (IoT) & Embedded Systems",
            "Computer Vision & Robotics",
            "Data Engineering & Analytics",
            "Environmental Monitoring & Sustainability",
            "Healthcare & Biomedical Informatics"
        ]
    return res


@router.get("/my", response_model=List[schemas.ProjectDto])
def get_my_projects(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    projects = db.query(models.Project).filter(models.Project.posted_by_id == current_user.id).order_by(models.Project.created_at.desc()).all()
    return [
        schemas.ProjectDto(
            id=p.id,
            title=p.title,
            description=p.description,
            domain=p.domain,
            techStack=p.tech_stack,
            postedById=p.posted_by_id,
            postedByName=current_user.name,
            status=p.status,
            upvoteCount=p.upvote_count or 0,
            createdAt=p.created_at
        )
        for p in projects
    ]


@router.post("/distill-and-check")
async def distill_and_check_duplicate(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None)
):
    """
    Zero-Storage in-memory Idea Distillation & Vector Deduplication Gate.
    Checks proposal against both Reference & Personal idea repositories in Supabase pgvector.
    """
    raw_text = ""
    if file:
        file_bytes = await file.read()
        raw_text = extract_text_in_memory(file_bytes, file.filename)
        del file_bytes
        gc.collect()
    elif text:
        raw_text = text.strip()
    else:
        raise HTTPException(status_code=400, detail="Please provide either a PDF/text file or text content.")

    if not raw_text or len(raw_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Document content too short to analyze.")

    # 1. Cognitive Distillation & Implementation Scrubbing
    concept = distiller_agent.distill(raw_text)

    # 2. Local FastEmbed 384-dim CPU Embedding
    semantic_content = f"{concept.title}. {concept.problem_statement} {concept.conceptual_vision} {concept.intended_impact}"
    embedding = embedder_service.embed_text(semantic_content)

    # 3. Check pgvector deduplication gate (Threshold = 0.85)
    # Perform read-only RPC query to check similarity against existing ideas
    conn = db_service._get_connection()
    try:
        with conn.cursor() as cur:
            vector_str = f"[{','.join(map(str, embedding))}]"
            cur.execute(
                """
                SELECT id, title, domain, problem_statement, conceptual_vision, intended_impact, similarity, created_at
                FROM match_similar_ideas(%s::vector, %s, 1);
                """,
                (vector_str, settings.SIMILARITY_THRESHOLD)
            )
            match_row = cur.fetchone()
            
            if match_row:
                sim = round(float(match_row[6]), 4)
                match_pct = round(sim * 100, 1)
                return {
                    "is_duplicate": True,
                    "similarity": sim,
                    "status": "DUPLICATE_GATED",
                    "message": f"Duplicate Concept Detected: '{match_row[1]}' ({match_pct}% Match in Repository) — Storage Gated.",
                    "existing_match": {
                        "id": match_row[0],
                        "title": match_row[1],
                        "domain": match_row[2],
                        "problem_statement": match_row[3],
                        "conceptual_vision": match_row[4],
                        "intended_impact": match_row[5],
                        "similarity": sim
                    },
                    "distilled": concept.model_dump()
                }
            
            # Check closest neighbor for comparison
            cur.execute(
                """
                SELECT id, title, domain, problem_statement, conceptual_vision, intended_impact, similarity, created_at
                FROM match_similar_ideas(%s::vector, 0.0, 1);
                """,
                (vector_str,)
            )
            closest_row = cur.fetchone()
            closest_sim = round(float(closest_row[6]), 4) if closest_row else 0.0
            
            return {
                "is_duplicate": False,
                "similarity": closest_sim,
                "status": "UNIQUE_VERIFIED",
                "message": "New Unique Concept Verified (No duplicate detected in repository). Ready to publish.",
                "existing_match": None,
                "distilled": concept.model_dump()
            }
    finally:
        conn.close()


@router.post("", response_model=schemas.ProjectDto)
def create_project(
    req: schemas.ProjectCreateRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Publishes idea to Personal & Institutional Repository after vector deduplication check.
    """
    # 1. Semantic Embedding & Deduplication Check
    idea_text = f"{req.title}. {req.description}"
    concept = distiller_agent.distill(idea_text)
    semantic_content = f"{concept.title}. {concept.problem_statement} {concept.conceptual_vision} {concept.intended_impact}"
    embedding = embedder_service.embed_text(semantic_content)

    # 2. Gate check against vector store
    stored, sim, existing_match = db_service.check_and_save_idea(
        idea=concept,
        embedding=embedding,
        threshold=settings.SIMILARITY_THRESHOLD
    )

    if not stored and existing_match:
        pct = round(sim * 100, 1)
        raise HTTPException(
            status_code=409,
            detail=f"Cannot publish duplicate idea. Matches '{existing_match.title}' ({pct}% similarity) in repository."
        )

    # 3. Commit to Projects table (Personal + Reference Repo)
    project = models.Project(
        tenant_id=get_user_tenant_id(current_user),
        title=req.title,
        description=req.description,
        domain=req.domain or concept.domain,
        tech_stack=req.techStack or "Abstract Conceptual Architecture",
        posted_by_id=current_user.id,
        status="APPROVED",
        upvote_count=0,
        similarity_score=sim
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    return schemas.ProjectDto(
        id=project.id,
        title=project.title,
        description=project.description,
        domain=project.domain,
        techStack=project.tech_stack,
        postedById=project.posted_by_id,
        postedByName=current_user.name,
        status=project.status,
        upvoteCount=0,
        ideaSimilarityScore=sim,
        createdAt=project.created_at
    )


@router.get("/{id}", response_model=schemas.ProjectDto)
def get_project_by_id(id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return schemas.ProjectDto(
        id=project.id,
        title=project.title,
        description=project.description,
        domain=project.domain,
        techStack=project.tech_stack,
        postedById=project.posted_by_id,
        postedByName=project.posted_by.name if project.posted_by else "Anonymous",
        status=project.status,
        upvoteCount=project.upvote_count or 0,
        ideaSimilarityScore=project.similarity_score,
        createdAt=project.created_at
    )


@router.patch("/{id}")
def update_project_status(
    id: int,
    req: dict,
    current_user: models.User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    project = db.query(models.Project).filter(models.Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    new_status = req.get("status")
    if new_status:
        project.status = new_status.upper()
        db.commit()
    return {"message": "Project status updated", "status": project.status}


@router.post("/{id}/upvote")
def upvote_project(
    id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(models.Project).filter(models.Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.upvote_count = (project.upvote_count or 0) + 1
    db.commit()
    return {"id": project.id, "upvoteCount": project.upvote_count}


@router.post("/process-pdf")
async def process_pdf_document(file: UploadFile = File(...)):
    """In-memory zero-storage distillation of proposal PDF."""
    try:
        content = await file.read()
        raw_text = extract_text_in_memory(content, file.filename)
        del content
        gc.collect()

        concept = distiller_agent.distill(raw_text)
        overview_doc = (
            f"## {concept.title}\n\n"
            f"**Domain:** {concept.domain}\n\n"
            f"### 1. Problem Statement\n{concept.problem_statement}\n\n"
            f"### 2. Conceptual Vision (Idea DNA)\n{concept.conceptual_vision}\n\n"
            f"### 3. Intended Impact\n{concept.intended_impact}"
        )
        return {
            "title": concept.title,
            "domain": concept.domain,
            "projectOverviewDoc": overview_doc,
            "generatedReadmeMd": overview_doc,
            "distilled": concept.model_dump()
        }
    except Exception as e:
        return {"error": str(e)}
