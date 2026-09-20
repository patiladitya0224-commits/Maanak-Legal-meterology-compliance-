import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadPrefs, savePrefs, type ScanPrefs } from "../prefs";
import PageHeader from "../components/PageHeader";
import Crumbs from "../components/Crumbs";
import { useToast } from "../toast";

export default function Settings() {
  const navigate = useNavigate();
  const push = useToast((s) => s.push);
  const [prefs, setPrefs] = useState<ScanPrefs>(loadPrefs);
  const [saved, setSaved] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    savePrefs(prefs);
    setSaved(true);
    push("Field defaults saved");
    setTimeout(() => setSaved(false), 1600);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-xl">
      <Crumbs items={[{ to: "/app", label: "Command" }, { label: "Settings" }]} />
      <PageHeader
        kicker="Field defaults"
        title="Inspection settings"
        subtitle="These values pre-fill New inspection. Font height uses package width as the millimetre scale — estimates only."
      />
      <div className="glass rounded-3xl p-6 space-y-4">
        <label className="block text-sm text-stone-400">
          Default market / location
          <input
            className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white"
            value={prefs.location}
            onChange={(e) => setPrefs({ ...prefs, location: e.target.value })}
          />
        </label>
        <label className="block text-sm text-stone-400">
          Default package width (mm)
          <input
            className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white"
            value={prefs.packageWidthMm}
            onChange={(e) => setPrefs({ ...prefs, packageWidthMm: e.target.value })}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={prefs.isFood}
            onChange={(e) => setPrefs({ ...prefs, isFood: e.target.checked })}
          />
          Treat packs as food articles by default
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={prefs.isImported}
            onChange={(e) => setPrefs({ ...prefs, isImported: e.target.checked })}
          />
          Treat packs as imported by default
        </label>
        <button className="btn-gold">{saved ? "Saved" : "Save defaults"}</button>
      </div>
      <button type="button" onClick={() => navigate("/app/scan")} className="text-sm text-brass-300">
        Continue to a new inspection →
      </button>
    </form>
  );
}
