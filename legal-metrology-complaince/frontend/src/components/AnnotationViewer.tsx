import type { Declaration, Violation } from "../types";

export default function AnnotationViewer({
  src,
  declarations,
  violations,
  active,
  onSelect,
}: {
  src: string;
  declarations: Declaration[];
  violations?: Violation[];
  active?: string | null;
  onSelect?: (key: string) => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-ink-900">
      <img src={src} alt="Principal display panel" className="w-full block" />
      {declarations
        .filter((d) => d.bounding_box)
        .map((d) => {
          const b = d.bounding_box!;
          const flagged = violations?.some((v) => v.field_key === d.field_key && v.severity !== "minor");
          const ok = d.is_present && !flagged;
          const on = active === d.field_key;
          return (
            <button
              type="button"
              key={d.field_key}
              onClick={() => onSelect?.(d.field_key)}
              className={`absolute border-2 rounded-sm text-left transition ${
                ok ? "border-emerald-400" : "border-rose-400"
              } ${on ? "bg-white/10 ring-2 ring-brass-400/70" : "bg-transparent"}`}
              style={{
                left: `${b.x * 100}%`,
                top: `${b.y * 100}%`,
                width: `${Math.max(b.w * 100, 4)}%`,
                height: `${Math.max(b.h * 100, 2.5)}%`,
              }}
              title={d.field_label}
            >
              <span
                className={`absolute -top-5 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wide ${
                  ok ? "bg-emerald-500/90 text-ink-950" : "bg-rose-500/90 text-white"
                }`}
              >
                {d.field_label}
              </span>
            </button>
          );
        })}
    </div>
  );
}
