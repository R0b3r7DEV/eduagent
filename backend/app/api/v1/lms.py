"""LMS connector endpoint — connect, sync and status."""

from fastapi import APIRouter

router = APIRouter()


@router.post("/connect")
async def connect_lms():
    # TODO: create lms_connection record and test connectivity
    return {"detail": "not implemented"}


@router.post("/sync")
async def sync_lms():
    # TODO: pull courses and tasks from the connected LMS
    return {"detail": "not implemented"}


@router.get("/status")
async def lms_status():
    # TODO: return active connections and last sync time
    return []


@router.delete("/{connection_id}")
async def disconnect_lms(connection_id: str):
    # TODO: deactivate lms_connection
    return {"deleted": connection_id}
