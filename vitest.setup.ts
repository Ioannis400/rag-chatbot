import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Mock localStorage for zustand persist (must exist before store imports)
const storage: Record<string, string> = {};
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (k: string) => storage[k] ?? null,
    setItem: (k: string, v: string) => {
      storage[k] = v;
    },
    removeItem: (k: string) => {
      delete storage[k];
    },
    length: 0,
    key: () => null,
    clear: () => {
      Object.keys(storage).forEach((k) => delete storage[k]);
    },
  },
  writable: true,
});

afterEach(() => {
  cleanup();
});
