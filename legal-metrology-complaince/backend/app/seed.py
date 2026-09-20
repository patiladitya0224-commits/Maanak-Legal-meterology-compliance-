from __future__ import annotations

import json
from datetime import timedelta

from .database import (
    AuditLog,
    Base,
    ComplianceRule,
    Declaration,
    Product,
    Report,
    Scan,
    SessionLocal,
    User,
    Violation,
    engine,
    utcnow,
)
from .label_factory import generate_samples
from .pipeline import analyze_image
from .security import hash_password
from .config import DATA_DIR, SAMPLES_DIR, UPLOAD_DIR
import shutil
import uuid
from pathlib import Path


STARTER_RULES = [
    {
        "code": "LM_R6_GENERIC",
        "title": "Commodity must declare a generic name",
        "legal_reference": "Rule 6(1)(a)",
        "field_key": "generic_name",
        "check_type": "presence",
        "parameters": {},
        "severity": "major",
    },
    {
        "code": "LM_R6_NETQTY",
        "title": "Net quantity in standard units",
        "legal_reference": "Rule 6(1)(b)",
        "field_key": "net_quantity",
        "check_type": "presence",
        "parameters": {},
        "severity": "critical",
    },
    {
        "code": "LM_R6_NETQTY_FMT",
        "title": "Net quantity format / SI units",
        "legal_reference": "Rule 6(1)(b)",
        "field_key": "net_quantity",
        "check_type": "format",
        "parameters": {},
        "severity": "major",
    },
    {
        "code": "LM_R6_MRP",
        "title": "MRP must be declared",
        "legal_reference": "Rule 6(1)(e)",
        "field_key": "mrp",
        "check_type": "presence",
        "parameters": {},
        "severity": "critical",
    },
    {
        "code": "LM_R6_MRP_FMT",
        "title": "MRP inclusive of all taxes",
        "legal_reference": "Rule 6(1)(e)",
        "field_key": "mrp",
        "check_type": "format",
        "parameters": {},
        "severity": "major",
    },
    {
        "code": "LM_R6_DATE",
        "title": "Month and year of manufacture / packing",
        "legal_reference": "Rule 6(1)(d)",
        "field_key": "mfg_or_pkg_date",
        "check_type": "presence",
        "parameters": {},
        "severity": "major",
    },
    {
        "code": "LM_R6_MFG",
        "title": "Manufacturer / packer / importer particulars",
        "legal_reference": "Rule 6(1)(a)",
        "field_key": "manufacturer_details",
        "check_type": "presence",
        "parameters": {},
        "severity": "major",
    },
    {
        "code": "LM_R6_CARE",
        "title": "Consumer care contact",
        "legal_reference": "Rule 6(1)(f)",
        "field_key": "consumer_care",
        "check_type": "presence",
        "parameters": {},
        "severity": "major",
    },
    {
        "code": "LM_R6_COO",
        "title": "Country of origin for imported goods",
        "legal_reference": "Rule 6(1)(c)",
        "field_key": "country_of_origin",
        "check_type": "presence",
        "parameters": {},
        "severity": "critical",
    },
    {
        "code": "LM_R7_FONT_MRP",
        "title": "Numeral height for MRP (estimated)",
        "legal_reference": "Rule 7",
        "field_key": "mrp",
        "check_type": "font_size",
        "parameters": {"min_height_mm": 4, "min_height_mm_molded": 6},
        "severity": "major",
    },
    {
        "code": "LM_R7_FONT_QTY",
        "title": "Numeral height for net quantity (estimated)",
        "legal_reference": "Rule 7",
        "field_key": "net_quantity",
        "check_type": "font_size",
        "parameters": {"min_height_mm": 4},
        "severity": "major",
    },
    {
        "code": "LM_R8_READ",
        "title": "Readability / OCR confidence review",
        "legal_reference": "Rules 8–9",
        "field_key": "mrp",
        "check_type": "readability",
        "parameters": {"min_confidence": 0.45},
        "severity": "minor",
    },
]


