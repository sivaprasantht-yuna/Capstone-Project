from typing import List
import numpy as np
from fastembed import TextEmbedding
from app.config import settings

class EmbeddingService:
    _instance = None
    
    def __init__(self):
        print(f"[Embedder] Initializing local FastEmbed model '{settings.EMBEDDING_MODEL_NAME}' on CPU...")
        self.model = TextEmbedding(model_name=settings.EMBEDDING_MODEL_NAME)
        print(f"[Embedder] FastEmbed model loaded successfully! Output dimension: {settings.EMBEDDING_DIMENSION}")

    @classmethod
    def get_instance(cls) -> "EmbeddingService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def embed_text(self, text: str) -> List[float]:
        """
        Generates 384-dimensional normalized float embedding vector using CPU FastEmbed.
        """
        if not text or not text.strip():
            text = "empty concept"
        
        # FastEmbed returns a generator of numpy arrays
        embeddings = list(self.model.embed([text]))
        vector = embeddings[0].tolist()
        return vector

embedder_service = EmbeddingService.get_instance()
