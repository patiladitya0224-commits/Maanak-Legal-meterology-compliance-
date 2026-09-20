from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import User
from ..deps import require_roles, get_db
from ..seed import serialize_user

router = APIRouter(prefix="/users", tags=["users"])


class RoleIn(BaseModel):
    role: str
    is_active: bool | None = None


@router.get("")
def list_users(user: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    return [serialize_user(u) for u in db.query(User).order_by(User.created_at.desc()).all()]


@router.patch("/{user_id}")
def patch_user(user_id: str, body: RoleIn, admin: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(404, "User not found")
    if body.role not in {"admin", "officer", "viewer", "citizen"}:
        raise HTTPException(400, "Invalid role")
    target.role = body.role
    if body.is_active is not None:
        target.is_active = body.is_active
    db.commit()
    return serialize_user(target)
