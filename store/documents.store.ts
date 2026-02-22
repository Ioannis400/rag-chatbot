import { create } from "zustand";
import type { Document } from "@/types";

interface DocumentsStore {
  documents: Document[];
  loadDocuments: () => Promise<void>;
  uploadDocument: (file: File) => Promise<void>;
  deleteDocument: (id: number) => Promise<void>;
}

async function fetchWithAuth(url: string, init?: RequestInit) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers as Record<string, string>),
      Authorization: `Bearer ${token}`,
    },
  });
  return res;
}

export const useDocumentsStore = create<DocumentsStore>((set, get) => ({
  documents: [],

  loadDocuments: async () => {
    const res = await fetchWithAuth("/api/documents");
    if (res.ok) {
      const data = await res.json();
      set({ documents: data });
    }
  },

  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetchWithAuth("/api/documents/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Upload fehlgeschlagen");
    }
    get().loadDocuments();
  },

  deleteDocument: async (id) => {
    const res = await fetchWithAuth(`/api/documents/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      set((s) => ({ documents: s.documents.filter((d) => d.id !== id) }));
    }
  },
}));
