import { describe, it, expect } from "vitest";
import { chunkText } from "@/lib/rag/chunker";

describe("chunkText", () => {
  it("returns single chunk for short text", () => {
    const text = "Kurzer Text.";
    const chunks = chunkText(text, 100, 0);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });

  it("splits long text into multiple chunks", () => {
    const words = Array(100).fill("Wort").join(" ");
    const chunks = chunkText(words, 20, 0);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.length > 0)).toBe(true);
    expect(chunks.join("")).toContain("Wort");
  });

  it("respects overlap between chunks", () => {
    const text = Array(80).fill("x").join(" ");
    const chunks = chunkText(text, 30, 10);
    expect(chunks.length).toBeGreaterThan(1);
    const firstEnd = chunks[0].slice(-20);
    const secondStart = chunks[1].slice(0, 20);
    expect(firstEnd).toBe(secondStart);
  });

  it("handles empty string", () => {
    const chunks = chunkText("", 100, 0);
    expect(chunks).toEqual([]);
  });
});
