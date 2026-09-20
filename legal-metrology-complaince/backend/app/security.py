import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

import jwt

from .config import JWT_ACCESS_EXPIRY_MINUTES, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000).hex()
    return f"pbkdf2${salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, salt, digest = stored.split("$", 2)
    except ValueError:
        return False
    check = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000).hex()
    return hmac.compare_digest(check, digest)


def create_token(sub: str, role: str, secret: str, minutes: int) -> str:
    payload = {
        "sub": sub,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=minutes),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def create_access_token(user_id: str, role: str) -> str:
    return create_token(user_id, role, JWT_ACCESS_SECRET, JWT_ACCESS_EXPIRY_MINUTES)


def create_refresh_token(user_id: str, role: str) -> str:
    return create_token(user_id, role, JWT_REFRESH_SECRET, 60 * 24 * 7)


def decode_token(token: str, secret: str) -> dict:
    return jwt.decode(token, secret, algorithms=["HS256"])
