export type Role = "admin" | "officer" | "viewer" | "citizen";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string | null;
  jurisdiction?: string | null;
};

export type BoundingBox = { x: number; y: number; w: number; h: number };

export type Declaration = {
  id?: string;
  field_key: string;
  field_label: string;
  extracted_value?: string | null;
  bounding_box?: BoundingBox | null;
  font_height_mm?: number | null;
  confidence: number;
  is_present: boolean;
  is_valid_format?: boolean | null;
  rule_reference?: string | null;
};

export type Violation = {
  id?: string;
  rule_code: string;
  severity: "minor" | "major" | "critical" | string;
  description: string;
  field_key?: string | null;
};

export type Product = {
  id: string;
  name?: string | null;
  brand?: string | null;
  category?: string | null;
  barcode?: string | null;
  scan_count?: number;
  latest_compliance?: string | null;
  latest_score?: number | null;
  latest_image_url?: string | null;
  latest_location?: string | null;
  updated_at?: string | null;
  scans?: Scan[];
};

export type Scan = {
  id: string;
  product_id?: string | null;
  product?: Product | null;
  image_url: string;
  status: string;
  overall_compliance?: string | null;
  compliance_score?: number | null;
  raw_ocr_text?: string | null;
  location?: string | null;
  calibration_mm?: number | null;
  calibration_method?: string | null;
  created_at?: string | null;
  completed_at?: string | null;
  declarations?: Declaration[];
  violations?: Violation[];
  reports?: { id: string; file_url: string; format: string }[];
};

export type Rule = {
  code: string;
  title: string;
  legal_reference?: string;
  field_key?: string;
  check_type?: string;
  parameters?: Record<string, unknown>;
  severity: string;
  is_active: boolean;
};

export type DashboardSummary = {
  total_scans: number;
  completed: number;
  processing: number;
  avg_score: number;
  compliant: number;
  partial: number;
  non_compliant: number;
  compliance_rate: number;
  violation_count: number;
};
