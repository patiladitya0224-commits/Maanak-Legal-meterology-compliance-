import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "./types";

type AuthState = {
  accessToken: string | null;
  user: User | null;
  setSession: (accessToken: string, user: User) => void;
  logout: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setSession: (accessToken, user) => set({ accessToken, user }),
      logout: () => set({ accessToken: null, user: null }),
    }),
    { name: "lmcs-auth" }
  )
);
