import type { ReactNode } from "react";

export default function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="glass rounded-3xl px-6 py-14 text-center">
      <div className="font-display text-2xl">{title}</div>
      <p className="text-stone-400 mt-2 max-w-md mx-auto">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
