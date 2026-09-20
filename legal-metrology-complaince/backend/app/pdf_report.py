from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

NAVY = HexColor("#0b1220")
GOLD = HexColor("#e0b15b")
TEAL = HexColor("#2dd4bf")
ROSE = HexColor("#fb7185")
PAPER = HexColor("#f6f1e6")


def generate_pdf(scan: dict, image_path: Path | None, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(dest), pagesize=A4)
    w, h = A4

    c.setFillColor(NAVY)
    c.rect(0, 0, w, h, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, h - 18, w, 18, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Times-Bold", 16)
    c.drawString(16 * mm, h - 12 * mm, "Maanak  ·  Legal Metrology Compliance Report")
    c.setFillColor(PAPER)
    c.setFont("Helvetica", 9)
    c.drawString(16 * mm, h - 20 * mm, "Decision-support only — system-flagged, requires officer verification.")

    y = h - 30 * mm
    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(TEAL)
    product = scan.get("product") or {}
    c.drawString(16 * mm, y, product.get("name") or "Unnamed commodity")
    y -= 6 * mm
    c.setFillColor(PAPER)
    c.setFont("Helvetica", 9)
    for line in [
        f"Scan ID: {scan.get('id')}",
        f"Location: {scan.get('location') or '—'}",
        f"Score: {scan.get('compliance_score')}",
        f"Status: {scan.get('overall_compliance')}",
        f"Calibration: {scan.get('calibration_method')}",
    ]:
        c.drawString(16 * mm, y, line)
        y -= 5 * mm

    if image_path and image_path.exists():
        try:
            c.drawImage(
                ImageReader(str(image_path)),
                16 * mm,
                y - 72 * mm,
                width=70 * mm,
                height=70 * mm,
                preserveAspectRatio=True,
                mask="auto",
            )
        except Exception:
            pass

    y -= 80 * mm
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(16 * mm, y, "Declarations")
    y -= 7 * mm
    c.setFont("Helvetica", 8)
    for d in scan.get("declarations") or []:
        c.setFillColor(TEAL if d.get("is_present") else ROSE)
        flag = "PRESENT" if d.get("is_present") else "MISSING"
        value = (d.get("extracted_value") or "—")[:90]
        c.drawString(16 * mm, y, f"{flag}  {d.get('field_label')}: {value}")
        y -= 4.5 * mm
        if y < 28 * mm:
            c.showPage()
            y = h - 20 * mm

    y -= 4 * mm
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(16 * mm, y, "Violations")
    y -= 7 * mm
    c.setFont("Helvetica", 8)
    viols = scan.get("violations") or []
    if not viols:
        c.setFillColor(TEAL)
        c.drawString(16 * mm, y, "No rule-engine flags.")
    for v in viols:
        c.setFillColor(ROSE)
        text = f"[{v.get('severity')}] {v.get('rule_code')} — {v.get('description')}"
        c.drawString(16 * mm, y, text[:110])
        y -= 8 * mm
        if y < 28 * mm:
            c.showPage()
            y = h - 20 * mm

    c.setFillColor(PAPER)
    c.setFont("Helvetica-Oblique", 7)
    c.drawString(
        16 * mm,
        12 * mm,
        "Not a substitute for legal judgment. Cross-check Rule 6–18 of the Packaged Commodities Rules, 2011.",
    )
    c.showPage()
    c.save()
