import { create } from "zustand";

type Toast = { id: number; message: string };

type ToastState = {
  items: Toast[];
  push: (message: string) => void;
  dismiss: (id: number) => void;
};

let seq = 1;

export const useToast = create<ToastState>((set) => ({
  items: [],
  push: (message) => {
    const id = seq++;
    set((s) => ({ items: [...s.items, { id, message }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), 2800);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));
