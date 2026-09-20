from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import CORS_ORIGINS, UPLOAD_DIR
from .routers import auth, dashboard, products, reports, rules, scans, users
from .seed import seed

app = FastAPI(title="Maanak API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS + ["http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(scans.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(rules.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.on_event("startup")
def on_startup():
    seed()


@app.get("/api/v1/health")
def health():
    return {"ok": True, "service": "lmcs"}


@app.get("/api/v1/samples")
def samples():
    from .config import SAMPLES_DIR

    files = []
    for p in sorted(SAMPLES_DIR.glob("*.png")):
        files.append(
            {
                "file": p.name,
                "url": f"/uploads/{p.name}",
                "title": p.stem.replace("sample-", "").replace("-", " ").title(),
            }
        )
    return files
