import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "@/lib/rag/context";
import type { ChunkResult } from "@/lib/rag/search";

describe("buildSystemPrompt", () => {
  it("returns fallback prompt when no chunks", () => {
    const result = buildSystemPrompt([]);
    expect(result).toContain("intelligenter Assistent");
    expect(result).toContain("keine passenden Dokumente");
    expect(result).not.toContain("Dokumenten-Kontext");
  });

  it("includes chunk content with source references", () => {
    const chunks: ChunkResult[] = [
      { content: "Urlaub: 30 Tage pro Jahr", filename: "handbuch.pdf", score: 0.9 },
      { content: "Kündigungsfrist: 4 Wochen", filename: "vertrag.pdf", score: 0.85 },
    ];
    const result = buildSystemPrompt(chunks);
    expect(result).toContain("[handbuch.pdf]");
    expect(result).toContain("Urlaub: 30 Tage pro Jahr");
    expect(result).toContain("[vertrag.pdf]");
    expect(result).toContain("Kündigungsfrist: 4 Wochen");
    expect(result).toContain("Dokumenten-Kontext");
  });

  it("joins chunks with separator", () => {
    const chunks: ChunkResult[] = [
      { content: "A", filename: "a.pdf", score: 1 },
      { content: "B", filename: "b.pdf", score: 1 },
    ];
    const result = buildSystemPrompt(chunks);
    expect(result).toContain("[a.pdf]");
    expect(result).toContain("[b.pdf]");
    expect(result).toMatch(/A[\s\S]*B/);
  });

  it("includes user name when provided", () => {
    const result = buildSystemPrompt([], { name: "Max Mustermann" });
    expect(result).toContain("Max Mustermann");
    expect(result).toContain("Nutzer-Kontext");
  });

  it("omits user block when name is empty", () => {
    const result = buildSystemPrompt([], { name: "" });
    expect(result).not.toContain("Nutzer-Kontext");
  });
});
