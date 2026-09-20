from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, relationship, sessionmaker

from .config import DATABASE_URL


class Base(DeclarativeBase):
    pass


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    role = Column(String(30), default="officer")
    department = Column(String(150))
    jurisdiction = Column(String(150))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)

    scans = relationship("Scan", back_populates="uploader")


class Product(Base):
    __tablename__ = "products"
    id = Column(String, primary_key=True)
    name = Column(String(255))
    brand = Column(String(255))
    category = Column(String(150))
    barcode = Column(String(100))
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=utcnow)

    scans = relationship("Scan", back_populates="product")


class Scan(Base):
    __tablename__ = "scans"
    id = Column(String, primary_key=True)
    product_id = Column(String, ForeignKey("products.id"))
    uploaded_by = Column(String, ForeignKey("users.id"))
    image_url = Column(Text, nullable=False)
    thumbnail_url = Column(Text)
    status = Column(String(30), default="processing")
    overall_compliance = Column(String(30))
    compliance_score = Column(Float)
    raw_ocr_text = Column(Text)
    location = Column(String(255))
    calibration_mm = Column(Float)
    calibration_method = Column(String(80))
    device_meta = Column(Text)
    created_at = Column(DateTime, default=utcnow)
    completed_at = Column(DateTime)

    product = relationship("Product", back_populates="scans")
    uploader = relationship("User", back_populates="scans")
    declarations = relationship("Declaration", back_populates="scan", cascade="all, delete-orphan")
    violations = relationship("Violation", back_populates="scan", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="scan", cascade="all, delete-orphan")


class Declaration(Base):
    __tablename__ = "declarations"
    id = Column(String, primary_key=True)
    scan_id = Column(String, ForeignKey("scans.id", ondelete="CASCADE"))
    field_key = Column(String(80), nullable=False)
    field_label = Column(String(150), nullable=False)
    extracted_value = Column(Text)
    bounding_box = Column(Text)
    font_height_mm = Column(Float)
    confidence = Column(Float)
    is_present = Column(Boolean, default=False)
    is_valid_format = Column(Boolean)
    rule_reference = Column(String(50))

    scan = relationship("Scan", back_populates="declarations")


class Violation(Base):
    __tablename__ = "violations"
    id = Column(String, primary_key=True)
    scan_id = Column(String, ForeignKey("scans.id", ondelete="CASCADE"))
    rule_code = Column(String(50), nullable=False)
    severity = Column(String(20), default="major")
    description = Column(Text)
    field_key = Column(String(80))
    created_at = Column(DateTime, default=utcnow)

    scan = relationship("Scan", back_populates="violations")


class ComplianceRule(Base):
    __tablename__ = "compliance_rules"
    code = Column(String(50), primary_key=True)
    title = Column(String(255), nullable=False)
    legal_reference = Column(String(100))
    field_key = Column(String(80))
    check_type = Column(String(50))
    parameters = Column(Text)
    severity = Column(String(20), default="major")
    is_active = Column(Boolean, default=True)


class Report(Base):
    __tablename__ = "reports"
    id = Column(String, primary_key=True)
    scan_id = Column(String, ForeignKey("scans.id"))
    generated_by = Column(String, ForeignKey("users.id"))
    file_url = Column(Text)
    format = Column(String(10))
    created_at = Column(DateTime, default=utcnow)

    scan = relationship("Scan", back_populates="reports")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"))
    action = Column(String(100))
    entity_type = Column(String(50))
    entity_id = Column(String)
    metadata_json = Column(Text)
    created_at = Column(DateTime, default=utcnow)
