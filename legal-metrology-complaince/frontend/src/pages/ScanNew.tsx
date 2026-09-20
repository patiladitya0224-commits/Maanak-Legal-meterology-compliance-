import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Upload } from "lucide-react";
import { api } from "../api";
import type { Scan } from "../types";
import { loadPrefs, savePrefs } from "../prefs";
import Pipeline from "../components/Pipeline";
import PageHeader from "../components/PageHeader";
import Crumbs from "../components/Crumbs";
import { useToast } from "../toast";

export default function ScanNew() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const push = useToast((s) => s.push);
  const inputRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const prefs = loadPrefs();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [location, setLocation] = useState(prefs.location);
  const [width, setWidth] = useState(prefs.packageWidthMm);
  const [imported, setImported] = useState(prefs.isImported);
  const [food, setFood] = useState(prefs.isFood);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState(-1);
  const samples = useQuery({
    queryKey: ["samples"],
    queryFn: () => api.samples() as Promise<{ file: string; url: string; title: string }[]>,
  });

  useEffect(() => {
    if (!busy) return;
    setStage(0);
    const timers = [1, 2, 3, 4].map((i) => setTimeout(() => setStage(i), i * 380));
    return () => timers.forEach(clearTimeout);
  }, [busy]);

  function pick(f: File, sample?: string) {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setSelectedSample(sample ?? null);
  }

  async function useSample(url: string, title: string, fileName: string) {
    const res = await fetch(url);
    const blob = await res.blob();
    pick(new File([blob], title.replace(/\s+/g, "-") + ".png", { type: "image/png" }), fileName);
    const lower = title.toLowerCase();
    setImported(lower.includes("imported"));
    if (lower.includes("missing") || lower.includes("fail") || lower.includes("non")) {
      /* keep officer context */
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError("");
    savePrefs({ location, packageWidthMm: width, isFood: food, isImported: imported });
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("location", location);
      form.append("package_width_mm", width);
      form.append("is_imported", String(imported));
      form.append("is_food", String(food));
      const scan = (await api.createScan(form)) as Scan;
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["scans"] }),
        qc.invalidateQueries({ queryKey: ["summary"] }),
        qc.invalidateQueries({ queryKey: ["products"] }),
      ]);
      push("Pipeline queued — opening dossier");
      navigate(`/app/scans/${scan.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setBusy(false);
      setStage(-1);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-4">
        <Crumbs items={[{ to: "/app", label: "Command" }, { label: "Inspect" }]} />
        <PageHeader
          kicker="Pipeline"
          title="New inspection"
          subtitle="Drop a principal display panel photo, use the camera, or run a seeded pack with known ground truth."
        />
        <Pipeline active={busy ? stage : -1} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) pick(f);
          }}
          className="glass w-full rounded-3xl min-h-[320px] grid place-items-center border-dashed border-2 border-brass-400/30 hover:border-brass-400/60 transition"
        >
          {preview ? (
            <img src={preview} alt="preview" className="max-h-[420px] rounded-2xl" />
          ) : (
            <div className="text-center p-8">
              <Upload className="mx-auto text-brass-400 mb-3" />
              <div className="font-medium">Drop a label photo</div>
              <div className="text-sm text-stone-400 mt-1">JPEG / PNG · principal display panel</div>
            </div>
          )}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])} />
        <input
          ref={camRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])}
        />
        <button type="button" onClick={() => camRef.current?.click()} className="btn-ghost inline-flex items-center gap-2">
          <Camera size={16} /> Use camera
        </button>
        <div>
          <div className="text-sm text-stone-400 mb-2">Or run a seeded pack (full pipeline, known ground truth)</div>
          <div className="grid sm:grid-cols-4 gap-3">
            {(samples.data || []).map((s) => (
              <button
                type="button"
                key={s.file}
                onClick={() => useSample(s.url, s.title, s.file)}
                className={`glass lift rounded-xl overflow-hidden text-left ${
                  selectedSample === s.file ? "ring-2 ring-brass-400" : ""
                }`}
              >
                <img src={s.url} alt="" className="h-28 w-full object-cover" />
                <div className="p-2 text-[11px] text-stone-300">{s.title}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <aside className="lg:col-span-2 space-y-4">
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="font-medium">Inspection context</div>
          <p className="text-xs text-stone-500">Defaults come from Settings and are saved when you run a scan.</p>
          <label className="block text-sm text-stone-400">
            Market / location
            <input
              className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </label>
          <label className="block text-sm text-stone-400">
            Package width (mm) — scale for font estimate
            <input
              className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={imported} onChange={(e) => setImported(e.target.checked)} />
            Imported commodity (country of origin required)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={food} onChange={(e) => setFood(e.target.checked)} />
            Food article (manufacturer address is advisory)
          </label>
          {error && <div className="text-rose-300 text-sm">{error}</div>}
          <button disabled={!file || busy} className="w-full rounded-xl bg-brass-400 text-ink-950 font-semibold py-3 disabled:opacity-40">
            {busy ? "Queuing pipeline…" : "Run compliance scan"}
          </button>
        </div>
        <div className="glass rounded-2xl p-5 text-sm text-stone-400 space-y-2">
          <div className="text-stone-200 font-medium">What happens next</div>
          <p>
            Evidence is stored, fields are classified, millimetre height is estimated from package width, then the
            configurable rule table scores the pack. You land on the dossier with live polling until the job completes.
          </p>
        </div>
      </aside>
    </form>
  );
}
