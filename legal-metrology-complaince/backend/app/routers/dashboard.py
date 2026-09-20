from collections import Counter, defaultdict
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import ComplianceRule, Scan, User, Violation
from ..deps import get_current_user, get_db

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scans = db.query(Scan).all()
    completed = [s for s in scans if s.status == "completed"]
    scores = [s.compliance_score for s in completed if s.compliance_score is not None]
    by_status = Counter(s.overall_compliance or "unknown" for s in completed)
    viols = db.query(Violation).all()
    return {
        "total_scans": len(scans),
        "completed": len(completed),
        "processing": sum(1 for s in scans if s.status == "processing"),
        "avg_score": round(sum(scores) / len(scores), 1) if scores else 0,
        "compliant": by_status.get("compliant", 0),
        "partial": by_status.get("partial", 0),
        "non_compliant": by_status.get("non_compliant", 0),
        "compliance_rate": round(100 * by_status.get("compliant", 0) / len(completed), 1) if completed else 0,
        "violation_count": len(viols),
    }


@router.get("/trends")
def trends(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scans = db.query(Scan).filter(Scan.status == "completed").all()
    buckets: dict[str, dict] = defaultdict(lambda: {"scans": 0, "violations": 0, "score_sum": 0.0})
    for s in scans:
        day = (s.created_at or datetime.utcnow()).date().isoformat()
        buckets[day]["scans"] += 1
        buckets[day]["violations"] += len(s.violations)
        buckets[day]["score_sum"] += s.compliance_score or 0
    series = []
    for day in sorted(buckets):
        b = buckets[day]
        series.append(
            {
                "date": day,
                "scans": b["scans"],
                "violations": b["violations"],
                "avg_score": round(b["score_sum"] / b["scans"], 1) if b["scans"] else 0,
            }
        )
    return series


@router.get("/top-violations")
def top_violations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    viols = db.query(Violation).all()
    counts = Counter(v.rule_code for v in viols)
    titles = {r.code: r.title for r in db.query(ComplianceRule).all()}
    return [{"rule_code": k, "title": titles.get(k, k), "count": n} for k, n in counts.most_common(12)]
