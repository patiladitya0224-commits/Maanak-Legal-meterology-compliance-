from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

from .classifier import classify
from .config import DATA_DIR, FIXTURES_DIR
from .rules_engine import evaluate

# EasyOCR keeps its downloaded detection/recognition weights here so they
# persist across restarts instead of being re-fetched on every boot.
_OCR_MODEL_DIR = DATA_DIR / "ocr_models"
_OCR_MODEL_DIR.mkdir(parents=True, exist_ok=True)

# The EasyOCR reader loads a multi-hundred-MB neural net. Building a fresh
# Reader on every scan (as before) is what actually made OCR "fail" in
# practice -- each call paid the full model-load cost, so it either timed
# out or effectively never returned usable text. We build it once per
# process and reuse it.
_READER = None
_READER_UNAVAILABLE = False


def _get_reader():
    global _READER, _READER_UNAVAILABLE
    if _READER is not None:
        return _READER
    if _READER_UNAVAILABLE:
        return None
    try:
        import easyocr
    except ImportError:
        print(
            "OCR error: 'easyocr' is not installed. "
            "Add 'easyocr' and 'numpy' to requirements.txt and rebuild."
        )
        _READER_UNAVAILABLE = True
        return None
    try:
        _READER = easyocr.Reader(
            ["en"],
            gpu=False,
            verbose=False,
            model_storage_directory=str(_OCR_MODEL_DIR),
        )
    except Exception as e:  # noqa: BLE001
        print(f"OCR error: failed to initialize EasyOCR reader: {e}")
        _READER_UNAVAILABLE = True
        return None
    return _READER


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_fixture(digest: str) -> dict | None:
    for file in FIXTURES_DIR.glob("*.json"):
        data = json.loads(file.read_text(encoding="utf-8"))
        if data.get("sha256") == digest:
            return data
    return None


def preprocess(path: Path) -> Image.Image:
    img = Image.open(path).convert("RGB")
    gray = ImageOps.grayscale(img)
    gray = ImageOps.autocontrast(gray)
    # Small/low-res label photos are the most common reason detection
    # models miss text entirely, so upscale anything under ~1200px on its
    # longest side before sharpening/contrast work.
    longest_side = max(gray.size)
    if longest_side < 1200:
        scale = 1200 / float(longest_side)
        new_size = (round(gray.width * scale), round(gray.height * scale))
        gray = gray.resize(new_size, Image.LANCZOS)
    gray = gray.filter(ImageFilter.UnsharpMask(radius=1.4, percent=140, threshold=2))
    return ImageEnhance.Contrast(gray).enhance(1.25)


def try_ocr(path: Path) -> tuple[str, list[dict]]:
    try:
        import numpy as np
    except ImportError:
        print("OCR error: 'numpy' is not installed. Add it to requirements.txt and rebuild.")
        return "", []

    reader = _get_reader()
    if reader is None:
        return "", []

    try:
        img = preprocess(path)
        results = reader.readtext(np.array(img))
    except Exception as e:
        print(f"OCR error: {e}")
        return "", []
    
    tokens = []
    text_parts = []
    
    for (bbox, text, prob) in results:
        t = text.strip()
        if t:
            x1, y1 = bbox[0]
            x2, y2 = bbox[1]
            x3, y3 = bbox[2]
            
            w = int(x2 - x1)
            h = int(y3 - y2)
            
            tokens.append({
                "text": t,
                "bbox": {"x": int(x1), "y": int(y1), "w": w, "h": h},
                "confidence": float(prob),
                "height_px": float(h)
            })
            text_parts.append(t)
            
    return "\n".join(text_parts), tokens


def analyze_image(
    path: Path,
    *,
    package_width_mm: float | None,
    is_imported: bool,
    is_food: bool,
    rules: list[dict],
) -> dict:
    digest = sha256_file(path)
    fixture = load_fixture(digest)
    tokens: list[dict] = []
    raw = ""
    calibration_method = "none"

    if fixture:
        tokens = fixture.get("tokens") or []
        raw = "\n".join(t.get("text", "") for t in tokens)
        package_width_mm = package_width_mm or fixture.get("package_width_mm") or 90
        is_imported = bool(fixture.get("imported", is_imported))
        is_food = bool(fixture.get("food", is_food))
        calibration_method = "sample_fixture + officer package width"
    else:
        raw, tokens = try_ocr(path)
        calibration_method = "easyocr" if raw else "unreadable_fallback"
        package_width_mm = package_width_mm or 90

    img = Image.open(path)
    img_h = img.height
    fields = classify(raw, tokens)

    declarations = []
    for f in fields:
        height_mm = None
        if f.font_height_px and package_width_mm and img.width:
            px_per_mm = img.width / float(package_width_mm)
            height_mm = round(f.font_height_px / px_per_mm, 2)
        elif f.bounding_box and package_width_mm:
            height_mm = round(float(f.bounding_box["h"]) * (img_h / img.width) * package_width_mm, 2)
        declarations.append(
            {
                "field_key": f.field_key,
                "field_label": f.field_label,
                "extracted_value": f.extracted_value,
                "bounding_box": f.bounding_box,
                "font_height_mm": height_mm,
                "confidence": f.confidence,
                "is_present": f.is_present,
                "is_valid_format": f.is_valid_format,
                "rule_reference": f.rule_reference,
            }
        )

    hits, score, status = evaluate(declarations, rules, is_imported=is_imported, is_food=is_food)
    return {
        "raw_ocr_text": raw,
        "declarations": declarations,
        "violations": [
            {
                "rule_code": h.rule_code,
                "severity": h.severity,
                "description": h.description,
                "field_key": h.field_key,
            }
            for h in hits
        ],
        "compliance_score": score,
        "overall_compliance": status,
        "calibration_mm": package_width_mm,
        "calibration_method": calibration_method,
        "fixture_product": (fixture or {}).get("product"),
        "fixture_location": (fixture or {}).get("location"),
        "is_imported": is_imported,
        "is_food": is_food,
    }
