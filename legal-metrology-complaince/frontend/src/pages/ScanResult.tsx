import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, downloadReport } from "../api";
import type { Scan } from "../types";
import { ScoreRing, StatusPill } from "../components/Status";
import Pipeline from "../components/Pipeline";
import AnnotationViewer from "../components/AnnotationViewer";
import Crumbs from "../components/Crumbs";
import { fmtDate, severityClass } from "../utils/formatters";
import { useAuth } from "../authStore";
import { useToast } from "../toast";
import { loadPrefs } from "../prefs";

export default function ScanResult() {
  const { id } = useParams();
  const qc = useQueryClient();
  const role = useAuth((s) => s.user?.role);
  const push = useToast((s) => s.push);
  const [showOcr, setShowOcr] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const q = useQuery({
    queryKey: ["scan", id],
    queryFn: () => api.scan(id!) as Promise<Scan>,
    refetchInterval: (query) => (query.state.data?.status === "processing" ? 800 : false),
  });
  const gen = useMutation({
    mutationFn: async () => {
      const rec = (await api.generateReport(id!)) as { id: string };
      await downloadReport(rec.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scan", id] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      push("PDF brief downloaded");
    },
  });
  const rerun = useMutation({
    mutationFn: async () => {
      const prefs = loadPrefs();
      const form = new FormData();
      form.append("package_width_mm", prefs.packageWidthMm);
      form.append("is_imported", String(prefs.isImported));
      form.append("is_food", String(prefs.isFood));
      return api.rerunScan(id!, form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scan", id] });
      push("Pipeline queued again");
    },
  });

  useEffect(() => {
    if (q.data?.status === "completed" || q.data?.status === "failed") {
      qc.invalidateQueries({ queryKey: ["summary"] });
      qc.invalidateQueries({ queryKey: ["scans"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["trends"] });
      qc.invalidateQueries({ queryKey: ["top"] });
    }
  }, [q.data?.status, qc]);

  const processing = q.data?.status === "processing";
  const stage = useMemo(() => {
    if (!processing) return 4;
    const started = q.data?.created_at ? Date.now() - new Date(q.data.created_at).getTime() : 0;
    return Math.min(3, Math.floor(started / 700));
  }, [processing, q.data?.created_at, q.dataUpdatedAt]);

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <div className="shimmer h-10 w-64 rounded-full" />
        <div className="shimmer h-72 rounded-3xl" />
      </div>
    );
  }
  if (q.error || !q.data) return <div className="text-rose-300">Could not load this scan.</div>;
  const scan = q.data;
  const canAct = role !== "viewer";
  const declared = (scan.declarations || []).filter((d) => d.is_present).length;
  const total = (scan.declarations || []).length;

  return (
    <div className="space-y-6">
      <Crumbs
        items={[
          { to: "/app", label: "Command" },
          { to: "/app/repository?tab=scans", label: "Inspections" },
          { label: scan.product?.name || "Dossier" },
        ]}
      />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-tide-400">Inspection dossier</div>
          <h1 className="font-display text-4xl mt-1">{scan.product?.name || "Label scan"}</h1>
          <div className="flex flex-wrap gap-2 mt-2 items-center">
            <StatusPill status={processing ? "processing" : scan.overall_compliance || scan.status} />
            {total > 0 && (
              <span className="text-xs text-stone-400">
                {declared}/{total} declarations detected
              </span>
            )}
            <span className="text-sm text-stone-400">
              {scan.location} · {scan.calibration_method} · {fmtDate(scan.created_at)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ScoreRing score={scan.compliance_score} />
          <div className="flex flex-col gap-2">
            <button
              disabled={processing || gen.isPending}
              onClick={() => gen.mutate()}
              className="btn-gold disabled:opacity-40"
            >
              {gen.isPending ? "Rendering…" : "Download PDF brief"}
            </button>
            {canAct && (
              <button
                type="button"
                disabled={processing || rerun.isPending}
                onClick={() => rerun.mutate()}
                className="btn-ghost text-xs"
              >
                Re-run pipeline
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
        System-flagged — requires officer verification. Not a legal determination under the Legal Metrology Act, 2009.
      </div>

      {scan.status === "failed" && (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          Pipeline failed. {scan.raw_ocr_text || "Re-run from this dossier or capture a sharper label photo."}
        </div>
      )}

      <Pipeline active={processing ? stage : 4} />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass rounded-3xl p-4">
          <div className="flex justify-between text-[11px] text-stone-500 mb-2 px-1">
            <span>Tap a box to highlight the matching declaration</span>
            <span>Green = present · Rose = flagged</span>
          </div>
          <AnnotationViewer
            src={scan.image_url}
            declarations={scan.declarations || []}
            violations={scan.violations}
            active={activeField}
            onSelect={setActiveField}
          />
        </div>
        <div className="space-y-4">
          <div className="glass rounded-2xl divide-y divide-white/5">
            {(scan.declarations || []).map((d) => (
              <button
                type="button"
                key={d.field_key}
                onClick={() => setActiveField(d.field_key)}
                className={`p-4 flex gap-3 w-full text-left ${activeField === d.field_key ? "bg-brass-400/10" : ""}`}
              >
                <div className={`mt-1 h-2.5 w-2.5 rounded-full ${d.is_present ? "bg-tide-400" : "bg-rose-400"}`} />
                <div className="flex-1">
                  <div className="flex justify-between gap-3">
                    <span className="font-medium">{d.field_label}</span>
                    <span className="text-[11px] text-stone-500">{d.rule_reference}</span>
                  </div>
                  <div className="text-sm text-stone-300 mt-1">{d.extracted_value || "Not detected"}</div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    conf {(d.confidence * 100).toFixed(0)}%
                    {d.font_height_mm != null ? ` · ~${d.font_height_mm} mm (estimated)` : ""}
                    {d.is_valid_format === false ? " · format flag" : ""}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="glass rounded-2xl p-4">
            <div className="font-medium mb-2">Rule engine flags</div>
            {(scan.violations || []).length === 0 && !processing && (
              <div className="text-sm text-tide-400">No violations recorded.</div>
            )}
            <ul className="space-y-3">
              {(scan.violations || []).map((v) => (
                <li
                  key={(v.id || v.rule_code) + v.description}
                  className="text-sm cursor-pointer"
                  onClick={() => v.field_key && setActiveField(v.field_key)}
                >
                  <span className={`${severityClass(v.severity)} uppercase text-[11px] tracking-wide`}>{v.severity}</span>
                  <Link
                    to={`/app/rules#${v.rule_code}`}
                    className="text-stone-500 mx-2 hover:text-brass-300"
                    onClick={() => v.field_key && setActiveField(v.field_key)}
                  >
                    {v.rule_code}
                  </Link>
                  <span>{v.description}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-2xl p-4 flex flex-wrap gap-3 items-center text-sm">
            {scan.product_id && (
              <Link to={`/app/products/${scan.product_id}`} className="text-brass-300">
                Product history →
              </Link>
            )}
            <Link to="/app/reports" className="text-stone-400 hover:text-white">
              All briefs
            </Link>
            <Link to="/app/scan" className="text-stone-400 hover:text-white">
              New inspection
            </Link>
            <button type="button" className="text-stone-400 hover:text-white" onClick={() => setShowOcr((v) => !v)}>
              {showOcr ? "Hide OCR" : "Show raw OCR"}
            </button>
          </div>
          {showOcr && (
            <pre className="glass rounded-2xl p-4 text-xs text-stone-400 whitespace-pre-wrap max-h-56 overflow-auto">
              {scan.raw_ocr_text || "No OCR text stored."}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
