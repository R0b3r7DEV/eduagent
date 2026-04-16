"""Typed exception hierarchy for EduAgent AI."""


class EduAgentError(Exception):
    """Base exception for all EduAgent errors."""


class LMSConnectionError(EduAgentError):
    """Raised when an LMS connector fails to connect or authenticate."""


class DocumentIngestionError(EduAgentError):
    """Raised when document parsing or chunking fails."""


class RAGRetrievalError(EduAgentError):
    """Raised when vector search or re-ranking fails."""


class AuthenticationError(EduAgentError):
    """Raised for JWT validation failures or expired tokens."""
