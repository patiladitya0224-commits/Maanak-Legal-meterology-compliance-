import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { Rule } from "../types";
import PageHeader from "../components/PageHeader";
import { StatusPill } from "../components/Status";
import Crumbs from "../components/Crumbs";
import { useAuth } from "../authStore";
import { useToast } from "../toast";

export default function Rules() {
  const qc = useQueryClient();
  const role = useAuth((s) => s.user?.role);
  const canEdit = role === "admin";
  const push = useToast((s) => s.push);
  const loc = useLocation();
  const focus = loc.hash.replace("#", "");
  const q = useQuery({ queryKey: ["rules"], queryFn: () => api.rules() as Promise<Rule[]> });
  const mut = useMutation({
    mutationFn: ({ code, body }: { code: string; body: object }) => api.patchRule(code, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rules"] });
      push("Rule updated — next scan will use it");
    },
  });

  useEffect(() => {
    const code = loc.hash.replace("#", "");
    if (!code) return;
    document.getElementById(code)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [q.data, loc.hash]);

  return (
    <div className="space-y-6">
      <Crumbs items={[{ to: "/app", label: "Command" }, { label: "Rules" }]} />
      <PageHeader
        kicker="Rule engine"
        title="Legal Metrology checks"
        subtitle={
          canEdit
            ? "Thresholds live in the database. Changes apply to the next inspection — verify against the current gazette."
            : "Read-only view of the starter Rule 6–9 table. Ask an admin to change thresholds."
        }
      />
      <div className="space-y-3">
        {(q.data || []).map((rule) => (
          <div
            id={rule.code}
            key={rule.code}
            className={`glass rounded-2xl p-5 flex flex-wrap items-center gap-4 scroll-mt-24 ${
              focus === rule.code ? "ring-2 ring-brass-400/50" : ""
            }`}
          >
            <div className="flex-1 min-w-[220px]">
              <div className="text-xs text-brass-300">
                {rule.code} · {rule.legal_reference}
              </div>
              <div className="font-medium mt-1">{rule.title}</div>
              <div className="text-xs text-stone-500 mt-1">
                {rule.check_type} · {rule.field_key}
              </div>
            </div>
            <StatusPill status={rule.severity} />
            <label className="text-sm flex items-center gap-2">
              <input
                type="checkbox"
                disabled={!canEdit}
                checked={rule.is_active}
                onChange={(e) => mut.mutate({ code: rule.code, body: { is_active: e.target.checked } })}
              />
              Active
            </label>
            {rule.check_type === "font_size" && (
              <label className="text-sm text-stone-400">
                min mm
                <input
                  type="number"
                  disabled={!canEdit}
                  defaultValue={Number(rule.parameters?.min_height_mm ?? 4)}
                  className="ml-2 w-16 rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-white disabled:opacity-50"
                  onBlur={(e) =>
                    canEdit &&
                    mut.mutate({
                      code: rule.code,
                      body: { parameters: { ...rule.parameters, min_height_mm: Number(e.target.value) } },
                    })
                  }
                />
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
