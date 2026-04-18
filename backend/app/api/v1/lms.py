"""LMS connector endpoints — connect, sync, status, disconnect."""

import uuid
from datetime import datetime, timezone

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.connectors.google_classroom import GoogleClassroomConnector, build_auth_url, exchange_code
from app.connectors.moodle import MoodleConnector
from app.dependencies import get_current_user, get_db
from app.models.lms_connection import LMSConnection
from app.models.task import Task

logger = structlog.get_logger()
router = APIRouter()


# ── Schemas ────────────────────────────────────────────────────────────────────

class MoodleConnectRequest(BaseModel):
    base_url: str
    token: str


class LMSConnectionResponse(BaseModel):
    id: str
    provider: str
    config: dict | None
    last_synced_at: str | None
    is_active: bool


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/status")
async def lms_status(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[LMSConnectionResponse]:
    r = await db.execute(
        select(LMSConnection).where(
            LMSConnection.user_id == current_user.id,
            LMSConnection.is_active == True,
        )
    )
    conns = r.scalars().all()
    return [
        LMSConnectionResponse(
            id=str(c.id),
            provider=c.provider,
            config={k: v for k, v in (c.config or {}).items() if k != "token"},
            last_synced_at=c.last_synced_at.isoformat() if c.last_synced_at else None,
            is_active=c.is_active,
        )
        for c in conns
    ]


@router.post("/connect/moodle", status_code=status.HTTP_201_CREATED)
async def connect_moodle(
    body: MoodleConnectRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    connector = MoodleConnector(body.base_url, body.token)
    try:
        site_info = await connector.test_connection()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"No se pudo conectar con Moodle: {exc}",
        )

    # Deactivate any existing Moodle connection for this user
    r = await db.execute(
        select(LMSConnection).where(
            LMSConnection.user_id == current_user.id,
            LMSConnection.provider == "moodle",
        )
    )
    for existing in r.scalars().all():
        existing.is_active = False
        db.add(existing)

    conn = LMSConnection(
        user_id=current_user.id,
        provider="moodle",
        config={"base_url": body.base_url, "token": body.token},
        is_active=True,
    )
    db.add(conn)
    await db.commit()
    await db.refresh(conn)

    logger.info("lms.moodle.connected", user_id=str(current_user.id), site=site_info.get("sitename"))
    return {"id": str(conn.id), "site_name": site_info.get("sitename"), "provider": "moodle"}


@router.post("/sync/{connection_id}")
async def sync_lms(
    connection_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    r = await db.execute(
        select(LMSConnection).where(
            LMSConnection.id == connection_id,
            LMSConnection.user_id == current_user.id,
        )
    )
    conn = r.scalar_one_or_none()
    if not conn:
        raise HTTPException(status_code=404, detail="Conexión no encontrada")

    if conn.provider == "moodle":
        config = conn.config or {}
        connector = MoodleConnector(config["base_url"], config["token"])
        try:
            site_info = await connector.test_connection()
            user_moodle_id = site_info.get("userid")
            courses = await connector.get_courses(user_moodle_id)
            course_ids = [c["id"] for c in courses]
            assignments = await connector.get_assignments(course_ids)
        except Exception as exc:
            raise HTTPException(status_code=422, detail=f"Error al sincronizar: {exc}")

        synced_at = datetime.now(timezone.utc)
        count = 0
        for a in assignments:
            r2 = await db.execute(
                select(Task).where(
                    Task.lms_connection_id == conn.id,
                    Task.external_id == a["id"],
                )
            )
            existing = r2.scalar_one_or_none()
            due = datetime.fromtimestamp(a["due_date"], tz=timezone.utc) if a.get("due_date") else None
            if existing:
                existing.title = a["title"]
                existing.due_date = due
                existing.synced_at = synced_at
                db.add(existing)
            else:
                db.add(Task(
                    user_id=current_user.id,
                    lms_connection_id=conn.id,
                    external_id=a["id"],
                    title=a["title"],
                    description=a.get("description", ""),
                    course_name=a.get("course_name", ""),
                    due_date=due,
                    lms_url=a.get("url"),
                    synced_at=synced_at,
                ))
                count += 1

        conn.last_synced_at = synced_at
        db.add(conn)
        await db.commit()
        logger.info("lms.sync.complete", user_id=str(current_user.id), new_tasks=count)
        return {"synced": True, "new_tasks": count, "total": len(assignments)}

    if conn.provider == "google_classroom":
        from app.config import settings
        config = conn.config or {}
        connector = GoogleClassroomConnector(
            access_token=config.get("access_token", ""),
            refresh_token=config.get("refresh_token", ""),
            client_id=settings.google_client_id,
            client_secret=settings.google_client_secret,
        )
        try:
            assignments = await connector.get_all_assignments()
        except Exception as exc:
            raise HTTPException(status_code=422, detail=f"Error al sincronizar: {exc}")

        synced_at = datetime.now(timezone.utc)
        count = 0
        for a in assignments:
            r2 = await db.execute(
                select(Task).where(
                    Task.lms_connection_id == conn.id,
                    Task.external_id == str(a["id"]),
                )
            )
            existing = r2.scalar_one_or_none()
            due = datetime.fromisoformat(a["due_date"].replace("Z", "+00:00")) if a.get("due_date") else None
            if existing:
                existing.title = a["title"]
                existing.due_date = due
                existing.synced_at = synced_at
                db.add(existing)
            else:
                db.add(Task(
                    user_id=current_user.id,
                    lms_connection_id=conn.id,
                    external_id=str(a["id"]),
                    title=a["title"],
                    description=a.get("description", ""),
                    course_name=a.get("course_name", ""),
                    due_date=due,
                    lms_url=a.get("url"),
                    synced_at=synced_at,
                ))
                count += 1

        conn.last_synced_at = synced_at
        db.add(conn)
        await db.commit()
        return {"synced": True, "new_tasks": count, "total": len(assignments)}

    raise HTTPException(status_code=422, detail="Proveedor no soportado")


@router.get("/connect/google/url")
async def google_auth_url(
    redirect_uri: str,
    current_user=Depends(get_current_user),
):
    from app.config import settings
    if not settings.google_client_id:
        raise HTTPException(status_code=501, detail="Google OAuth no configurado")
    url = build_auth_url(
        client_id=settings.google_client_id,
        redirect_uri=redirect_uri,
        state=str(current_user.id),
    )
    return {"url": url}


class GoogleCallbackRequest(BaseModel):
    code: str
    redirect_uri: str


@router.post("/connect/google", status_code=status.HTTP_201_CREATED)
async def connect_google(
    body: GoogleCallbackRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.config import settings
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(status_code=501, detail="Google OAuth no configurado")
    try:
        tokens = await exchange_code(
            code=body.code,
            client_id=settings.google_client_id,
            client_secret=settings.google_client_secret,
            redirect_uri=body.redirect_uri,
        )
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Error al autenticar con Google: {exc}")

    r = await db.execute(
        select(LMSConnection).where(
            LMSConnection.user_id == current_user.id,
            LMSConnection.provider == "google_classroom",
        )
    )
    for existing in r.scalars().all():
        existing.is_active = False
        db.add(existing)

    conn = LMSConnection(
        user_id=current_user.id,
        provider="google_classroom",
        config={
            "access_token": tokens["access_token"],
            "refresh_token": tokens.get("refresh_token", ""),
        },
        is_active=True,
    )
    db.add(conn)
    await db.commit()
    await db.refresh(conn)
    logger.info("lms.google.connected", user_id=str(current_user.id))
    return {"id": str(conn.id), "provider": "google_classroom"}


@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def disconnect_lms(
    connection_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    r = await db.execute(
        select(LMSConnection).where(
            LMSConnection.id == connection_id,
            LMSConnection.user_id == current_user.id,
        )
    )
    conn = r.scalar_one_or_none()
    if not conn:
        raise HTTPException(status_code=404, detail="Conexión no encontrada")
    conn.is_active = False
    db.add(conn)
    await db.commit()
