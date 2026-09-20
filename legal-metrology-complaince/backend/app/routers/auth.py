from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from ..database import User
from ..deps import get_current_user, get_db
from ..security import create_access_token, create_refresh_token, hash_password, verify_password
from ..seed import serialize_user, uid

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "officer"
    department: str | None = None
    jurisdiction: str | None = None


@router.post("/register")
def register(body: RegisterIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email.lower()).first():
        raise HTTPException(400, "Email already registered")
    role = body.role if body.role in {"officer", "viewer", "citizen"} else "officer"
    user = User(
        id=uid(),
        name=body.name,
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        role=role,
        department=body.department,
        jurisdiction=body.jurisdiction,
    )
    db.add(user)
    db.commit()
    return {
        "access_token": create_access_token(user.id, user.role),
        "refresh_token": create_refresh_token(user.id, user.role),
        "user": serialize_user(user),
    }


@router.post("/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")
    if not user.is_active:
        raise HTTPException(403, "Account disabled")
    return {
        "access_token": create_access_token(user.id, user.role),
        "refresh_token": create_refresh_token(user.id, user.role),
        "user": serialize_user(user),
    }


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return serialize_user(user)