def uid() -> str:
    return str(uuid.uuid4())


def serialize_user(u: User) -> dict:
    return {
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "role": u.role,
        "department": u.department,
        "jurisdiction": u.jurisdiction,
        "is_active": u.is_active,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }


def serialize_rule(r: ComplianceRule) -> dict:
    try:
        params = json.loads(r.parameters or "{}")
    except json.JSONDecodeError:
        params = {}
    return {
        "code": r.code,
        "title": r.title,
        "legal_reference": r.legal_reference,
        "field_key": r.field_key,
        "check_type": r.check_type,
        "parameters": params,
        "severity": r.severity,
        "is_active": r.is_active,
    }


def serialize_scan(s: Scan, include_children: bool = True) -> dict:
    product = None
    if s.product:
        product = {
            "id": s.product.id,
            "name": s.product.name,
            "brand": s.product.brand,
            "category": s.product.category,
            "barcode": s.product.barcode,
        }
    data = {
        "id": s.id,
        "product_id": s.product_id,
        "product": product,
        "uploaded_by": s.uploaded_by,
        "image_url": s.image_url,
        "thumbnail_url": s.thumbnail_url,
        "status": s.status,
        "overall_compliance": s.overall_compliance,
        "compliance_score": s.compliance_score,
        "raw_ocr_text": s.raw_ocr_text,
        "location": s.location,
        "calibration_mm": s.calibration_mm,
        "calibration_method": s.calibration_method,
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "completed_at": s.completed_at.isoformat() if s.completed_at else None,
    }
    if include_children:
        data["declarations"] = [
            {
                "id": d.id,
                "field_key": d.field_key,
                "field_label": d.field_label,
                "extracted_value": d.extracted_value,
                "bounding_box": json.loads(d.bounding_box) if d.bounding_box else None,
                "font_height_mm": d.font_height_mm,
                "confidence": d.confidence,
                "is_present": d.is_present,
                "is_valid_format": d.is_valid_format,
                "rule_reference": d.rule_reference,
            }
            for d in s.declarations
        ]
        data["violations"] = [
            {
                "id": v.id,
                "rule_code": v.rule_code,
                "severity": v.severity,
                "description": v.description,
                "field_key": v.field_key,
            }
            for v in s.violations
        ]
        data["reports"] = [
            {"id": r.id, "file_url": r.file_url, "format": r.format, "created_at": r.created_at.isoformat() if r.created_at else None}
            for r in s.reports
        ]
    return data


