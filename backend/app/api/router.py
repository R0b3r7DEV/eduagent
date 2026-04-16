"""Top-level API router — mounts all v1 sub-routers."""

from fastapi import APIRouter

from app.api.v1 import auth, chat, documents, lms, tasks, user

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(lms.router, prefix="/lms", tags=["lms"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(user.router, prefix="/user", tags=["user"])
