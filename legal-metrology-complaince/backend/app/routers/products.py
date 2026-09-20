from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import Product, Scan, User
from ..deps import get_current_user, get_db
from ..seed import serialize_scan, uid

router = APIRouter(prefix="/products", tags=["products"])


class ProductIn(BaseModel):
    name: str
    brand: str | None = None
    category: str | None = None
    barcode: str | None = None


@router.get("")
def list_products(q: str | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Product)
    if q:
        like = f"%{q}%"
        query = query.filter(
            (Product.name.ilike(like)) | (Product.brand.ilike(like)) | (Product.barcode.ilike(like)) | (Product.category.ilike(like))
        )
    items = []
    for p in query.order_by(Product.created_at.desc()).all():
        scans = db.query(Scan).filter(Scan.product_id == p.id).order_by(Scan.created_at.desc()).all()
        latest = scans[0] if scans else None
        items.append(
            {
                "id": p.id,
                "name": p.name,
                "brand": p.brand,
                "category": p.category,
                "barcode": p.barcode,
                "scan_count": len(scans),
                "latest_compliance": latest.overall_compliance if latest else None,
                "latest_score": latest.compliance_score if latest else None,
                "latest_image_url": latest.image_url if latest else None,
                "latest_location": latest.location if latest else None,
                "updated_at": (latest.created_at.isoformat() if latest and latest.created_at else p.created_at.isoformat() if p.created_at else None),
            }
        )
    return items


@router.get("/{product_id}")
def product_detail(product_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.get(Product, product_id)
    if not p:
        raise HTTPException(404, "Product not found")
    scans = db.query(Scan).filter(Scan.product_id == p.id).order_by(Scan.created_at.desc()).all()
    return {
        "id": p.id,
        "name": p.name,
        "brand": p.brand,
        "category": p.category,
        "barcode": p.barcode,
        "scans": [serialize_scan(s) for s in scans],
    }


@router.post("")
def create_product(body: ProductIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role == "viewer":
        raise HTTPException(403, "Read-only role")
    p = Product(id=uid(), name=body.name, brand=body.brand, category=body.category, barcode=body.barcode, created_by=user.id)
    db.add(p)
    db.commit()
    return {"id": p.id, "name": p.name, "brand": p.brand, "category": p.category, "barcode": p.barcode, "scan_count": 0}
