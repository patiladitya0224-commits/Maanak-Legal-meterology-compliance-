export function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function fmtDay(iso?: string | null) {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

export function severityClass(severity?: string) {
  if (severity === "critical") return "text-rose-300";
  if (severity === "major") return "text-amber-300";
  return "text-sky-300";
}
