from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..config import DATA_DIR
from ..database import Report, Scan, User
from ..deps import get_current_user, get_db
from ..pdf_report import generate_pdf
from ..seed import serialize_scan, uid
from .scans import local_path

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("")
def list_reports(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(Report).order_by(Report.created_at.desc()).limit(100).all()
    out = []
    for r in rows:
        scan = db.get(Scan, r.scan_id)
        out.append(
            {
                "id": r.id,
                "scan_id": r.scan_id,
                "file_url": r.file_url,
                "format": r.format,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "product": scan.product.name if scan and scan.product else None,
                "score": scan.compliance_score if scan else None,
                "status": scan.overall_compliance if scan else None,
            }
        )
    return out


@router.post("/{scan_id}/generate")
def generate(scan_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scan = db.get(Scan, scan_id)
    if not scan:
        raise HTTPException(404, "Scan not found")
    reports_dir = DATA_DIR / "reports"
    report_id = uid()
    dest = reports_dir / f"{report_id}.pdf"
    generate_pdf(serialize_scan(scan), local_path(scan.image_url), dest)
    rec = Report(id=report_id, scan_id=scan.id, generated_by=user.id, file_url=f"/api/v1/reports/{report_id}/download", format="pdf")
    db.add(rec)
    db.commit()
    return {"id": rec.id, "file_url": rec.file_url, "format": rec.format}


@router.get("/{report_id}/download")
def download(report_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rec = db.get(Report, report_id)
    if not rec:
        raise HTTPException(404, "Report not found")
    path = DATA_DIR / "reports" / f"{report_id}.pdf"
    if not path.exists():
        raise HTTPException(404, "File missing")
    return FileResponse(path, filename=f"lmcs-{report_id[:8]}.pdf", media_type="application/pdf")
