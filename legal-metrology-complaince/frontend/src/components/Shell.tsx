import { FormEvent, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  ScanLine,
  PackageSearch,
  FileStack,
  Settings2,
  Users,
  LogOut,
  ShieldCheck,
  SlidersHorizontal,
  Search,
} from "lucide-react";
import { useAuth } from "../authStore";
import { api } from "../api";
import type { Scan } from "../types";
import CommandPalette from "./CommandPalette";

const links = [
  { to: "/app", label: "Command", icon: LayoutDashboard, end: true },
  { to: "/app/scan", label: "Inspect", icon: ScanLine, hideFor: ["viewer"] },
  { to: "/app/repository", label: "Repository", icon: PackageSearch },
  { to: "/app/reports", label: "Reports", icon: FileStack },
  { to: "/app/rules", label: "Rules", icon: Settings2 },
  { to: "/app/users", label: "Officers", icon: Users, roles: ["admin"] },
  { to: "/app/settings", label: "Settings", icon: SlidersHorizontal },
];

function visible(userRole: string | undefined, l: (typeof links)[number]) {
  if (l.roles && (!userRole || !l.roles.includes(userRole))) return false;
  if (l.hideFor && userRole && l.hideFor.includes(userRole)) return false;
  return true;
}

export default function Shell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const shown = links.filter((l) => visible(user?.role, l));
  const canScan = user?.role !== "viewer";
  const [q, setQ] = useState("");
  const [palette, setPalette] = useState(false);

  const scans = useQuery({
    queryKey: ["scans"],
    queryFn: () => api.scans() as Promise<Scan[]>,
    refetchInterval: 5000,
  });
  const processing = (scans.data || []).filter((s) => s.status === "processing").length;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (location.pathname.startsWith("/app/repository")) {
      setQ(params.get("q") || "");
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    navigate(`/app/repository?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <div className="min-h-screen flex">
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
      <aside className="hidden md:flex w-[268px] flex-col border-r border-white/10 bg-ink-900/85 backdrop-blur-xl">
        <div className="px-5 pt-6 pb-4">
          <NavLink to="/app" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brass-400/20 border border-brass-400/40 grid place-items-center">
              <ShieldCheck className="text-brass-400" size={20} />
            </div>
            <div>
              <div className="font-display text-lg leading-none">Maanak</div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-stone-400 mt-1">DoCA · SIH 26034</div>
            </div>
          </NavLink>
          <div className="tricolor h-[3px] rounded-full mt-5 opacity-80" />
        </div>
        <nav className="px-3 flex-1 space-y-1">
          {shown.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  isActive
                    ? "bg-brass-400/15 text-brass-300 nav-active"
                    : "text-stone-400 hover:bg-white/5 hover:text-stone-100"
                }`
              }
            >
              <l.icon size={16} />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 space-y-3">
          {processing > 0 && (
            <NavLink
              to="/app/repository?tab=scans"
              className="block rounded-2xl border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-xs text-sky-200"
            >
              {processing} pipeline{processing === 1 ? "" : "s"} running
            </NavLink>
          )}
          <div className="glass rounded-2xl p-3">
            <div className="text-sm font-medium">{user?.name}</div>
            <div className="text-[11px] text-stone-400 capitalize">
              {user?.role} · {user?.jurisdiction || "—"}
            </div>
            <button
              className="mt-3 flex items-center gap-2 text-xs text-rose-300 hover:text-rose-200"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </aside>
      <div className="flex-1 min-w-0 pb-20 md:pb-0">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-ink-950/75 backdrop-blur-xl">
          <div className="px-4 md:px-8 h-16 flex items-center justify-between gap-3">
            <div className="min-w-0 hidden sm:block">
              <div className="text-[11px] uppercase tracking-[0.2em] text-tide-400 truncate">
                Legal Metrology · Packaged Commodities
              </div>
              <div className="text-xs md:text-sm text-stone-400 truncate">
                System-flagged results require officer verification
              </div>
            </div>
            <form onSubmit={onSearch} className="flex-1 max-w-md">
              <label className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1.5">
                <Search size={14} className="text-stone-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onClick={() => setPalette(true)}
                  placeholder="Search packs… or press Ctrl+K"
                  className="bg-transparent w-full text-sm text-white placeholder:text-stone-500"
                />
              </label>
            </form>
            {canScan && (
              <NavLink to="/app/scan" className="btn-gold shrink-0">
                New scan
              </NavLink>
            )}
          </div>
        </header>
        <main className="px-4 md:px-8 py-8">
          <Outlet />
        </main>
      </div>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-white/10 bg-ink-950/90 backdrop-blur-xl">
        <div className={`grid ${shown.length >= 5 ? "grid-cols-5" : "grid-cols-4"}`}>
          {shown.slice(0, 5).map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[10px] ${isActive ? "text-brass-300" : "text-stone-500"}`
              }
            >
              <l.icon size={16} />
              {l.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
