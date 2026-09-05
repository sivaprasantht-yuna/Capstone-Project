import json
from typing import List, Optional, Tuple, Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
from app.config import settings
from app.schemas import ConceptualProjectIdea, IdeaMatch

class DatabaseService:
    def __init__(self):
        self.db_url = settings.clean_db_url

    def _get_connection(self):
        return psycopg2.connect(self.db_url)

    def check_and_save_idea(
        self,
        idea: ConceptualProjectIdea,
        embedding: List[float],
        threshold: float = settings.SIMILARITY_THRESHOLD
    ) -> Tuple[bool, float, Optional[IdeaMatch]]:
        """
        Queries pgvector via match_similar_ideas RPC.
        - If top match similarity >= threshold: DOES NOT INSERT, returns (False, similarity, match).
        - If top match similarity < threshold: INSERTS into project_ideas, returns (True, max_similarity, None).
        """
        conn = self._get_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # 1. Format vector as string '[0.1, 0.2, ...]'
                vector_str = f"[{','.join(map(str, embedding))}]"
                
                # 2. Call RPC match_similar_ideas
                cur.execute(
                    """
                    SELECT id, title, domain, problem_statement, conceptual_vision, intended_impact, similarity, created_at
                    FROM match_similar_ideas(%s::vector, %s, 1);
                    """,
                    (vector_str, threshold)
                )
                existing = cur.fetchone()
                
                if existing:
                    # Top similarity meets or exceeds threshold => GATED DEDUPLICATION
                    match = IdeaMatch(
                        id=existing["id"],
                        title=existing["title"],
                        domain=existing["domain"],
                        problem_statement=existing["problem_statement"],
                        conceptual_vision=existing["conceptual_vision"],
                        intended_impact=existing["intended_impact"],
                        similarity=round(float(existing["similarity"]), 4),
                        created_at=str(existing["created_at"]) if existing["created_at"] else None
                    )
                    return False, match.similarity, match
                
                # Check closest neighbor similarity for informational logging
                cur.execute(
                    """
                    SELECT id, title, domain, problem_statement, conceptual_vision, intended_impact, similarity, created_at
                    FROM match_similar_ideas(%s::vector, 0.0, 1);
                    """,
                    (vector_str,)
                )
                closest = cur.fetchone()
                closest_similarity = round(float(closest["similarity"]), 4) if closest else 0.0

                # 3. Commit new unique idea
                cur.execute(
                    """
                    INSERT INTO project_ideas (
                        title, domain, problem_statement, conceptual_vision, intended_impact, embedding
                    ) VALUES (%s, %s, %s, %s, %s, %s::vector)
                    RETURNING id;
                    """,
                    (
                        idea.title,
                        idea.domain,
                        idea.problem_statement,
                        idea.conceptual_vision,
                        idea.intended_impact,
                        vector_str
                    )
                )
                conn.commit()
                return True, closest_similarity, None
        finally:
            conn.close()

    def get_all_ideas(self, limit: int = 50) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT id, title, domain, problem_statement, conceptual_vision, intended_impact, created_at
                    FROM project_ideas
                    ORDER BY created_at DESC
                    LIMIT %s;
                    """,
                    (limit,)
                )
                rows = cur.fetchall()
                return [dict(r) for r in rows]
        finally:
            conn.close()

db_service = DatabaseService()
