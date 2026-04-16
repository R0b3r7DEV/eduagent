"""Tasks endpoint — list, create and update academic tasks."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_tasks():
    # TODO: return user tasks sorted by due_date / priority
    return []


@router.get("/pending")
async def get_pending_tasks():
    # TODO: return tasks with status='pending' ordered by due_date
    return []


@router.patch("/{task_id}")
async def update_task(task_id: str):
    # TODO: update task status or priority
    return {"task_id": task_id}


@router.delete("/{task_id}")
async def delete_task(task_id: str):
    # TODO: soft-delete task
    return {"deleted": task_id}
