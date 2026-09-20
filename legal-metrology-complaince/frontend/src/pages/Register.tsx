import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../authStore";
import type { User } from "../types";
import AuthFrame from "../components/AuthFrame";
import { useHydrated } from "../hooks/useHydrated";

export default function Register() {
  const hydrated = useHydrated();
  const token = useAuth((s) => s.accessToken);
  const navigate = useNavigate();
  const setSession = useAuth((s) => s.setSession);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!hydrated) return <div className="min-h-screen bg-ink-950" />;
  if (token) return <Navigate to="/app" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = (await api.register({ name, email, password, jurisdiction, role: "officer" })) as {
        access_token: string;
        user: User;
      };
      setSession(data.access_token, data.user);
      navigate("/app/scan");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not register");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFrame
      title="Officer access for field inspections."
      blurb="Creates an enforcement officer account. For judging, prefer the seeded Admin / Officer / Auditor logins."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <h2 className="font-display text-3xl">Request access</h2>
        <p className="text-sm text-stone-400">Signs you in and opens a new inspection.</p>
        <input
          required
          className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          required
          type="email"
          className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2"
          placeholder="Official email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2"
          placeholder="Jurisdiction (state / district)"
          value={jurisdiction}
          onChange={(e) => setJurisdiction(e.target.value)}
        />
        <input
          required
          type="password"
          className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <div className="text-rose-300 text-sm">{error}</div>}
        <button disabled={busy} className="w-full rounded-xl bg-brass-400 text-ink-950 font-semibold py-2.5">
          {busy ? "Creating…" : "Create account"}
        </button>
        <Link to="/login" className="block text-center text-sm text-stone-400">
          Back to sign in
        </Link>
      </form>
    </AuthFrame>
  );
}
