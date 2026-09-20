from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from .config import FIXTURES_DIR, SAMPLES_DIR


def _font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def _draw_text(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, font, fill, tokens: list, w: int, h: int):
    draw.text(xy, text, font=font, fill=fill)
    bbox = draw.textbbox(xy, text, font=font)
    x0, y0, x1, y1 = bbox
    tokens.append(
        {
            "text": text,
            "bbox": {
                "x": round(x0 / w, 4),
                "y": round(y0 / h, 4),
                "w": round((x1 - x0) / w, 4),
                "h": round((y1 - y0) / h, 4),
            },
            "height_px": float(y1 - y0),
            "confidence": 0.94,
        }
    )


def _save(img: Image.Image, name: str, tokens: list, meta: dict) -> dict:
    path = SAMPLES_DIR / name
    img.save(path, "PNG")
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    payload = {"sha256": digest, "file": name, "tokens": tokens, **meta}
    (FIXTURES_DIR / f"{name}.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return payload


def generate_samples() -> list[dict]:
    samples = []

    # 1. Compliant noodles
    w, h = 900, 1200
    img = Image.new("RGB", (w, h), "#1b3a2f")
    d = ImageDraw.Draw(img)
    d.rectangle((40, 40, w - 40, h - 40), outline="#e8c872", width=4)
    d.rectangle((70, 70, w - 70, 240), fill="#0f241c")
    tokens: list = []
    _draw_text(d, (110, 100), "MASALA INSTANT NOODLES", _font(36, True), "#f4e1a1", tokens, w, h)
    _draw_text(d, (110, 160), "Generic name: Instant noodles", _font(22), "#f7f3e8", tokens, w, h)
    _draw_text(d, (110, 280), "Net Qty: 70 g", _font(34, True), "#ffffff", tokens, w, h)
    _draw_text(d, (110, 350), "MRP ₹ 14.00 inclusive of all taxes", _font(28, True), "#fff3c4", tokens, w, h)
    _draw_text(d, (110, 430), "MFD: AUG 2026", _font(26), "#e8f5e9", tokens, w, h)
    _draw_text(d, (110, 500), "Mfd by: Sunrise Foods Pvt Ltd", _font(22), "#dce7d9", tokens, w, h)
    _draw_text(d, (110, 545), "12 Industrial Estate, Indore, MP 452001", _font(20), "#dce7d9", tokens, w, h)
    _draw_text(d, (110, 640), "Consumer Care: 1800-208-0008", _font(22), "#ffffff", tokens, w, h)
    _draw_text(d, (110, 685), "Email: care@sunrisefoods.example", _font(20), "#ffffff", tokens, w, h)
    _draw_text(d, (110, 760), "Made in India", _font(22), "#e8c872", tokens, w, h)
    _draw_text(d, (110, 980), "PRINCIPAL DISPLAY PANEL", _font(16), "#9ccc65", tokens, w, h)
    samples.append(
        _save(
            img,
            "sample-noodles-compliant.png",
            tokens,
            {
                "product": {
                    "name": "Masala Instant Noodles",
                    "brand": "Sunrise",
                    "category": "Food",
                    "barcode": "8901234000011",
                },
                "location": "Indore, MP",
                "imported": False,
                "food": True,
                "package_width_mm": 90,
            },
        )
    )

    # 2. Chips missing MRP
    img = Image.new("RGB", (w, h), "#7a1f1f")
    d = ImageDraw.Draw(img)
    d.rectangle((40, 40, w - 40, h - 40), outline="#ffd54f", width=5)
    tokens = []
    _draw_text(d, (110, 90), "CRUNCH POTATO CHIPS", _font(38, True), "#ffe082", tokens, w, h)
    _draw_text(d, (110, 170), "Generic name: Potato chips", _font(22), "#fff8e1", tokens, w, h)
    _draw_text(d, (110, 280), "Net Qty: 52 g", _font(32, True), "#ffffff", tokens, w, h)
    _draw_text(d, (110, 380), "PKD: JUL 2026", _font(26), "#ffecb3", tokens, w, h)
    _draw_text(d, (110, 470), "Packed by: Crunch Snacks LLP", _font(22), "#ffe0b2", tokens, w, h)
    _draw_text(d, (110, 520), "Plot 8, MIDC Pune, MH 411019", _font(20), "#ffe0b2", tokens, w, h)
    _draw_text(d, (110, 620), "Consumer Care: 022-40001234", _font(22), "#ffffff", tokens, w, h)
    _draw_text(d, (110, 760), "Made in India", _font(22), "#ffd54f", tokens, w, h)
    samples.append(
        _save(
            img,
            "sample-chips-missing-mrp.png",
            tokens,
            {
                "product": {
                    "name": "Crunch Potato Chips",
                    "brand": "Crunch",
                    "category": "Food",
                    "barcode": "8901234000028",
                },
                "location": "Pune, MH",
                "imported": False,
                "food": True,
                "package_width_mm": 80,
            },
        )
    )

    # 3. Imported chocolate missing COO
    img = Image.new("RGB", (w, h), "#3e2723")
    d = ImageDraw.Draw(img)
    d.rectangle((36, 36, w - 36, h - 36), outline="#d7ccc8", width=3)
    tokens = []
    _draw_text(d, (110, 90), "ALPINE MILK CHOCOLATE", _font(34, True), "#f8e1c1", tokens, w, h)
    _draw_text(d, (110, 170), "Generic name: Milk chocolate", _font(22), "#efebe9", tokens, w, h)
    _draw_text(d, (110, 270), "Net Qty: 100 g", _font(30, True), "#ffffff", tokens, w, h)
    _draw_text(d, (110, 350), "MRP Rs. 249 inclusive of all taxes", _font(24, True), "#ffe0b2", tokens, w, h)
    _draw_text(d, (110, 430), "MFD: JAN 2026", _font(24), "#d7ccc8", tokens, w, h)
    _draw_text(d, (110, 510), "Imported by: Northwind Traders Pvt Ltd", _font(20), "#efebe9", tokens, w, h)
    _draw_text(d, (110, 555), "BKC, Mumbai 400051", _font(20), "#efebe9", tokens, w, h)
    _draw_text(d, (110, 640), "Consumer Care: care@northwind.example", _font(20), "#ffffff", tokens, w, h)
    samples.append(
        _save(
            img,
            "sample-chocolate-imported.png",
            tokens,
            {
                "product": {
                    "name": "Alpine Milk Chocolate",
                    "brand": "Alpine",
                    "category": "Food — Imported",
                    "barcode": "7612345000033",
                },
                "location": "Mumbai, MH",
                "imported": True,
                "food": True,
                "package_width_mm": 85,
            },
        )
    )

    # 4. Salt with undersized numerals
    img = Image.new("RGB", (w, h), "#0d47a1")
    d = ImageDraw.Draw(img)
    d.rectangle((40, 40, w - 40, h - 40), outline="#bbdefb", width=4)
    tokens = []
    _draw_text(d, (110, 90), "SHUDDH IODISED SALT", _font(34, True), "#e3f2fd", tokens, w, h)
    _draw_text(d, (110, 170), "Generic name: Iodised salt", _font(22), "#bbdefb", tokens, w, h)
    _draw_text(d, (110, 280), "Net Qty: 1 kg", _font(14), "#ffffff", tokens, w, h)
    _draw_text(d, (110, 320), "MRP ₹ 28.00 inclusive of all taxes", _font(13, True), "#fff59d", tokens, w, h)
    _draw_text(d, (110, 400), "PKD: JUN 2026", _font(24), "#e3f2fd", tokens, w, h)
    _draw_text(d, (110, 470), "Packed by: Coastal Minerals Ltd", _font(20), "#e3f2fd", tokens, w, h)
    _draw_text(d, (110, 515), "Tuticorin, TN 628001", _font(20), "#e3f2fd", tokens, w, h)
    _draw_text(d, (110, 600), "Consumer Care: 044-24681012", _font(20), "#ffffff", tokens, w, h)
    _draw_text(d, (110, 760), "Made in India", _font(22), "#90caf9", tokens, w, h)
    samples.append(
        _save(
            img,
            "sample-salt-small-font.png",
            tokens,
            {
                "product": {
                    "name": "Shuddh Iodised Salt",
                    "brand": "Coastal",
                    "category": "Food",
                    "barcode": "8901234000042",
                },
                "location": "Chennai, TN",
                "imported": False,
                "food": True,
                "package_width_mm": 120,
            },
        )
    )
    return samples
