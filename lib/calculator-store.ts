import { create } from "zustand";
import { persist } from "zustand/middleware";

// Store Type
interface CalculatorStore {
  history: string[];
  addHistory: (item: string) => void;
  clearHistory: () => void;
}

// Zustand Store with localStorage persistence
export const useCalculatorStore = create<CalculatorStore>()(
  persist(
    (set, get) => ({
      history: [],

      addHistory: (item) => {
        const current = get().history;
        const newHistory = [item, ...current].slice(0, 50); // keep last 50 only
        set({ history: newHistory });
      },

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: "calculator-history", // localStorage key
      storage: typeof window !== "undefined" ? localStorageStorage() : undefined,
    }
  )
);

// ✅ Custom storage helper for SSR safety
function localStorageStorage() {
  return {
    getItem: (name: string) => {
      if (typeof window === "undefined") return null;
      const value = localStorage.getItem(name);
      return value ? JSON.parse(value) : null;
    },
    setItem: (name: string, value: any) => {
      if (typeof window === "undefined") return;
      localStorage.setItem(name, JSON.stringify(value));
    },
    removeItem: (name: string) => {
      if (typeof window === "undefined") return;
      localStorage.removeItem(name);
    },
  };
}
