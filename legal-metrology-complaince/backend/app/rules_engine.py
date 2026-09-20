from __future__ import annotations

import json
from dataclasses import dataclass

WEIGHTS = {"minor": 5, "major": 10, "critical": 20}


@dataclass
class RuleHit:
    rule_code: str
    severity: str
    description: str
    field_key: str | None


def evaluate(declarations: list[dict], rules: list[dict], *, is_imported: bool, is_food: bool) -> tuple[list[RuleHit], float, str]:
    hits: list[RuleHit] = []
    by_key = {d["field_key"]: d for d in declarations}

    for rule in rules:
        if not rule.get("is_active"):
            continue
        key = rule.get("field_key")
        field = by_key.get(key) if key else None
        check = rule.get("check_type")
        params = rule.get("parameters") or {}
        if isinstance(params, str):
            try:
                params = json.loads(params)
            except json.JSONDecodeError:
                params = {}

        if key == "country_of_origin" and not is_imported:
            continue
        if key == "manufacturer_details" and is_food and check == "presence":
            # Flag but don't hard-fail food SKUs (FSSAI overlay)
            if not field or not field.get("is_present"):
                hits.append(
                    RuleHit(
                        rule_code=rule["code"],
                        severity="minor",
                        description="Manufacturer address not detected. For food articles this may be governed by FSSAI labelling — verify manually, do not auto-fail.",
                        field_key=key,
                    )
                )
            continue

        if check == "presence":
            if not field or not field.get("is_present"):
                hits.append(
                    RuleHit(
                        rule_code=rule["code"],
                        severity=rule.get("severity") or "major",
                        description=f"Missing mandatory declaration: {field.get('field_label') if field else key}.",
                        field_key=key,
                    )
                )
        elif check == "format":
            if field and field.get("is_present") and field.get("is_valid_format") is False:
                hits.append(
                    RuleHit(
                        rule_code=rule["code"],
                        severity=rule.get("severity") or "major",
                        description=f"{field['field_label']} is present but not in the expected format ({rule.get('legal_reference')}).",
                        field_key=key,
                    )
                )
        elif check == "font_size":
            min_mm = float(params.get("min_height_mm", 4))
            height = field.get("font_height_mm") if field else None
            if field and field.get("is_present") and height is not None and height < min_mm:
                hits.append(
                    RuleHit(
                        rule_code=rule["code"],
                        severity=rule.get("severity") or "major",
                        description=f"Estimated numeral height {height:.1f} mm is below the configured {min_mm:.0f} mm threshold. System-estimated — verify manually.",
                        field_key=key,
                    )
                )
        elif check == "readability":
            conf = field.get("confidence") if field else 0
            if field and field.get("is_present") and conf is not None and conf < float(params.get("min_confidence", 0.45)):
                hits.append(
                    RuleHit(
                        rule_code=rule["code"],
                        severity="minor",
                        description="Low OCR confidence on this declaration — possible readability issue for manual review (not an automatic hard-fail).",
                        field_key=key,
                    )
                )

    score = 100 - sum(WEIGHTS.get(h.severity, 10) for h in hits)
    score = max(0, min(100, score))
    hard = [h for h in hits if h.severity in ("major", "critical")]
    if not hits:
        status = "compliant"
    elif hard:
        status = "non_compliant"
    else:
        status = "partial"
    return hits, float(score), status
