from __future__ import annotations

import json
import shutil
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..config import UPLOAD_DIR
from ..database import ComplianceRule, Scan, User
from ..deps import get_current_user, get_db
from ..pipeline import analyze_image
from ..seed import persist_analysis, serialize_rule, serialize_scan, uid

router = APIRouter(prefix="/scans", tags=["scans"])


def local_path(image_url: str) -> Path:
    name = Path(image_url).name
    return UPLOAD_DIR / name


def run_pipeline(scan_id: str, imported: bool, food: bool, width_mm: float | None) -> None:
    from ..database import SessionLocal

    db = SessionLocal()
    try:
        scan = db.get(Scan, scan_id)
        if not scan:
            return
        rules = [serialize_rule(r) for r in db.query(ComplianceRule).all()]
        analysis = analyze_image(
            local_path(scan.image_url),
            package_width_mm=width_mm,
            is_imported=imported,
            is_food=food,
            rules=rules,
        )
        persist_analysis(db, scan, analysis)
        db.commit()
    except Exception as exc:  # noqa: BLE001
        scan = db.get(Scan, scan_id)
        if scan:
            scan.status = "failed"
            scan.raw_ocr_text = str(exc)
            db.commit()
    finally:
        db.close()


@router.post("")
async def create_scan(
    background: BackgroundTasks,
    file: UploadFile = File(...),
    location: str | None = Form(None),
    package_width_mm: float | None = Form(None),
    is_imported: str = Form("false"),
    is_food: str = Form("true"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role == "viewer":
        raise HTTPException(403, "Viewers cannot create scans")
    suffix = Path(file.filename or "upload.jpg").suffix.lower() or ".jpg"
    if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(400, "Upload a JPEG or PNG label photo")
    scan_id = uid()
    dest = UPLOAD_DIR / f"{scan_id}{suffix}"
    with dest.open("wb") as out:
        shutil.copyfileobj(file.file, out)
    scan = Scan(
        id=scan_id,
        uploaded_by=user.id,
        image_url=f"/uploads/{dest.name}",
        thumbnail_url=f"/uploads/{dest.name}",
        status="processing",
        location=location,
        calibration_mm=package_width_mm,
        device_meta=json.dumps({"filename": file.filename, "content_type": file.content_type}),
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    imported = is_imported.lower() in {"1", "true", "yes", "on"}
    food = is_food.lower() in {"1", "true", "yes", "on"}
    background.add_task(run_pipeline, scan.id, imported, food, package_width_mm)
    return serialize_scan(scan)


@router.get("")
def list_scans(
    status: str | None = None,
    compliance: str | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Scan).order_by(Scan.created_at.desc())
    if status:
        q = q.filter(Scan.status == status)
    if compliance:
        q = q.filter(Scan.overall_compliance == compliance)
    return [serialize_scan(s, include_children=False) for s in q.limit(200).all()]


@router.get("/{scan_id}")
def get_scan(scan_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scan = db.get(Scan, scan_id)
    if not scan:
        raise HTTPException(404, "Scan not found")
    return serialize_scan(scan)


@router.get("/{scan_id}/status")
def scan_status(scan_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scan = db.get(Scan, scan_id)
    if not scan:
        raise HTTPException(404, "Scan not found")
    return {"id": scan.id, "status": scan.status, "overall_compliance": scan.overall_compliance, "compliance_score": scan.compliance_score}


@router.post("/{scan_id}/rerun")
def rerun_scan(
    scan_id: str,
    background: BackgroundTasks,
    package_width_mm: float | None = Form(None),
    is_imported: str = Form("false"),
    is_food: str = Form("true"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role == "viewer":
        raise HTTPException(403, "Viewers cannot rerun scans")
    scan = db.get(Scan, scan_id)
    if not scan:
        raise HTTPException(404, "Scan not found")
    scan.declarations.clear()
    scan.violations.clear()
    scan.status = "processing"
    scan.overall_compliance = None
    scan.compliance_score = None
    scan.completed_at = None
    if package_width_mm is not None:
        scan.calibration_mm = package_width_mm
    db.commit()
    imported = is_imported.lower() in {"1", "true", "yes", "on"}
    food = is_food.lower() in {"1", "true", "yes", "on"}
    background.add_task(run_pipeline, scan.id, imported, food, package_width_mm or scan.calibration_mm)
    return serialize_scan(scan, include_children=False)


@router.delete("/{scan_id}")
def delete_scan(scan_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in {"admin", "officer"}:
        raise HTTPException(403, "Not allowed")
    scan = db.get(Scan, scan_id)
    if not scan:
        raise HTTPException(404, "Scan not found")
    db.delete(scan)
    db.commit()
    return {"ok": True}
