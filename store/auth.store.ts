import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthStore {
  token: string | null;
  setToken: (token: string) => void;
  logout: () => void;
  getToken: () => string | null;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      setToken: (token) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("token", token);
        }
        set({ token });
      },
      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
        }
        set({ token: null });
      },
      getToken: () => {
        const { token } = get();
        if (token) return token;
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("token");
          if (stored) {
            set({ token: stored });
            return stored;
          }
        }
        return null;
      },
    }),
    { name: "auth-storage", partialize: (s) => ({ token: s.token }) }
  )
);
