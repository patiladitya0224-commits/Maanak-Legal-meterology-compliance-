# 📦 Maanak — Legal Metrology Compliance Scanner

**AI-powered software system to detect, extract and validate mandatory declarations on packaged commodities under the Legal Metrology (Packaged Commodities) Rules, 2011 — SIH Problem Statement #26034**

> **Organization:** Ministry of Consumer Affairs, Food & Public Distribution
> **Department:** Department of Consumer Affairs (DoCA)
> **Category:** Software | **Theme:** Miscellaneous

---

## 🧭 How to use this file

This README is written as a **complete build specification**. Paste this entire file as a prompt into an AI coding agent (Cursor, Antigravity, Codex, Windsurf, Claude Code, etc.) and instruct it to:

> "Scaffold this full project exactly as specified below — backend, frontend, database, ML/OCR service, and Docker setup. Implement every module listed under Section 8 (Core Pipeline) and Section 9 (Compliance Rule Engine). Start with the folder structure in Section 5, then the database schema in Section 6, then the backend APIs in Section 7, then the ML service, then the frontend. Use the tech stack in Section 3 unless a better free/open-source alternative exists. Ask me before making irreversible architecture decisions."

Keep this file in the repo root as `README.md` once the project is scaffolded — it doubles as onboarding documentation for judges and teammates.

---

## Table of Contents

