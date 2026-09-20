import { useToast } from "../toast";

export default function ToastHost() {
  const items = useToast((s) => s.items);
  return (
    <div className="pointer-events-none fixed bottom-20 md:bottom-6 right-4 z-[60] space-y-2">
      {items.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto glass rounded-xl px-4 py-2.5 text-sm text-stone-100 shadow-glow border-brass-400/30"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
