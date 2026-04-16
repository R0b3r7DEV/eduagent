"""Reranker (optional — used when > top_k*2 candidates)."""


def rerank(query: str, chunks: list[dict], top_k: int) -> list[dict]:
    """Basic passthrough — replace with Cohere rerank if needed."""
    return chunks[:top_k]
