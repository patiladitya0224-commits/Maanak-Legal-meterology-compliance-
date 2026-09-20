import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function Crumbs({ items }: { items: { to?: string; label: string }[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1 text-[11px] uppercase tracking-[0.16em] text-stone-500 mb-3">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={12} className="text-stone-600" />}
          {item.to ? (
            <Link to={item.to} className="hover:text-brass-300">
              {item.label}
            </Link>
          ) : (
            <span className="text-stone-300">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
