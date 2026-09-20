import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import type { Product } from "../types";
import { ScoreRing, StatusPill } from "../components/Status";
import PageHeader from "../components/PageHeader";
import Crumbs from "../components/Crumbs";
import Empty from "../components/Empty";
import { fmtDate } from "../utils/formatters";

export default function ProductDetail() {
  const { id } = useParams();
  const q = useQuery({ queryKey: ["product", id], queryFn: () => api.product(id!) as Promise<Product> });
  if (q.isLoading) return <div className="shimmer h-40 rounded-3xl" />;
  if (!q.data) return <div className="text-rose-300">Product not found.</div>;
  const p = q.data;
  return (
    <div className="space-y-6">
      <Crumbs
        items={[
          { to: "/app", label: "Command" },
          { to: "/app/repository", label: "Repository" },
          { label: p.name || "Pack" },
        ]}
      />
      <PageHeader
        kicker={p.barcode ? `GTIN ${p.barcode}` : "Commodity"}
        title={p.name || "Unnamed pack"}
        subtitle={`${p.brand || "—"} · ${p.category || "uncategorised"}`}
        actions={
          <div className="flex items-center gap-4">
            <ScoreRing score={p.scans?.[0]?.compliance_score} />
            <Link to="/app/scan" className="btn-gold">
              Scan again
            </Link>
          </div>
        }
      />
      {(p.scans || []).length === 0 && (
        <Empty title="No inspections yet" body="This commodity has no stored scans." />
      )}
      <div className="space-y-3">
        {(p.scans || []).map((s) => (
          <Link key={s.id} to={`/app/scans/${s.id}`} className="glass lift flex items-center gap-4 rounded-2xl p-4">
            <img src={s.image_url} className="h-16 w-12 object-cover rounded-lg" alt="" />
            <div className="flex-1">
              <div>{s.location || "Unknown market"}</div>
              <div className="text-xs text-stone-500">{fmtDate(s.created_at)}</div>
            </div>
            <StatusPill status={s.overall_compliance || s.status} />
            <div className="font-display w-10 text-right">{Math.round(s.compliance_score ?? 0)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
