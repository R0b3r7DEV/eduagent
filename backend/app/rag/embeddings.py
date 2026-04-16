"""Cohere embeddings."""
import cohere
import structlog
from app.config import settings

logger = structlog.get_logger()


async def embed_texts(texts: list[str], input_type: str = "search_document") -> list[list[float]]:
    if not settings.cohere_api_key:
        raise RuntimeError("COHERE_API_KEY not configured")
    co = cohere.Client(settings.cohere_api_key)
    result = []
    for i in range(0, len(texts), 96):
        batch = texts[i:i + 96]
        resp = co.embed(texts=batch, model="embed-multilingual-v3.0", input_type=input_type)
        result.extend(resp.embeddings)
    logger.info("embeddings.generated", count=len(result))
    return result
