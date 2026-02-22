import { describe, it, expect, beforeEach, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { useDocumentsStore } from "@/store/documents.store";

const mockFetch = vi.fn();

describe("documents store", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    useDocumentsStore.setState({ documents: [] });
    vi.stubGlobal("fetch", mockFetch);
    vi.stubGlobal("localStorage", {
      getItem: () => "token",
      setItem: () => {},
      removeItem: () => {},
    });
  });

  it("loadDocuments fetches and sets documents", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, filename: "a.pdf", status: "INGESTED", chunkCount: 5, createdAt: "2025-01-01" },
      ],
    });

    await useDocumentsStore.getState().loadDocuments();

    expect(mockFetch).toHaveBeenCalledWith("/api/documents", expect.any(Object));
    expect(useDocumentsStore.getState().documents).toHaveLength(1);
    expect(useDocumentsStore.getState().documents[0].filename).toBe("a.pdf");
  });

  it("deleteDocument removes document on success", async () => {
    useDocumentsStore.setState({
      documents: [
        { id: 1, filename: "a.pdf", status: "INGESTED", chunkCount: 5, createdAt: "2025-01-01" },
      ],
    });
    mockFetch.mockResolvedValueOnce({ ok: true });

    await useDocumentsStore.getState().deleteDocument(1);

    expect(useDocumentsStore.getState().documents).toHaveLength(0);
  });

  it("uploadDocument uploads file and reloads documents", async () => {
    const docs = [
      { id: 2, filename: "new.pdf", status: "INGESTED", chunkCount: 3, createdAt: "2025-01-02" },
    ];
    mockFetch
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true, json: async () => docs });

    const file = new File(["content"], "new.pdf", { type: "application/pdf" });
    await useDocumentsStore.getState().uploadDocument(file);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      "/api/documents/upload",
      expect.objectContaining({ method: "POST" })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(2, "/api/documents", expect.any(Object));
    await waitFor(() => {
      expect(useDocumentsStore.getState().documents).toHaveLength(1);
    });
    expect(useDocumentsStore.getState().documents[0].filename).toBe("new.pdf");
  });

  it("uploadDocument throws on error", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Upload failed" }) });

    const file = new File(["x"], "x.pdf", { type: "application/pdf" });
    await expect(useDocumentsStore.getState().uploadDocument(file)).rejects.toThrow("Upload failed");
  });
});
