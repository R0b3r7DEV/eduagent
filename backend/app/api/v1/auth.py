"""Auth endpoints.

Supabase Auth handles login, registration, OAuth (Google, etc.) and token refresh
entirely on the client side via @supabase/supabase-js.

This router exposes:
- GET /me   — return the current user's profile (JWT-verified by get_current_user)
- POST /me  — update mutable profile fields (age, name)

All other auth operations (sign-in, sign-out, OAuth, password reset) are performed
directly by the frontend against the Supabase Auth API.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)) -> User:
    """Return the authenticated user's profile."""
    return current_user


@router.patch("/me", response_model=UserRead)
async def update_me(
    body: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Update mutable profile fields."""
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)

    # Auto-derive student_level from age if age changes
    if "age" in update_data and current_user.age is not None:
        if current_user.age <= 12:
            current_user.student_level = "child"
        elif current_user.age <= 17:
            current_user.student_level = "teen"
        else:
            current_user.student_level = "adult"

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user
