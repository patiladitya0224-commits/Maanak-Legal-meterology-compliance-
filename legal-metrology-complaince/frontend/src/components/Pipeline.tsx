const STEPS = [
  { n: "01", t: "Capture", d: "Label photo + market context" },
  { n: "02", t: "Preprocess", d: "Contrast, deskew-style enhance" },
  { n: "03", t: "OCR + fields", d: "Regex maps Rule 6 declarations" },
  { n: "04", t: "Rule engine", d: "Presence, format, font, origin" },
  { n: "05", t: "Officer brief", d: "Score, boxes, PDF dossier" },
];

export default function Pipeline({ active = -1 }: { active?: number }) {
  return (
    <div className="grid sm:grid-cols-5 gap-2">
      {STEPS.map((s, i) => {
        const on = active === i;
        const done = active > i;
        return (
          <div
            key={s.n}
            className={`rounded-2xl border px-3 py-3 transition ${
              on
                ? "border-brass-400/50 bg-brass-400/10"
                : done
                  ? "border-tide-400/30 bg-tide-400/5"
                  : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className={`font-display text-xl ${on ? "text-brass-300" : done ? "text-tide-400" : "text-stone-500"}`}>
              {s.n}
            </div>
            <div className="text-sm font-medium mt-1">{s.t}</div>
            <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">{s.d}</div>
          </div>
        );
      })}
    </div>
  );
}
