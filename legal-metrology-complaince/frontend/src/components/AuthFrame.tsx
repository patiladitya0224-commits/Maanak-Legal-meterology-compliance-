import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

export default function AuthFrame({
  title,
  blurb,
  extra,
  children,
}: {
  title: string;
  blurb: string;
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-ink-900 border-r border-white/10 relative overflow-hidden">
        <div className="aurora pointer-events-none absolute inset-0 opacity-70" />
        <div className="mesh absolute inset-0 opacity-25" />
        <div className="relative">
          <Link to="/" className="flex items-center gap-2 text-stone-300 hover:text-white">
            <ShieldCheck className="text-brass-400" size={18} /> Maanak
          </Link>
          <div className="tricolor h-1 w-24 rounded-full my-8" />
          <h1 className="font-display text-5xl leading-tight">{title}</h1>
          <p className="mt-4 text-stone-400 max-w-md">{blurb}</p>
        </div>
        {extra && <div className="relative">{extra}</div>}
      </div>
      <div className="grid place-items-center p-8 relative">
        <div className="aurora pointer-events-none absolute inset-0 opacity-40 lg:hidden" />
        <div className="relative w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
