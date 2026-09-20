import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../authStore";
import type { User } from "../types";
import AuthFrame from "../components/AuthFrame";
import { useHydrated } from "../hooks/useHydrated";

const demos = [
  { label: "Admin", email: "admin@maanak.gov.in", password: "Admin@123" },
  { label: "Officer", email: "officer@maanak.gov.in", password: "Officer@123" },
  { label: "Auditor", email: "auditor@maanak.gov.in", password: "Auditor@123" },
];

export default function Login() {
  const hydrated = useHydrated();
  const token = useAuth((s) => s.accessToken);
  const navigate = useNavigate();
  const setSession = useAuth((s) => s.setSession);
  const [email, setEmail] = useState("officer@maanak.gov.in");
  const [password, setPassword] = useState("Officer@123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!hydrated) return <div className="min-h-screen bg-ink-950" />;
  if (token) return <Navigate to="/app" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = (await api.login(email, password)) as { access_token: string; user: User };
      setSession(data.access_token, data.user);
      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFrame
      title="Field intelligence for packaged commodities."
      blurb="Department of Consumer Affairs · Legal Metrology (Packaged Commodities) Rules, 2011. Seeded accounts are ready for judging."
      extra={
        <div className="glass rounded-2xl p-5 text-sm space-y-2">
          {demos.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => {
                setEmail(d.email);
                setPassword(d.password);
              }}
              className="w-full text-left rounded-xl px-3 py-2 hover:bg-white/5"
            >
              <span className="text-brass-300 w-16 inline-block">{d.label}</span>
              <span className="text-stone-400">{d.email}</span>
            </button>
          ))}
        </div>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <h2 className="font-display text-3xl">Sign in</h2>
        <p className="text-sm text-stone-400">Use a demo role or your registered officer account.</p>
        <div className="flex gap-2 lg:hidden">
          {demos.map((d) => (
            <button
              key={d.label}
              type="button"
              onClick={() => {
                setEmail(d.email);
                setPassword(d.password);
              }}
              className="flex-1 rounded-lg border border-white/10 text-[11px] py-1.5"
            >
              {d.label}
            </button>
          ))}
        </div>
        <label className="block text-sm text-stone-400">
          Email
          <input
            className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm text-stone-400">
          Password
          <input
            type="password"
            className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <div className="text-rose-300 text-sm">{error}</div>}
        <button disabled={busy} className="w-full rounded-xl bg-brass-400 text-ink-950 font-semibold py-2.5">
          {busy ? "Checking…" : "Enter command center"}
        </button>
        <Link to="/register" className="block text-center text-sm text-stone-400 hover:text-white">
          Create an officer account
        </Link>
      </form>
    </AuthFrame>
  );
}
