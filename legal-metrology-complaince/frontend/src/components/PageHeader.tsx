import type { ReactNode } from "react";

export default function PageHeader({
  kicker,
  title,
  subtitle,
  actions,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {kicker && (
          <div className="text-[11px] uppercase tracking-[0.22em] text-tide-400 mb-1">{kicker}</div>
        )}
        <h1 className="font-display text-4xl md:text-[2.6rem] leading-none">{title}</h1>
        {subtitle && <p className="text-stone-400 mt-2 max-w-2xl">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