1. [Problem Statement Summary](#1-problem-statement-summary)
2. [Solution Overview](#2-solution-overview)
3. [Tech Stack](#3-tech-stack)
4. [System Architecture](#4-system-architecture)
5. [Repository / Folder Structure](#5-repository--folder-structure)
6. [Database Schema](#6-database-schema)
7. [Backend API Reference](#7-backend-api-reference)
8. [Core Processing Pipeline](#8-core-processing-pipeline)
9. [Legal Metrology Compliance Rule Engine](#9-legal-metrology-compliance-rule-engine)
10. [ML / Computer Vision / OCR Approach](#10-ml--computer-vision--ocr-approach)
11. [Frontend Application](#11-frontend-application)
12. [Roles & Permissions](#12-roles--permissions)
13. [Report Generation](#13-report-generation)
14. [Environment Variables](#14-environment-variables)
15. [Setup & Run Instructions](#15-setup--run-instructions)
16. [Hackathon Build Plan (Milestones)](#16-hackathon-build-plan-milestones)
17. [Testing Checklist](#17-testing-checklist)
18. [Deployment](#18-deployment)
19. [Future Enhancements](#19-future-enhancements)
20. [Legal Disclaimer](#20-legal-disclaimer)

---

## 1. Problem Statement Summary

Packaged commodities sold across Indian retail, supermarket and e-commerce channels must carry mandatory declarations under the **Legal Metrology Act, 2009** and the **Legal Metrology (Packaged Commodities) Rules, 2011**. Manual inspection by enforcement officials is slow and resource-intensive, and violations (missing declarations, wrong font size, incorrect MRP format, etc.) are common. We need a system that scans a product image/label and automatically flags non-compliance.

## 2. Solution Overview

A web + mobile-friendly application where an enforcement officer (or the public, in a "citizen reporting" mode) uploads photo(s) of a packaged commodity. The system:

1. Detects the label / principal display panel in the image.
2. Extracts text via OCR and classifies it into required declaration fields.
3. Measures font height of key numerals (MRP, net quantity) in millimetres using image calibration.
4. Runs each extracted field through a **configurable rule engine** modeled on Rule 6–18 of the 2011 Rules.
5. Produces a compliance/violation report (PDF + editable), stores it in a searchable repository, and shows aggregate stats on a dashboard.

---

## 3. Tech Stack

| Layer | Recommended | Notes |
|---|---|---|
| Frontend (Web) | **React 18 + Vite + TypeScript + TailwindCSS + shadcn/ui** | Fast to scaffold, good for hackathon polish |
| Frontend (Mobile, optional) | **React Native (Expo)** or PWA wrapper of the web app | PWA is faster for a hackathon — reuse the web app |
| State/Data fetching | **TanStack Query (React Query)** + Zustand | |
| Charts | **Recharts** | For dashboard |
| Backend API | **Node.js + Express (TypeScript)** *or* **Python + FastAPI** | FastAPI recommended if ML service is Python-heavy — lets you share code/models easily |
| ML / OCR / CV microservice | **Python + FastAPI** | Runs OCR, object detection, font-size measurement |
| OCR engine | **PaddleOCR** (best free multilingual, incl. Hindi) or **EasyOCR** / **Tesseract**; optional cloud fallback: Google Cloud Vision API / AWS Textract | Start with PaddleOCR for offline/free demo |
| Label/panel detection | **YOLOv8 (Ultralytics)** fine-tuned or zero-shot, fallback to OpenCV contour/edge detection | For hackathon, a heuristic OpenCV approach is acceptable if time-constrained |
| NLP field classification | **regex + rule-based extraction**, optionally spaCy NER / a small fine-tuned classifier | Deterministic regex is safer for legal compliance than pure LLM guessing |
| Database | **PostgreSQL** (primary) | Relational, good for structured compliance rules & audit trail |
| File/image storage | **Local disk (dev)** → **AWS S3 / MinIO (prod)** | MinIO is a free self-hosted S3-compatible option for demos |
| Auth | **JWT (access + refresh tokens)**, bcrypt password hashing | Role-based access control |
| PDF generation | **Node:** `pdfkit`/`puppeteer` · **Python:** `reportlab`/`WeasyPrint` | |
| Search | **PostgreSQL full-text search** (or Elasticsearch if time permits) | |
| Containerization | **Docker + docker-compose** | One command to run everything |
| CI/CD (optional) | **GitHub Actions** | |
| Testing | **Jest/Vitest** (frontend/backend JS), **Pytest** (ML service) | |

> 💡 **Hackathon tip:** If time is short, merge the "backend API" and "ML service" into a single **Python FastAPI** monolith with clean internal module boundaries (`/app/api`, `/app/ml`, `/app/rules`) — this avoids inter-service network overhead and is much faster to build and demo than true microservices. Split into services later if needed.

---

## 4. System Architecture

```mermaid
flowchart TD
    A[User: Enforcement Officer / Citizen] -->|Upload image(s)| B[Frontend Web/PWA]
    B -->|REST/JSON + multipart| C[Backend API Gateway]
    C --> D[Auth Service - JWT]
    C --> E[Scan Orchestrator Service]
    E --> F[Image Preprocessing]
    F --> G[Label/Panel Detection - YOLO/OpenCV]
    G --> H[OCR Engine - PaddleOCR/Tesseract]
    H --> I[Declaration Field Classifier - Regex/NER]
    I --> J[Font Size & Readability Analyzer]
    I --> K[Compliance Rule Engine]
    J --> K
    K --> L[Violation Report Generator]
    L --> M[(PostgreSQL DB)]
    L --> N[(Object Storage - S3/MinIO)]
    E --> M
    C --> O[Dashboard & Analytics Service]
    O --> M
    C --> P[Report Export - PDF/DOCX]
    B <--> C
```

**Flow in words:**
`Image upload → preprocessing (deskew, denoise, contrast) → panel/label region detection → OCR text extraction with bounding boxes → field classification (name/address, MRP, net quantity, mfg date, consumer care, country of origin) → font height measurement (px→mm via calibration) → rule engine evaluation → compliance report (JSON + PDF) → saved to repository → visible on dashboard.`

---

## 5. Repository / Folder Structure

```
legal-metrology-compliance-scanner/
├── README.md                          ← this file
├── docker-compose.yml
├── .env.example
├── .gitignore
│
├── frontend/                          # React + Vite + TS
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── index.html
│   ├── public/
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── router.tsx
│       ├── api/                       # axios/fetch clients per resource
│       │   ├── client.ts
│       │   ├── auth.api.ts
│       │   ├── scans.api.ts
│       │   ├── products.api.ts
│       │   ├── reports.api.ts
│       │   └── dashboard.api.ts
│       ├── components/
│       │   ├── ui/                    # shadcn primitives
│       │   ├── layout/                # Navbar, Sidebar, Shell
│       │   ├── upload/UploadDropzone.tsx
│       │   ├── scan/ScanResultCard.tsx
│       │   ├── scan/DeclarationBadge.tsx
│       │   ├── scan/LabelAnnotationViewer.tsx   # draws bounding boxes over image
│       │   ├── report/ComplianceReportView.tsx
│       │   ├── dashboard/StatsCard.tsx
│       │   ├── dashboard/ViolationTrendChart.tsx
│       │   └── common/DataTable.tsx
│       ├── pages/
│       │   ├── auth/Login.tsx
│       │   ├── auth/Register.tsx
│       │   ├── Dashboard.tsx
│       │   ├── ScanNew.tsx            # upload + trigger scan
│       │   ├── ScanResult.tsx         # per-scan detail + annotated image
│       │   ├── ProductRepository.tsx  # searchable list of past scans
│       │   ├── ProductDetail.tsx
│       │   ├── Reports.tsx
│       │   ├── UsersAdmin.tsx         # role-based user management
│       │   └── Settings.tsx           # configurable rule thresholds
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   └── useScanPolling.ts      # poll async scan job status
│       ├── store/
│       │   └── authStore.ts           # Zustand
│       ├── types/
│       │   ├── scan.types.ts
│       │   ├── product.types.ts
│       │   └── report.types.ts
│       └── utils/
│           └── formatters.ts
│
├── backend/                            # Node/Express OR FastAPI — pick one
│   ├── package.json / pyproject.toml
│   ├── src/  (or app/)
│   │   ├── main.ts / main.py
│   │   ├── config/
│   │   │   ├── env.ts
│   │   │   └── db.ts
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts     # JWT verify
│   │   │   ├── rbac.middleware.ts     # role guard
│   │   │   ├── upload.middleware.ts   # multer/multipart handling
│   │   │   └── errorHandler.ts
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── auth.routes.ts
│   │   │   ├── users/
│   │   │   ├── products/
│   │   │   │   ├── products.controller.ts
│   │   │   │   ├── products.service.ts
│   │   │   │   └── products.routes.ts
│   │   │   ├── scans/
│   │   │   │   ├── scans.controller.ts
│   │   │   │   ├── scans.service.ts   # orchestrates call to ML service
│   │   │   │   └── scans.routes.ts
│   │   │   ├── declarations/
│   │   │   │   └── declarations.service.ts   # maps extracted fields -> DB rows
│   │   │   ├── rules/
│   │   │   │   ├── rules.engine.ts    # core compliance logic (see Section 9)
│   │   │   │   ├── rules.config.json  # editable rule thresholds
│   │   │   │   └── rules.routes.ts    # CRUD for admins to tweak rules
│   │   │   ├── reports/
│   │   │   │   ├── reports.service.ts
│   │   │   │   ├── pdf.generator.ts
│   │   │   │   └── reports.routes.ts
│   │   │   └── dashboard/
│   │   │       ├── dashboard.service.ts
│   │   │       └── dashboard.routes.ts
│   │   ├── models/  (Prisma schema or SQLAlchemy models)
│   │   ├── repositories/              # DB access layer
│   │   └── utils/
│   │       ├── logger.ts
│   │       └── s3.ts
│   ├── prisma/schema.prisma           # if using Prisma ORM
│   └── tests/
│
├── ml-service/                        # Python FastAPI — OCR + CV + rules eval
│   ├── pyproject.toml / requirements.txt
│   ├── app/
│   │   ├── main.py                    # FastAPI entrypoint
│   │   ├── api/
│   │   │   ├── scan_routes.py         # POST /analyze
│   │   │   └── health_routes.py
│   │   ├── pipeline/
│   │   │   ├── preprocess.py          # deskew, denoise, normalize
│   │   │   ├── panel_detector.py      # YOLO or OpenCV contour detection
│   │   │   ├── ocr_engine.py          # PaddleOCR/EasyOCR/Tesseract wrapper
│   │   │   ├── field_classifier.py    # regex/NER -> structured declarations
│   │   │   ├── font_measurer.py       # bbox height (px) -> mm via calibration
│   │   │   └── pipeline_runner.py     # orchestrates the full pipeline
│   │   ├── rules/
│   │   │   └── legal_metrology_rules.py   # mirrors Section 9 below
│   │   ├── models/                    # trained weights (YOLO .pt, etc.) - gitignored
│   │   └── schemas/
│   │       └── scan_schemas.py        # Pydantic request/response models
│   └── tests/
│
├── database/
│   ├── migrations/                    # SQL migration files (or Prisma migrate)
│   ├── seed/
│   │   └── seed_rules.sql             # pre-loaded Legal Metrology rule set
│   └── er-diagram.png
│
├── docs/
│   ├── architecture.md
│   ├── api-spec.yaml                  # OpenAPI/Swagger spec
│   ├── compliance-rules-reference.md  # plain-English mapping to Rule 6–18
│   └── deployment-guide.md
│
└── infra/
    ├── docker/
    │   ├── frontend.Dockerfile
    │   ├── backend.Dockerfile
    │   └── ml-service.Dockerfile
    └── nginx/
        └── nginx.conf
```

---

## 6. Database Schema

Use PostgreSQL. Below is a logical schema — implement via Prisma / SQLAlchemy / raw SQL migrations.

```sql
-- Users & Roles
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'officer', -- admin | officer | viewer | citizen
    department VARCHAR(150),
    jurisdiction VARCHAR(150),               -- state/district of enforcement officer
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Products (a logical commodity that may have multiple scans over time)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    brand VARCHAR(255),
    category VARCHAR(150),
    barcode VARCHAR(100),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT now()
);

-- Scans (each image-upload event)
CREATE TABLE scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    uploaded_by UUID REFERENCES users(id),
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    status VARCHAR(30) DEFAULT 'processing',  -- processing | completed | failed
    overall_compliance VARCHAR(30),           -- compliant | non_compliant | partial
    compliance_score NUMERIC(5,2),            -- 0-100
    raw_ocr_text TEXT,
    location VARCHAR(255),                    -- store/market where photographed
    device_meta JSONB,
    created_at TIMESTAMP DEFAULT now(),
    completed_at TIMESTAMP
);

-- Extracted declarations per scan (one row per required field)
CREATE TABLE declarations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
    field_key VARCHAR(80) NOT NULL,           -- e.g. 'mrp', 'net_quantity', 'mfg_date'
    field_label VARCHAR(150) NOT NULL,
    extracted_value TEXT,
    bounding_box JSONB,                       -- {x,y,w,h} on the source image
    font_height_mm NUMERIC(5,2),
    confidence NUMERIC(5,2),
    is_present BOOLEAN DEFAULT FALSE,
    is_valid_format BOOLEAN,
    rule_reference VARCHAR(50)                -- e.g. 'Rule 6(1)(a)'
);

-- Violations detected per scan
CREATE TABLE violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
    rule_code VARCHAR(50) NOT NULL,           -- FK-ish reference to compliance_rules.code
    severity VARCHAR(20) DEFAULT 'major',     -- minor | major | critical
    description TEXT,
    field_key VARCHAR(80),
    created_at TIMESTAMP DEFAULT now()
);

-- Configurable rule definitions (so the rule engine isn't hardcoded)
CREATE TABLE compliance_rules (
    code VARCHAR(50) PRIMARY KEY,             -- e.g. 'LM_R6_MRP'
    title VARCHAR(255) NOT NULL,
    legal_reference VARCHAR(100),             -- e.g. 'Rule 6(1)(e)'
    field_key VARCHAR(80),
    check_type VARCHAR(50),                   -- presence | format | font_size | placement
    parameters JSONB,                         -- thresholds e.g. {"min_height_mm": 4}
    severity VARCHAR(20) DEFAULT 'major',
    is_active BOOLEAN DEFAULT TRUE
);

-- Compliance reports (generated documents)
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID REFERENCES scans(id),
    generated_by UUID REFERENCES users(id),
    file_url TEXT,
    format VARCHAR(10),                       -- pdf | docx
    created_at TIMESTAMP DEFAULT now()
);

-- Evidence photo attachments (supporting images beyond the main scan)
CREATE TABLE evidence_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    caption VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT now()
);

-- Audit log for enforcement/legal traceability
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT now()
);
```

**Indexes to add:** `scans(product_id)`, `scans(uploaded_by)`, `scans(status)`, `violations(scan_id)`, `declarations(scan_id)`, full-text index on `products(name, brand)`.

---

## 7. Backend API Reference

Base URL: `/api/v1`

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create account (admin approval for officer role) |
| POST | `/auth/login` | Returns JWT access + refresh token |
| POST | `/auth/refresh` | Refresh access token |
| GET  | `/auth/me` | Current user profile |

### Scans
| Method | Endpoint | Description |
|---|---|---|
| POST | `/scans` | Upload image(s) (multipart), creates scan, kicks off async pipeline |
| GET  | `/scans` | List scans (filters: status, date range, compliance, uploaded_by) |
| GET  | `/scans/:id` | Full scan detail incl. declarations, violations, annotated image |
| GET  | `/scans/:id/status` | Poll job status while `processing` |
| DELETE | `/scans/:id` | Soft-delete a scan |
| POST | `/scans/:id/attachments` | Add supporting evidence photos |

### Products
| Method | Endpoint | Description |
|---|---|---|
| GET | `/products` | Search/browse repository (query: name, brand, barcode, category) |
| GET | `/products/:id` | Product detail + scan history |
| POST | `/products` | Manually register a product |

### Rules (admin)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/rules` | List all compliance rules |
| PUT | `/rules/:code` | Update rule thresholds/severity |
| POST | `/rules` | Add a new custom rule |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| POST | `/reports/:scanId/generate` | Generate PDF/DOCX compliance report |
| GET | `/reports/:id/download` | Download generated report |
| GET | `/reports` | List generated reports |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard/summary` | Total scans, compliance %, violations by category |
| GET | `/dashboard/trends` | Time-series violation trend data |
| GET | `/dashboard/top-violations` | Most frequent violation types |

### ML Service (internal, called by backend)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/ml/analyze` | Accepts image, returns OCR text, bounding boxes, extracted declarations, font measurements |

---

## 8. Core Processing Pipeline

Implement as an async job (queue-based if time allows — e.g. BullMQ/Redis or Celery; otherwise a simple background task/thread is fine for a hackathon demo):

1. **Upload & Validate** — accept JPEG/PNG, size limit (e.g. 10MB), virus/type check.
2. **Preprocessing** — grayscale, denoise, deskew, adaptive thresholding, perspective correction (OpenCV).
3. **Panel/Label Detection** — locate the principal display panel region(s) in the image (YOLOv8 or contour-based heuristic for hackathon speed).
4. **OCR Extraction** — run OCR on the detected region(s), returning text tokens **with bounding boxes and confidence scores** (bounding boxes are essential — they drive font-size measurement and the annotated-image UI).
5. **Field Classification** — map OCR tokens to declaration fields using regex + keyword proximity rules, e.g.:
   - MRP: patterns like `MRP`, `M.R.P`, `₹`, `Rs.`, followed by a number.
   - Net Quantity: patterns like `Net Wt`, `Net Qty`, `g`, `kg`, `ml`, `l`, `N.W.`
   - Mfg Date: `MFD`, `Mfg Date`, `Pkd Date`, `Manufactured on`, month/year patterns.
   - Consumer Care: `Customer Care`, `Consumer Care`, email/phone regex.
   - Manufacturer/Packer/Importer: proximity to keywords `Mfd by`, `Packed by`, `Marketed by`, `Imported by`.
   - Country of Origin: `Made in`, `Country of Origin`.
6. **Font Size Measurement** — convert bounding-box pixel height to millimetres. Requires a calibration reference: either (a) a known reference object/marker in the photo, (b) EXIF/DPI metadata, or (c) a UI step where the officer inputs the package's known dimension for scale. Document the assumption clearly in the report ("estimated," not laboratory-certified).
7. **Rule Evaluation** — pass structured declarations through the Compliance Rule Engine (Section 9).
8. **Report Assembly** — compute an overall compliance score, list violations with legal references, generate PDF/DOCX.
9. **Persistence** — save scan, declarations, violations, and report to DB + object storage.
10. **Notify** — update scan status to `completed`/`failed`; frontend polls or uses WebSocket/SSE for live update.

---

## 9. Legal Metrology Compliance Rule Engine

> Build this as **data-driven**, not hardcoded — store rules in the `compliance_rules` table (Section 6) so officials can tune thresholds without a redeploy. Below is the starter rule set derived from the Legal Metrology Act, 2009 and the Legal Metrology (Packaged Commodities) Rules, 2011. **Verify exact clause numbers and thresholds against the current bare act/official gazette before treating this as legally authoritative** (see [Legal Disclaimer](#20-legal-disclaimer)).

### 9.1 Mandatory declarations (Rule 6)

| Field key | Declaration | Notes for detection |
|---|---|---|
| `manufacturer_details` | Name & registered address of manufacturer/packer/importer | Waived for pure food articles (governed instead by FSSAI rules) — flag but don't hard-fail food SKUs |
| `country_of_origin` | Country of origin/manufacture/assembly | Mandatory only for imported goods |
| `generic_name` | Common/generic name of the commodity | |
| `net_quantity` | Net quantity in standard units (weight/measure/number) | Must use standard SI units |
| `mfg_or_pkg_date` | Month & year of manufacture/packing/import | |
| `mrp` | Maximum Retail Price, inclusive of all taxes | Must contain "inclusive of all taxes" or equivalent |
| `consumer_care` | Name, address, phone/email for consumer complaints | |

### 9.2 Manner & placement (Rules 8–9)

- All declarations should appear together on the **principal display panel**, or in the officially permitted grouped/split layout.
- Declarations must be in **Hindi or English** (regional language optionally in addition).
- Text must be **legible under normal purchase conditions** — flag low OCR-confidence regions as a possible readability issue for manual review, not an automatic hard-fail (OCR confidence ≠ human legibility).

### 9.3 Font size / numeral height (Rule 7 and related)

- Minimum height of numerals for MRP / net quantity declarations: **4 mm** in normal cases, **6 mm** where the numerals are blown, formed, moulded, embossed, or perforated onto the container.
- Implement this as a configurable threshold (`parameters: {"min_height_mm": 4, "min_height_mm_molded": 6}`) so it can be corrected instantly if the gazette specifies different tiers for different package sizes — **do not hardcode a single unverified number as legal fact in the UI copy; label it as "system-estimated, verify manually."**

### 9.4 Sample rule engine logic (pseudocode)

```python
def evaluate_compliance(declarations: dict, rules: list[ComplianceRule]) -> ComplianceResult:
    violations = []
    for rule in rules:
        if not rule.is_active:
            continue
        field = declarations.get(rule.field_key)

        if rule.check_type == "presence":
            if not field or not field.is_present:
                violations.append(Violation(rule.code, "Missing mandatory declaration", rule.severity))

        elif rule.check_type == "format":
            if field and not matches_expected_format(field.extracted_value, rule.parameters):
                violations.append(Violation(rule.code, "Declaration present but incorrectly formatted", rule.severity))

        elif rule.check_type == "font_size":
            min_mm = rule.parameters.get("min_height_mm")
            if field and field.font_height_mm and field.font_height_mm < min_mm:
                violations.append(Violation(rule.code, f"Font height {field.font_height_mm}mm below required {min_mm}mm", rule.severity))

        elif rule.check_type == "placement":
            if field and not is_on_principal_panel(field.bounding_box, panel_bbox):
                violations.append(Violation(rule.code, "Declaration not on principal display panel", rule.severity))

    score = compute_score(declarations, violations)
    return ComplianceResult(violations=violations, score=score,
                             status="compliant" if not violations else "non_compliant")
```

### 9.5 Compliance score formula (suggested)

```
score = 100 - Σ(weight[severity] for each violation)
weight = { "minor": 5, "major": 10, "critical": 20 }
clamp(score, 0, 100)
```

---

## 10. ML / Computer Vision / OCR Approach

**Recommended hackathon-pragmatic pipeline** (favor free/offline tools so the demo works without API keys/internet):

1. **OpenCV** for preprocessing (grayscale, CLAHE contrast enhancement, deskew via Hough transform, adaptive threshold).
2. **Panel detection**: start with a simple heuristic (largest rectangular contour / whole-image fallback) — upgrade to a fine-tuned **YOLOv8n** model only if time permits and you can label ~100–200 sample images.
3. **OCR**: **PaddleOCR** (`PP-OCRv4`) supports English + Hindi out of the box and runs locally/free — good default. `EasyOCR` and `Tesseract` are solid fallbacks. Return word-level bounding boxes + confidence.
4. **Field classification**: deterministic **regex + keyword-proximity** rules (see Section 8, step 5) — more reliable and explainable for a compliance/legal context than an LLM guess. Optionally use `spaCy` for basic NER on manufacturer/address blocks.
5. **Font size measurement**: 
   - Compute bounding-box pixel height of the relevant numerals.
   - Convert px → mm using a calibration factor: `mm = (pixel_height / image_DPI) * 25.4`, where DPI is either read from image metadata, estimated from a known reference object the officer places in-frame (e.g., a credit-card-sized card, ISO 7810 standard = 85.6 × 53.98 mm), or manually entered by the officer as a fallback.
   - Always surface the calibration method used in the report so results are auditable.
6. **Optional cloud upgrade path**: if free-tier API keys are available, swap in **Google Cloud Vision** (`DOCUMENT_TEXT_DETECTION`) or **AWS Textract** for higher OCR accuracy — keep the OCR engine behind an interface (`ocr_engine.py`) so swapping providers doesn't touch the rest of the pipeline.

---

## 11. Frontend Application

### Key pages
- **Login / Register** — role-based (officer registration may require admin approval).
- **Dashboard** — total scans, compliance rate, violation-type breakdown (bar/pie), trend line over time, recent scans table.
- **New Scan** — drag-and-drop image upload, live progress indicator, camera capture on mobile/PWA.
- **Scan Result** — annotated image (bounding boxes overlaid, color-coded green/red by compliance), field-by-field checklist with rule references, "generate report" button.
- **Product Repository** — searchable/filterable table of all scanned products (by name, brand, category, compliance status, date, location).
- **Product Detail** — full scan history for a given product/barcode.
- **Reports** — list of generated PDF/DOCX reports, download/export.
- **Admin: Rule Settings** — CRUD UI over `compliance_rules` table (toggle rules, edit thresholds).
- **Admin: User Management** — manage officer accounts and roles.

### UX notes
- Show OCR/detection confidence transparently — never present an automated flag as a final legal determination; label results "System-flagged — requires officer verification."
- Support offline-first capture on mobile (queue uploads when connectivity returns) if time allows.

---

## 12. Roles & Permissions

| Role | Permissions |
|---|---|
| **Admin** | Full access: manage users, edit compliance rules, view all data, all dashboards |
| **Enforcement Officer** | Create scans, view/search repository, generate reports, view dashboard (own jurisdiction) |
| **Viewer / Auditor** | Read-only access to reports and dashboard |
| **Citizen (optional public mode)** | Submit a scan for review; cannot see internal enforcement dashboards |

Implement via JWT claims (`role`) + middleware guard on each route (`rbac.middleware.ts`).

---

## 13. Report Generation

- **Format:** PDF (primary) + DOCX (editable) export.
- **Contents:** product photo(s) with annotations, extracted declarations table, violations list with legal rule references and severity, compliance score, officer name/date/location, QR code linking to the digital record.
- **Libraries:** `puppeteer` (render an HTML template to PDF — fastest for a hackathon since you can reuse frontend styling) or `reportlab`/`WeasyPrint` in Python; `docx` npm package or `python-docx` for editable format.

---

## 14. Environment Variables

`.env.example`

```env
# Backend
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lmcs
JWT_ACCESS_SECRET=change_me
JWT_REFRESH_SECRET=change_me
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Storage
STORAGE_DRIVER=local            # local | s3
S3_ENDPOINT=
S3_BUCKET=lmcs-uploads
S3_ACCESS_KEY=
S3_SECRET_KEY=

# ML Service
ML_SERVICE_URL=http://ml-service:8000
OCR_ENGINE=paddleocr            # paddleocr | easyocr | tesseract | google_vision
GOOGLE_VISION_API_KEY=          # optional cloud fallback

# Frontend
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

---

## 15. Setup & Run Instructions

### Quick start with Docker (recommended for hackathon demo)

```bash
git clone <your-repo-url>
cd legal-metrology-compliance-scanner
cp .env.example .env
docker-compose up --build
```

This should bring up: `frontend` (http://localhost:5173), `backend` (http://localhost:4000), `ml-service` (http://localhost:8000), `postgres`, and optionally `minio`.

### Manual local dev (without Docker)

```bash
# 1. Database
createdb lmcs
psql lmcs < database/migrations/001_init.sql
psql lmcs < database/seed/seed_rules.sql

# 2. Backend
cd backend && npm install && npm run dev

# 3. ML service
cd ml-service && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000

# 4. Frontend
cd frontend && npm install && npm run dev
```

`docker-compose.yml` skeleton:

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: lmcs
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]

  ml-service:
    build: ./ml-service
    ports: ["8000:8000"]
    volumes: ["./ml-service:/app"]

  backend:
    build: ./backend
    ports: ["4000:4000"]
    depends_on: [postgres, ml-service]
    env_file: .env

  frontend:
    build: ./frontend
    ports: ["5173:5173"]
    depends_on: [backend]

volumes:
  pgdata:
```

---

## 16. Hackathon Build Plan (Milestones)

**Phase 1 — Foundation (first few hours)**
- Scaffold folder structure, Docker setup, DB schema + migrations, seed `compliance_rules` table.
- Auth (register/login/JWT) end-to-end.

**Phase 2 — Core Pipeline (MVP)**
- Image upload → preprocessing → OCR (PaddleOCR) → raw text extraction working end-to-end (even without perfect field classification).
- Basic regex-based field classifier for the 7 mandatory declarations.
- Rule engine evaluating presence checks only (skip font-size measurement initially).

**Phase 3 — Compliance Intelligence**
- Add format validation (MRP format, date format, net-quantity unit).
- Add font-size measurement with a simple calibration method.
- Compute compliance score; persist violations.

**Phase 4 — Frontend & Reports**
- Build Dashboard, New Scan, Scan Result, Product Repository pages.
- PDF report generation + download.

**Phase 5 — Polish for Demo**
- Seed realistic demo data (10–15 sample product photos, mix of compliant/non-compliant).
- Role-based views, error states, loading states.
- Record a 2–3 minute demo video/script covering the problem → pipeline → dashboard → report.

---

## 17. Testing Checklist

- [ ] Upload valid image → scan completes → correct fields extracted
- [ ] Upload image with missing MRP → violation correctly flagged with right rule reference
- [ ] Font-size check correctly flags undersized numerals on a test image
- [ ] Non-food vs food product correctly waives/requires manufacturer-address rule
- [ ] Imported product correctly requires country-of-origin
- [ ] Role guard: officer cannot access admin rule-editing endpoints
- [ ] Report PDF downloads and matches on-screen data
- [ ] Dashboard aggregates match underlying scan data
- [ ] Search/filter in Product Repository returns correct results
- [ ] Graceful failure when OCR confidence is very low (flagged for manual review, not silently wrong)

---

## 18. Deployment

- **Frontend:** Vercel/Netlify (static build) or serve via Nginx in Docker.
- **Backend + ML service:** any container host (Render, Railway, Fly.io, or a college/cloud VM) via `docker-compose`.
- **Database:** managed Postgres (Supabase/Neon/Railway) or self-hosted container.
- **Object storage:** S3 or self-hosted MinIO.
- Put Nginx in front as a reverse proxy + TLS termination (`infra/nginx/nginx.conf`).

---

## 19. Future Enhancements

- Fine-tuned label/panel detection model trained on Indian retail packaging.
- Mobile app with offline capture and background sync.
- Multi-language OCR (all 22 scheduled languages) for regional-language declarations.
- Barcode/QR scanning to auto-link to a product's manufacturer-registration data (Rule 27 registration lookup).
- E-commerce listing scraper/API integration to proactively scan online product pages.
- Integration with the official DoCA/Legal Metrology enforcement case-management system.
- Explainable-AI overlay showing *why* a field was flagged, for legal defensibility.

---

## 20. Legal Disclaimer

This system is a **decision-support tool** for enforcement officials, not a substitute for legal judgment. All automated flags are provisional and must be verified by a qualified Legal Metrology officer before any enforcement action. Rule thresholds and clause references in this document are drawn from public secondary sources and must be cross-checked against the current official text of the Legal Metrology Act, 2009, the Legal Metrology (Packaged Commodities) Rules, 2011, and any subsequent amendments/gazette notifications (see https://consumeraffairs.gov.in/pages/legal-metrology-act) before the rule engine is relied upon in production or presented as legally authoritative to judges/evaluators.

---

## 📋 Instructions for the AI Coding Agent

When implementing this project:

1. Start by generating the full folder structure from Section 5 with placeholder files.
2. Implement the database schema and run migrations before writing any API code.
3. Build the ML service pipeline (Section 8 & 10) as an independently testable module — write a small script to run it against a sample image before wiring up the API.
4. Implement the rule engine (Section 9) as data-driven, reading from the `compliance_rules` table, not hardcoded if/else per rule.
5. Wire backend endpoints per Section 7, with input validation and RBAC middleware on every protected route.
6. Build the frontend pages per Section 11, consuming the backend API — use mock data first if the backend isn't ready, then swap to real calls.
7. Add Docker Compose last, once each service runs locally, to containerize the whole stack for one-command demo startup.
8. Seed the database with realistic demo data so the dashboard and repository aren't empty during judging.
9. Clearly label all automated compliance determinations in the UI as provisional/system-flagged, per Section 20.

---

*Built for Smart India Hackathon — Problem Statement #26034.*
