from __future__ import annotations

import json
import re
from dataclasses import dataclass

FIELD_DEFS = [
    {
        "key": "generic_name",
        "label": "Generic / commodity name",
        "rule": "Rule 6(1)(a)",
        "patterns": [
            r"(?:product|commodity|item)\s*[:\-]\s*(.+)",
            r"\b(instant noodles|table salt|iodised salt|milk chocolate|potato chips|atta|wheat flour|refined oil)\b",
        ],
    },
    {
        "key": "net_quantity",
        "label": "Net quantity",
        "rule": "Rule 6(1)(b)",
        "patterns": [
            r"(?:net\s*(?:wt|weight|qty|quantity)|n\.?\s*w\.?|net)\s*[:\-]?\s*([\d.]+\s*(?:kg|g|gm|ml|l|ltr|n|pcs|pieces)?)",
            r"\b([\d.]+\s*(?:kg|g|gm|ml|l))\b",
        ],
    },
    {
        "key": "mrp",
        "label": "Maximum retail price",
        "rule": "Rule 6(1)(e)",
        "patterns": [
            r"(?:m\.?r\.?p\.?|mrp|max(?:imum)?\s*retail\s*price)[^\n₹rs]*((?:₹|rs\.?|inr)?\s*[\d,.]+)",
        ],
    },
    {
        "key": "mfg_or_pkg_date",
        "label": "Month & year of manufacture / packing",
        "rule": "Rule 6(1)(d)",
        "patterns": [
            r"(?:mfd|mfg|pkd|packed|manufactured|pkg)[^\n]*?((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s./\-]*\d{2,4}|\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4}|\d{2}/\d{4})",
        ],
    },
    {
        "key": "manufacturer_details",
        "label": "Manufacturer / packer / importer",
        "rule": "Rule 6(1)(a)",
        "patterns": [
            r"(?:mfd\.?\s*by|manufactured by|packed by|marketed by|imported by)\s*[:\-]?\s*(.+)",
        ],
    },
    {
        "key": "consumer_care",
        "label": "Consumer care",
        "rule": "Rule 6(1)(f)",
        "patterns": [
            r"(?:customer|consumer)\s*care[^\n]*",
            r"(?:phone|tel|email|e-mail)\s*[:\-]\s*.+",
            r"\b(?:\+91[\s-]?)?[6-9]\d{9}\b",
            r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}",
        ],
    },
    {
        "key": "country_of_origin",
        "label": "Country of origin",
        "rule": "Rule 6(1)(c)",
        "patterns": [
            r"(?:made in|country of origin|origin)\s*[:\-]?\s*([A-Za-z ]+)",
        ],
    },
]


@dataclass
class ExtractedField:
    field_key: str
    field_label: str
    extracted_value: str | None
    bounding_box: dict | None
    confidence: float
    is_present: bool
    is_valid_format: bool | None
    rule_reference: str
    font_height_px: float | None = None


def _valid_format(key: str, value: str | None) -> bool | None:
    if not value:
        return None
    v = value.lower()
    if key == "mrp":
        has_price = bool(re.search(r"[\d,.]+", v))
        inclusive = any(tok in v for tok in ["inclusive", "incl.", "incl of", "all taxes"])
        return has_price and inclusive
    if key == "net_quantity":
        return bool(re.search(r"\d.+\s*(kg|g|gm|ml|l|ltr|n|pcs)?", v, re.I))
    if key == "mfg_or_pkg_date":
        return bool(re.search(r"\d", v))
    if key == "consumer_care":
        return bool(re.search(r"(\+91|[6-9]\d{9}|@)", v))
    return True


def classify(ocr_text: str, tokens: list[dict] | None = None) -> list[ExtractedField]:
    text = ocr_text or ""
    results: list[ExtractedField] = []
    tokens = tokens or []

    for spec in FIELD_DEFS:
        value = None
        conf = 0.0
        bbox = None
        height_px = None
        for pat in spec["patterns"]:
            m = re.search(pat, text, flags=re.I | re.M)
            if m:
                value = (m.group(0) if m.lastindex is None else (m.group(1) or m.group(0))).strip()
                value = re.sub(r"\s+", " ", value)[:240]
                conf = 0.86
                break
        if tokens:
            key_words = {
                "mrp": ["mrp", "₹", "rs"],
                "net_quantity": ["net", "g", "kg", "ml"],
                "mfg_or_pkg_date": ["mfd", "pkd", "mfg"],
                "consumer_care": ["care", "email", "@"],
                "country_of_origin": ["made", "origin"],
                "manufacturer_details": ["mfd", "packed", "pvt"],
                "generic_name": [],
            }
            needles = key_words.get(spec["key"], [])
            for tok in tokens:
                blob = str(tok.get("text", "")).lower()
                if value and value.lower()[:18] in blob:
                    bbox = tok.get("bbox")
                    height_px = tok.get("height_px")
                    conf = max(conf, float(tok.get("confidence", 0.8)))
                    break
                if not value and any(n in blob for n in needles):
                    value = tok.get("text")
                    bbox = tok.get("bbox")
                    height_px = tok.get("height_px")
                    conf = float(tok.get("confidence", 0.7))
        results.append(
            ExtractedField(
                field_key=spec["key"],
                field_label=spec["label"],
                extracted_value=value,
                bounding_box=bbox,
                confidence=conf if value else 0.0,
                is_present=bool(value),
                is_valid_format=_valid_format(spec["key"], value),
                rule_reference=spec["rule"],
                font_height_px=height_px,
            )
        )
    return results
