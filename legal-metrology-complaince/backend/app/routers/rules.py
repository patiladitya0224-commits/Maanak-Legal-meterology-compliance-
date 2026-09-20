import json

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import ComplianceRule, User
from ..deps import get_current_user, get_db, require_roles
from ..seed import serialize_rule

router = APIRouter(prefix="/rules", tags=["rules"])


class RulePatch(BaseModel):
    title: str | None = None
    severity: str | None = None
    is_active: bool | None = None
    parameters: dict | None = None


@router.get("")
def list_rules(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return [serialize_rule(r) for r in db.query(ComplianceRule).order_by(ComplianceRule.code).all()]


@router.put("/{code}")
def update_rule(
    code: str,
    body: RulePatch,
    user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    rule = db.get(ComplianceRule, code)
    if not rule:
        raise HTTPException(404, "Rule not found")
    if body.title is not None:
        rule.title = body.title
    if body.severity is not None:
        rule.severity = body.severity
    if body.is_active is not None:
        rule.is_active = body.is_active
    if body.parameters is not None:
        rule.parameters = json.dumps(body.parameters)
    db.commit()
    return serialize_rule(rule)
