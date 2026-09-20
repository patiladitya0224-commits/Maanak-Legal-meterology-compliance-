import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, downloadReport } from "../api";
import { StatusPill } from "../components/Status";
import PageHeader from "../components/PageHeader";
import Empty from "../components/Empty";
import Crumbs from "../components/Crumbs";
import { fmtDate } from "../utils/formatters";
import { useToast } from "../toast";

type Row = {
  id: string;
  scan_id: string;
  product?: string | null;
  score?: number | null;
  status?: string | null;
  created_at?: string | null;
};

export default function Reports() {
  const push = useToast((s) => s.push);
  const q = useQuery({ queryKey: ["reports"], queryFn: () => api.reports() as Promise<Row[]> });
  return (
    <div className="space-y-6">
      <Crumbs items={[{ to: "/app", label: "Command" }, { label: "Reports" }]} />
      <PageHeader
        kicker="Exports"
        title="Compliance briefs"
        subtitle="PDFs generated from a dossier. Open the scan to re-read the pipeline, or download again."
      />
      {(q.data || []).length === 0 && (
        <Empty
          title="No briefs yet"
          body="Open any completed inspection and tap Download PDF brief."
          action={
            <Link to="/app/repository?tab=scans" className="text-sm text-brass-300">
              Browse inspections
            </Link>
          }
        />
      )}
      <div className="glass rounded-2xl divide-y divide-white/5">
        {(q.data || []).map((r) => (
          <div key={r.id} className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1 min-w-0">
              <Link to={`/app/scans/${r.scan_id}`} className="hover:text-brass-300">
                {r.product || r.scan_id.slice(0, 8)}
              </Link>
              <div className="text-xs text-stone-500">{fmtDate(r.created_at)}</div>
            </div>
            <StatusPill status={r.status} />
            <div className="font-display w-10 text-right">{Math.round(r.score ?? 0)}</div>
            <button
              className="text-sm text-brass-300"
              onClick={async () => {
                await downloadReport(r.id);
                push("Download started");
              }}
            >
              Download PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
