-- ====================================================================
-- Migration: 20260902_init_vector_gate.sql
-- Description: Zero-Storage Idea Distillation & pgvector Deduplication Gate
-- Vector Dimension: 384 (FastEmbed BAAI/bge-small-en-v1.5)
-- Cosine Similarity Threshold: >= 0.85
-- ====================================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create project_ideas table
CREATE TABLE IF NOT EXISTS project_ideas (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    domain TEXT NOT NULL,
    problem_statement TEXT NOT NULL,
    conceptual_vision TEXT NOT NULL,
    intended_impact TEXT NOT NULL,
    embedding vector(384) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create HNSW index for ultra-fast cosine similarity search
CREATE INDEX IF NOT EXISTS idx_project_ideas_embedding_hnsw 
ON project_ideas 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 4. Match similar ideas RPC function
CREATE OR REPLACE FUNCTION match_similar_ideas(
    query_embedding vector(384),
    match_threshold float DEFAULT 0.85,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id bigint,
    title text,
    domain text,
    problem_statement text,
    conceptual_vision text,
    intended_impact text,
    similarity float,
    created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.title,
        p.domain,
        p.problem_statement,
        p.conceptual_vision,
        p.intended_impact,
        1 - (p.embedding <=> query_embedding) AS similarity,
        p.created_at
    FROM project_ideas p
    WHERE 1 - (p.embedding <=> query_embedding) >= match_threshold
    ORDER BY p.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;
