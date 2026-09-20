import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";
import { api } from "../api";
import type { DashboardSummary, Scan } from "../types";
import { ScoreRing, StatusPill } from "../components/Status";
import PageHeader from "../components/PageHeader";
import Empty from "../components/Empty";
import Crumbs from "../components/Crumbs";
import { fmtDay } from "../utils/formatters";

const pieColors = ["#2dd4bf", "#e0b15b", "#fb7185"];
const pieKeys = ["compliant", "partial", "non_compliant"] as const;

export default function Dashboard() {
  const navigate = useNavigate();
  const summary = useQuery({ queryKey: ["summary"], queryFn: () => api.summary() as Promise<DashboardSummary> });
  const trends = useQuery({ queryKey: ["trends"], queryFn: () => api.trends() as Promise<{ date: string; violations: number; scans: number }[]> });
  const top = useQuery({
    queryKey: ["top"],
    queryFn: () => api.topViolations() as Promise<{ rule_code: string; title?: string; count: number }[]>,
  });
  const scans = useQuery({ queryKey: ["scans"], queryFn: () => api.scans() as Promise<Scan[]> });
  const s = summary.data;
  const mix = [
    { name: "Compliant", value: s?.compliant ?? 0, key: "compliant" },
    { name: "Partial", value: s?.partial ?? 0, key: "partial" },
    { name: "Non-compliant", value: s?.non_compliant ?? 0, key: "non_compliant" },
  ];

  return (
    <div className="space-y-8">
      <Crumbs items={[{ label: "Command" }]} />
      <PageHeader
        kicker="DoCA · Legal Metrology"
        title="Command center"
        subtitle="Live picture of seeded and live inspections. Every tile, chart, and row opens the matching evidence."
        actions={s ? <ScoreRing score={s.avg_score} /> : <div className="shimmer h-28 w-28 rounded-full" />}
      />

      {!!s?.processing && (
        <Link
          to="/app/repository?tab=scans"
          className="block rounded-2xl border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sm text-sky-100"
        >
          {s.processing} inspection{s.processing === 1 ? "" : "s"} still in the pipeline — open the live feed.
        </Link>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { k: "Inspections", v: s?.total_scans ?? "—", d: "All label captures", to: "/app/repository?tab=scans" },
          { k: "Compliance rate", v: s ? `${s.compliance_rate}%` : "—", d: "Fully clean packs", to: "/app/repository?compliance=compliant" },
          { k: "Non-compliant", v: s?.non_compliant ?? "—", d: "Major / critical flags", to: "/app/repository?compliance=non_compliant" },
          { k: "Rule hits", v: s?.violation_count ?? "—", d: "Open rule table", to: "/app/rules" },
        ].map((c) => (
          <Link key={c.k} to={c.to} className="glass lift rounded-2xl p-5 block">
            <div className="text-xs uppercase tracking-[0.18em] text-stone-400">{c.k}</div>
            <div className="font-display text-3xl mt-2">{c.v}</div>
            <div className="text-sm text-stone-500 mt-1">{c.d}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="glass rounded-2xl p-5 lg:col-span-3">
          <div className="flex justify-between text-sm text-stone-400 mb-4">
            <span>Violations vs inspections</span>
            <Link to="/app/repository?tab=scans" className="text-brass-300 text-xs">
              All inspections
            </Link>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends.data || []}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e0b15b" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#e0b15b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" stroke="#a8a29e" fontSize={11} />
                <YAxis stroke="#a8a29e" fontSize={11} />
                <Tooltip contentStyle={{ background: "#0c1220", border: "1px solid rgba(255,255,255,0.1)" }} />
                <Area type="monotone" dataKey="violations" stroke="#e0b15b" fill="url(#g)" />
                <Area type="monotone" dataKey="scans" stroke="#2dd4bf" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="text-sm text-stone-400 mb-2">Outcome mix · click a slice</div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mix}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={42}
                  outerRadius={68}
                  paddingAngle={3}
                  onClick={(_, i) => navigate(`/app/repository?compliance=${pieKeys[i]}`)}
                  cursor="pointer"
                >
                  {mix.map((_, i) => (
                    <Cell key={i} fill={pieColors[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#0c1220", border: "1px solid rgba(255,255,255,0.1)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-[11px] text-stone-500 px-1">
            <span className="text-tide-400">Compliant {s?.compliant ?? 0}</span>
            <span className="text-brass-300">Partial {s?.partial ?? 0}</span>
            <span className="text-rose-300">Fail {s?.non_compliant ?? 0}</span>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex justify-between text-sm text-stone-400 mb-4">
          <span>Top rule codes · click a bar</span>
          <Link to="/app/rules" className="text-brass-300 text-xs">
            Tune thresholds
          </Link>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top.data || []} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis type="number" stroke="#a8a29e" fontSize={11} />
              <YAxis type="category" dataKey="rule_code" stroke="#a8a29e" fontSize={10} width={118} />
              <Tooltip
                contentStyle={{ background: "#0c1220", border: "1px solid rgba(255,255,255,0.1)" }}
                formatter={(value, _n, item) => [value, (item?.payload as { title?: string })?.title || "hits"]}
              />
              <Bar
                dataKey="count"
                fill="#2dd4bf"
                radius={4}
                cursor="pointer"
                onClick={(d) => {
                  const code = (d as { rule_code?: string }).rule_code;
                  if (code) navigate(`/app/rules#${code}`);
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex justify-between">
          <span className="font-medium">Recent inspections</span>
          <Link to="/app/repository?tab=scans" className="text-sm text-brass-300">
            Open repository
          </Link>
        </div>
        {(scans.data || []).length === 0 && (
          <div className="p-4">
            <Empty
              title="No inspections yet"
              body="Run a seeded pack or upload a label to populate this feed."
              action={
                <Link to="/app/scan" className="text-sm text-brass-300">
                  Start an inspection
                </Link>
              }
            />
          </div>
        )}
        <div className="divide-y divide-white/5">
          {(scans.data || []).slice(0, 8).map((scan) => (
            <Link key={scan.id} to={`/app/scans/${scan.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-white/5">
              <img src={scan.image_url} alt="" className="h-12 w-10 object-cover rounded-md border border-white/10" />
              <div className="flex-1 min-w-0">
                <div className="truncate">{scan.product?.name || "Unlinked pack"}</div>
                <div className="text-xs text-stone-500">
                  {scan.location} · {fmtDay(scan.created_at)}
                </div>
              </div>
              <StatusPill status={scan.overall_compliance || scan.status} />
              <div className="font-display w-10 text-right">{Math.round(scan.compliance_score ?? 0)}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
