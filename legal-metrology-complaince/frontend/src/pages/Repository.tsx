import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import type { Product, Scan } from "../types";
import { StatusPill } from "../components/Status";
import PageHeader from "../components/PageHeader";
import Empty from "../components/Empty";
import Crumbs from "../components/Crumbs";
import { useDebounce } from "../hooks/useDebounce";
import { fmtDay } from "../utils/formatters";

export default function Repository() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const dq = useDebounce(q);
  const filter = params.get("compliance") || "";
  const tab = params.get("tab") === "scans" ? "scans" : "products";
  const products = useQuery({ queryKey: ["products", dq], queryFn: () => api.products(dq) as Promise<Product[]> });
  const scans = useQuery({
    queryKey: ["scans", filter],
    queryFn: () => api.scans(filter ? `?compliance=${encodeURIComponent(filter)}` : "") as Promise<Scan[]>,
  });

  useEffect(() => {
    const fromUrl = params.get("q") || "";
    setQ((cur) => (cur === fromUrl ? cur : fromUrl));
  }, [params]);

  const rows = useMemo(() => {
    const list = products.data || [];
    if (!filter) return list;
    return list.filter((p) => p.latest_compliance === filter);
  }, [products.data, filter]);

  const scanRows = useMemo(() => {
    const list = scans.data || [];
    if (!dq) return list;
    const needle = dq.toLowerCase();
    return list.filter(
      (s) =>
        (s.product?.name || "").toLowerCase().includes(needle) ||
        (s.product?.brand || "").toLowerCase().includes(needle) ||
        (s.location || "").toLowerCase().includes(needle)
    );
  }, [scans.data, dq]);

  function setTab(next: "products" | "scans") {
    const n = new URLSearchParams(params);
    if (next === "products") n.delete("tab");
    else n.set("tab", "scans");
    setParams(n);
  }

  function setFilter(c: string) {
    const next = new URLSearchParams(params);
    if (!c) next.delete("compliance");
    else next.set("compliance", c);
    setParams(next);
  }

  return (
    <div className="space-y-6">
      <Crumbs items={[{ to: "/app", label: "Command" }, { label: "Repository" }]} />
      <PageHeader
        kicker="Evidence store"
        title="Product repository"
        subtitle="Search commodities or open every inspection. Dashboard tiles land here with the matching filter."
        actions={
          <Link to="/app/scan" className="btn-gold">
            New scan
          </Link>
        }
      />
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex rounded-full border border-white/10 p-1">
          {(["products", "scans"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-xs capitalize ${tab === t ? "bg-brass-400/20 text-brass-200" : "text-stone-400"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            const n = new URLSearchParams(params);
            if (e.target.value) n.set("q", e.target.value);
            else n.delete("q");
            setParams(n, { replace: true });
          }}
          placeholder="Name, brand, barcode, market…"
          className="rounded-full bg-white/5 border border-white/10 px-4 py-2 w-72"
        />
        {["", "compliant", "partial", "non_compliant"].map((c) => (
          <button
            key={c || "all"}
            type="button"
            onClick={() => setFilter(c)}
            className={`rounded-full px-3 py-1.5 text-xs border ${
              filter === c ? "border-brass-400/50 bg-brass-400/15 text-brass-200" : "border-white/10 text-stone-400"
            }`}
          >
            {c ? c.replace("_", " ") : "All"}
          </button>
        ))}
      </div>

      {tab === "products" ? (
        <>
          {rows.length === 0 && (
            <Empty title="No matching products" body="Run an inspection or clear the filter to see the evidence store." />
          )}
          <div className="grid md:grid-cols-2 gap-4">
            {rows.map((p) => (
              <Link key={p.id} to={`/app/products/${p.id}`} className="glass lift rounded-2xl overflow-hidden flex">
                {p.latest_image_url && (
                  <img src={p.latest_image_url} alt="" className="w-24 object-cover border-r border-white/10" />
                )}
                <div className="p-5 flex-1">
                  <div className="flex justify-between gap-3">
                    <div>
                      <div className="font-display text-2xl">{p.name}</div>
                      <div className="text-sm text-stone-400">
                        {p.brand} · {p.category} · {p.barcode}
                      </div>
                    </div>
                    <StatusPill status={p.latest_compliance} />
                  </div>
                  <div className="mt-4 text-sm text-stone-500">
                    {p.scan_count} scan{p.scan_count === 1 ? "" : "s"} · score {Math.round(p.latest_score ?? 0)}
                    {p.latest_location ? ` · ${p.latest_location}` : ""}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <>
          {scanRows.length === 0 && (
            <Empty title="No matching inspections" body="Upload a pack or loosen the search." />
          )}
          <div className="glass rounded-2xl divide-y divide-white/5">
            {scanRows.map((scan) => (
              <Link key={scan.id} to={`/app/scans/${scan.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-white/5">
                <img src={scan.image_url} alt="" className="h-14 w-11 object-cover rounded-md border border-white/10" />
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
        </>
      )}
    </div>
  );
}
