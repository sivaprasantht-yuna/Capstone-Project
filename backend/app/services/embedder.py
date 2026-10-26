import os
import shutil
from typing import List
try:
    from fastembed import TextEmbedding
except Exception:
    TextEmbedding = None

from app.config import settings

class EmbeddingService:
    _instance = None
    
    def __init__(self):
        self.model = None

    def _ensure_model(self):
        if self.model is not None:
            return
        if TextEmbedding is None:
            print("[Embedder] FastEmbed library is not available. Falling back to zero-vectors.")
            self.model = None
            return
        print(f"[Embedder] Initializing local FastEmbed model '{settings.EMBEDDING_MODEL_NAME}' on CPU...")
        try:
            self.model = TextEmbedding(model_name=settings.EMBEDDING_MODEL_NAME)
            print(f"[Embedder] FastEmbed model loaded successfully! Output dimension: {settings.EMBEDDING_DIMENSION}")
        except Exception as e:
            print(f"[Embedder] Warning loading model: {e}. Attempting cache purge and retry...")
            cache_dir = os.path.join(os.environ.get('TEMP', ''), 'fastembed_cache')
            if os.path.exists(cache_dir):
                try:
                    shutil.rmtree(cache_dir, ignore_errors=True)
                except Exception:
                    pass
            try:
                self.model = TextEmbedding(model_name=settings.EMBEDDING_MODEL_NAME)
                print(f"[Embedder] FastEmbed model loaded successfully after cache cleanup!")
            except Exception as e2:
                print(f"[Embedder] Could not load FastEmbed model: {e2}. Falling back to zero-vectors.")
                self.model = None

    @classmethod
    def get_instance(cls) -> "EmbeddingService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def embed_text(self, text: str) -> List[float]:
        """
        Generates 384-dimensional normalized float embedding vector using CPU FastEmbed.
        """
        self._ensure_model()
        if not text or not text.strip():
            text = "empty concept"
        
        if self.model is None:
            return [0.0] * getattr(settings, "EMBEDDING_DIMENSION", 384)

        try:
            embeddings = list(self.model.embed([text]))
            return embeddings[0].tolist()
        except Exception as e:
            print(f"[Embedder] Embedding error: {e}")
            return [0.0] * getattr(settings, "EMBEDDING_DIMENSION", 384)

embedder_service = EmbeddingService.get_instance()

