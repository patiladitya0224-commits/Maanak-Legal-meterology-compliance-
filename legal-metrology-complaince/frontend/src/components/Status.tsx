export function StatusPill({ status }: { status?: string | null }) {
  const map: Record<string, string> = {
    compliant: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
    partial: "bg-amber-400/15 text-amber-200 border-amber-400/30",
    non_compliant: "bg-rose-400/15 text-rose-300 border-rose-400/30",
    processing: "bg-sky-400/15 text-sky-300 border-sky-400/30",
    failed: "bg-stone-400/15 text-stone-300 border-white/20",
    minor: "bg-sky-400/15 text-sky-300 border-sky-400/30",
    major: "bg-amber-400/15 text-amber-200 border-amber-400/30",
    critical: "bg-rose-400/15 text-rose-300 border-rose-400/30",
  };
  const cls = map[status || ""] || map.failed;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-wide ${cls}`}>
      {(status || "unknown").replaceAll("_", " ")}
    </span>
  );
}

export function ScoreRing({ score }: { score?: number | null }) {
  const s = Math.round(score ?? 0);
  const color = s >= 85 ? "#2dd4bf" : s >= 60 ? "#e0b15b" : "#fb7185";
  return (
    <div className="relative h-28 w-28">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={`${(s / 100) * 251} 251`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-display text-2xl leading-none">{s}</div>
          <div className="text-[10px] uppercase tracking-widest text-stone-400">score</div>
        </div>
      </div>
    </div>
  );
}
