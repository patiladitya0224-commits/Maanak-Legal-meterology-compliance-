import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { api } from "../api";
import type { Product, Scan } from "../types";
import { useAuth } from "../authStore";

const pages = [
  { label: "Command center", to: "/app", hint: "Dashboard" },
  { label: "New inspection", to: "/app/scan", hint: "Upload" },
  { label: "Repository", to: "/app/repository", hint: "Products" },
  { label: "Inspections", to: "/app/repository?tab=scans", hint: "Scans" },
  { label: "Reports", to: "/app/reports", hint: "PDF" },
  { label: "Rules", to: "/app/rules", hint: "Engine" },
  { label: "Settings", to: "/app/settings", hint: "Defaults" },
];

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const role = useAuth((s) => s.user?.role);
  const [q, setQ] = useState("");
  const products = useQuery({
    queryKey: ["products", ""],
    queryFn: () => api.products() as Promise<Product[]>,
    enabled: open,
  });
  const scans = useQuery({
    queryKey: ["scans"],
    queryFn: () => api.scans() as Promise<Scan[]>,
    enabled: open,
  });

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const needle = q.trim().toLowerCase();
  const routes = useMemo(() => {
    const extra = role === "admin" ? [{ label: "Officers", to: "/app/users", hint: "Admin" }] : [];
    return [...pages, ...extra].filter(
      (p) => !needle || p.label.toLowerCase().includes(needle) || p.hint.toLowerCase().includes(needle)
    );
  }, [needle, role]);

  const packs = useMemo(
    () =>
      (products.data || [])
        .filter((p) => !needle || `${p.name} ${p.brand} ${p.barcode}`.toLowerCase().includes(needle))
        .slice(0, 6),
    [products.data, needle]
  );
  const recent = useMemo(
    () =>
      (scans.data || [])
        .filter((s) => !needle || `${s.product?.name} ${s.location}`.toLowerCase().includes(needle))
        .slice(0, 6),
    [scans.data, needle]
  );

  function go(to: string) {
    navigate(to);
    onClose();
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    go(`/app/repository?q=${encodeURIComponent(q.trim())}`);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-start pt-[12vh] px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl glass rounded-2xl overflow-hidden shadow-glow"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={onSubmit} className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Search size={16} className="text-brass-300" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Jump to a pack, scan, or page…"
            className="bg-transparent flex-1 text-sm text-white placeholder:text-stone-500"
          />
          <kbd className="text-[10px] text-stone-500 border border-white/10 rounded px-1.5 py-0.5">esc</kbd>
        </form>
        <div className="max-h-[52vh] overflow-auto p-2 space-y-3">
          <Section title="Pages">
            {routes.map((p) => (
              <Row key={p.to} label={p.label} hint={p.hint} onClick={() => go(p.to)} />
            ))}
          </Section>
          {packs.length > 0 && (
            <Section title="Products">
              {packs.map((p) => (
                <Row key={p.id} label={p.name || "Pack"} hint={p.brand || ""} onClick={() => go(`/app/products/${p.id}`)} />
              ))}
            </Section>
          )}
          {recent.length > 0 && (
            <Section title="Inspections">
              {recent.map((s) => (
                <Row
                  key={s.id}
                  label={s.product?.name || "Unlinked pack"}
                  hint={s.location || ""}
                  onClick={() => go(`/app/scans/${s.id}`)}
                />
              ))}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-3 pb-1 text-[10px] uppercase tracking-[0.18em] text-stone-500">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, hint, onClick }: { label: string; hint: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex justify-between gap-3 w-full text-left rounded-xl px-3 py-2.5 text-sm hover:bg-white/5"
    >
      <span className="truncate">{label}</span>
      <span className="text-[11px] text-stone-500 shrink-0">{hint}</span>
    </button>
  );
}
