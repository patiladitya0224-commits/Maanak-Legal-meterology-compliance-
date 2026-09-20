import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, ScanLine, Scale, FileCheck2, Globe2, ArrowRight } from "lucide-react";
import { useAuth } from "../authStore";
import Pipeline from "../components/Pipeline";
import { useHydrated } from "../hooks/useHydrated";

const fields = ["Generic name", "Net quantity", "MRP", "Mfg / pack date", "Manufacturer", "Consumer care", "Country of origin"];

type Sample = { file: string; url: string; title: string };

export default function Landing() {
  const hydrated = useHydrated();
  const token = useAuth((s) => s.accessToken);
  const samples = useQuery({
    queryKey: ["public-samples"],
    queryFn: async () => {
      const res = await fetch("/api/v1/samples");
      if (!res.ok) return [] as Sample[];
      return (await res.json()) as Sample[];
    },
  });
  if (!hydrated) return <div className="min-h-screen bg-ink-950" />;
  if (token) return <Navigate to="/app" replace />;

  const hero = samples.data?.[0];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="aurora pointer-events-none absolute inset-0 opacity-80" />
      <div className="mesh pointer-events-none absolute inset-0 opacity-40" />
      <div className="grain pointer-events-none absolute inset-0 opacity-25 mix-blend-overlay" />
      <header className="relative flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-brass-400/15 border border-brass-400/40 grid place-items-center">
            <ShieldCheck className="text-brass-400" size={18} />
          </div>
          <div>
            <div className="font-display text-xl leading-none">Maanak</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500">SIH #26034</div>
          </div>
        </div>
        <div className="flex gap-3">
          <Link to="/login" className="text-sm text-stone-300 hover:text-white px-4 py-2">
            Sign in
          </Link>
          <Link to="/register" className="rounded-full bg-brass-400 text-ink-950 text-sm font-semibold px-4 py-2">
            Request access
          </Link>
        </div>
      </header>

      <main className="relative px-6 md:px-12 pt-6 pb-24">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-stone-300 mb-6">
              Ministry of Consumer Affairs · DoCA
            </div>
            <div className="tricolor h-1 w-40 rounded-full mb-8" />
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-5xl md:text-7xl leading-[0.95] max-w-4xl"
            >
              See every missing declaration
              <span className="text-brass-400"> before it reaches the shelf.</span>
            </motion.h1>
            <p className="mt-6 max-w-2xl text-stone-300 text-lg">
              Maanak. Officers photograph a pack; Maanak extracts Rule 6 declarations,
              estimates numeral height, and issues a <em>provisional</em> violation brief — never a legal verdict.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/login" className="rounded-full bg-tide-400 text-ink-950 px-6 py-3 font-semibold inline-flex items-center gap-2">
                Open command center <ArrowRight size={16} />
              </Link>
              <a href="#pipeline" className="rounded-full border border-white/15 px-6 py-3 text-sm hover:bg-white/5">
                View the pipeline
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {fields.map((f) => (
                <span key={f} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-stone-300">
                  {f}
                </span>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="lg:col-span-5"
          >
            <div className="glass rounded-3xl p-5 shadow-glow">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs uppercase tracking-[0.18em] text-stone-400">Live dossier</div>
                <span className="text-[11px] rounded-full border border-rose-400/30 bg-rose-400/10 text-rose-200 px-2 py-0.5">
                  System-flagged
                </span>
              </div>
              <div className="rounded-2xl bg-ink-900 h-52 relative overflow-hidden border border-white/10">
                {hero ? (
                  <img src={hero.url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
                ) : (
                  <div className="absolute inset-0 mesh opacity-30" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-ink-950/30" />
                <div className="absolute left-[10%] top-[22%] h-9 w-[52%] border-2 border-rose-400/90 rounded-sm pulse-ring" />
                <span className="absolute left-[10%] top-[12%] text-[9px] uppercase tracking-wide bg-rose-500 text-white px-1.5 py-0.5 rounded">
                  MRP review
                </span>
                <div className="absolute bottom-3 left-3 right-3 flex justify-between text-[11px] text-stone-200">
                  <span>{hero?.title || "Annotated PDP"}</span>
                  <span className="text-rose-200">Rule 6 · score 62</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  ["7", "fields"],
                  ["R6–9", "rules"],
                  ["PDF", "brief"],
                ].map(([v, k]) => (
                  <div key={k} className="rounded-xl bg-white/5 py-3">
                    <div className="font-display text-2xl">{v}</div>
                    <div className="text-[10px] uppercase tracking-widest text-stone-500">{k}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-4">
          {[
            { icon: ScanLine, t: "Field capture", d: "Drop a photo, use the camera, or run seeded packs with known ground truth." },
            { icon: Scale, t: "Rule 6–9 engine", d: "Data-driven checks — toggle rules and millimetre thresholds without redeploying." },
            { icon: FileCheck2, t: "Officer brief", d: "Annotated image, field checklist, PDF dossier, searchable repository." },
          ].map((c) => (
            <div key={c.t} className="glass lift rounded-2xl p-5">
              <c.icon className="text-brass-400 mb-3" size={20} />
              <div className="font-medium">{c.t}</div>
              <p className="text-sm text-stone-400 mt-1">{c.d}</p>
            </div>
          ))}
        </div>

        <section id="pipeline" className="mt-16">
          <div className="flex items-center gap-2 text-sm text-stone-400 mb-4">
            <Globe2 size={16} className="text-tide-400" />
            End-to-end inspection pipeline
          </div>
          <Pipeline />
        </section>

        <p className="mt-16 text-xs text-stone-500 max-w-3xl">
          Decision-support only. Automated flags must be verified by a Legal Metrology officer before enforcement. Rule
          references are starter mappings for SIH demo and must be checked against the current gazette.
        </p>
      </main>
    </div>
  );
}
