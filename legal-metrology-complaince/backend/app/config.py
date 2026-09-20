from pathlib import Path

from dotenv import load_dotenv
import os

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / ".env")

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = BASE_DIR / "uploads"
SAMPLES_DIR = DATA_DIR / "samples"
FIXTURES_DIR = DATA_DIR / "fixtures"

DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
FIXTURES_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/lmcs.db")
if DATABASE_URL.startswith("sqlite:///./"):
    DATABASE_URL = f"sqlite:///{(BASE_DIR / DATABASE_URL.replace('sqlite:///./', '')).as_posix()}"

JWT_ACCESS_SECRET = os.getenv("JWT_ACCESS_SECRET", "change_me")
JWT_REFRESH_SECRET = os.getenv("JWT_REFRESH_SECRET", "change_me")
JWT_ACCESS_EXPIRY_MINUTES = int(os.getenv("JWT_ACCESS_EXPIRY_MINUTES", "480"))
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
PORT = int(os.getenv("PORT", "4000"))
