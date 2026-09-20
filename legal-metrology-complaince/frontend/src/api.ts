import { useAuth } from "./authStore";

const API = "/api/v1";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = useAuth.getState().accessToken;
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API}${path}`, { ...init, headers });
  if (res.status === 401) {
    if (!path.startsWith("/auth/")) useAuth.getState().logout();
    throw new Error(path.startsWith("/auth/") ? "Invalid credentials" : "Session expired");
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === "string" ? detail : "Request failed");
  }
  if (res.headers.get("content-type")?.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  return undefined as T;
}

export const api = {
  login: (email: string, password: string) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (payload: object) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request("/auth/me"),
  summary: () => request("/dashboard/summary"),
  trends: () => request("/dashboard/trends"),
  topViolations: () => request("/dashboard/top-violations"),
  scans: (qs = "") => request(`/scans${qs}`),
  scan: (id: string) => request(`/scans/${id}`),
  scanStatus: (id: string) => request(`/scans/${id}/status`),
  createScan: (form: FormData) => request("/scans", { method: "POST", body: form }),
  rerunScan: (id: string, form: FormData) => request(`/scans/${id}/rerun`, { method: "POST", body: form }),
  products: (q = "") => request(`/products${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  product: (id: string) => request(`/products/${id}`),
  rules: () => request("/rules"),
  patchRule: (code: string, body: object) => request(`/rules/${code}`, { method: "PUT", body: JSON.stringify(body) }),
  reports: () => request("/reports"),
  generateReport: (scanId: string) => request(`/reports/${scanId}/generate`, { method: "POST" }),
  users: () => request("/users"),
  patchUser: (id: string, body: object) => request(`/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  samples: () => request("/samples"),
};

export async function downloadReport(id: string) {
  const token = useAuth.getState().accessToken;
  const res = await fetch(`/api/v1/reports/${id}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lmcs-report-${id.slice(0, 8)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