def persist_analysis(db, scan: Scan, analysis: dict) -> None:
    scan.raw_ocr_text = analysis.get("raw_ocr_text")
    scan.compliance_score = analysis.get("compliance_score")
    scan.overall_compliance = analysis.get("overall_compliance")
    scan.calibration_mm = analysis.get("calibration_mm")
    scan.calibration_method = analysis.get("calibration_method")
    scan.status = "completed"
    scan.completed_at = utcnow()

    prod_info = analysis.get("fixture_product")
    if prod_info and not scan.product_id:
        product = Product(
            id=uid(),
            name=prod_info.get("name"),
            brand=prod_info.get("brand"),
            category=prod_info.get("category"),
            barcode=prod_info.get("barcode"),
            created_by=scan.uploaded_by,
        )
        db.add(product)
        scan.product_id = product.id
        if not scan.location:
            scan.location = analysis.get("fixture_location")

    for d in analysis.get("declarations") or []:
        db.add(
            Declaration(
                id=uid(),
                scan_id=scan.id,
                field_key=d["field_key"],
                field_label=d["field_label"],
                extracted_value=d.get("extracted_value"),
                bounding_box=json.dumps(d.get("bounding_box")) if d.get("bounding_box") else None,
                font_height_mm=d.get("font_height_mm"),
                confidence=d.get("confidence"),
                is_present=d.get("is_present") or False,
                is_valid_format=d.get("is_valid_format"),
                rule_reference=d.get("rule_reference"),
            )
        )
    for v in analysis.get("violations") or []:
        db.add(
            Violation(
                id=uid(),
                scan_id=scan.id,
                rule_code=v["rule_code"],
                severity=v["severity"],
                description=v["description"],
                field_key=v.get("field_key"),
            )
        )


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        generate_samples()
        for src in SAMPLES_DIR.glob("*.png"):
            shutil.copyfile(src, UPLOAD_DIR / src.name)
        if db.query(User).first():
            if db.query(Report).count() == 0:
                from .pdf_report import generate_pdf

                officer = db.query(User).filter(User.role == "officer").first()
                scans = db.query(Scan).filter(Scan.status == "completed").limit(2).all()
                for scan in scans:
                    report_id = uid()
                    dest_pdf = DATA_DIR / "reports" / f"{report_id}.pdf"
                    img = UPLOAD_DIR / Path(scan.image_url).name
                    generate_pdf(serialize_scan(scan), img if img.exists() else None, dest_pdf)
                    db.add(
                        Report(
                            id=report_id,
                            scan_id=scan.id,
                            generated_by=(officer.id if officer else scan.uploaded_by),
                            file_url=f"/api/v1/reports/{report_id}/download",
                            format="pdf",
                        )
                    )
                db.commit()
            return
        admin = User(
            id=uid(),
            name="Aditya Sharma",
            email="admin@maanak.gov.in",
            password_hash=hash_password("Admin@123"),
            role="admin",
            department="Department of Consumer Affairs",
            jurisdiction="All India",
        )
        officer = User(
            id=uid(),
            name="Priya Nair",
            email="officer@maanak.gov.in",
            password_hash=hash_password("Officer@123"),
            role="officer",
            department="Legal Metrology — Field",
            jurisdiction="Maharashtra",
        )
        viewer = User(
            id=uid(),
            name="Rahul Menon",
            email="auditor@maanak.gov.in",
            password_hash=hash_password("Auditor@123"),
            role="viewer",
            department="Internal Audit",
            jurisdiction="National",
        )
        db.add_all([admin, officer, viewer])

        for spec in STARTER_RULES:
            db.add(
                ComplianceRule(
                    code=spec["code"],
                    title=spec["title"],
                    legal_reference=spec["legal_reference"],
                    field_key=spec["field_key"],
                    check_type=spec["check_type"],
                    parameters=json.dumps(spec["parameters"]),
                    severity=spec["severity"],
                    is_active=True,
                )
            )
        db.commit()

        rules = [serialize_rule(r) for r in db.query(ComplianceRule).all()]
        sample_files = sorted(SAMPLES_DIR.glob("*.png"))
        offsets = [6, 4, 2, 1]
        for i, src in enumerate(sample_files):
            dest = UPLOAD_DIR / src.name
            shutil.copyfile(src, dest)
            scan = Scan(
                id=uid(),
                uploaded_by=officer.id,
                image_url=f"/uploads/{src.name}",
                thumbnail_url=f"/uploads/{src.name}",
                status="processing",
                location=None,
                created_at=utcnow() - timedelta(days=offsets[i] if i < len(offsets) else i),
            )
            db.add(scan)
            db.flush()
            analysis = analyze_image(
                dest,
                package_width_mm=None,
                is_imported="imported" in src.name,
                is_food=True,
                rules=rules,
            )
            persist_analysis(db, scan, analysis)
            db.add(
                AuditLog(
                    user_id=officer.id,
                    action="scan.seed",
                    entity_type="scan",
                    entity_id=scan.id,
                    metadata_json=json.dumps({"file": src.name}),
                )
            )
            if i < 2:
                from .pdf_report import generate_pdf

                report_id = uid()
                dest_pdf = DATA_DIR / "reports" / f"{report_id}.pdf"
                generate_pdf(serialize_scan(scan), dest, dest_pdf)
                db.add(
                    Report(
                        id=report_id,
                        scan_id=scan.id,
                        generated_by=officer.id,
                        file_url=f"/api/v1/reports/{report_id}/download",
                        format="pdf",
                    )
                )
        db.commit()
    finally:
        db.close()
