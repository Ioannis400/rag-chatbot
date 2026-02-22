import { describe, it, expect } from "vitest";
import { CHUNK, SEARCH, UPLOAD, CHAT } from "@/config";

describe("config/rag", () => {
  describe("CHUNK", () => {
    it("has expected values", () => {
      expect(CHUNK.MAX_TOKENS).toBe(300);
      expect(CHUNK.OVERLAP).toBe(50);
    });
  });

  describe("SEARCH", () => {
    it("has expected values", () => {
      expect(SEARCH.TOP_K).toBe(10);
      expect(SEARCH.RRF_K).toBe(60);
      expect(SEARCH.HYBRID_FETCH_LIMIT).toBe(20);
      expect(SEARCH.FTS_MIN_QUERY_LENGTH).toBe(2);
    });
  });

  describe("UPLOAD", () => {
    it("has expected values", () => {
      expect(UPLOAD.MAX_SIZE_BYTES).toBe(10 * 1024 * 1024);
      expect(UPLOAD.ALLOWED_TYPES).toContain("application/pdf");
      expect(UPLOAD.ALLOWED_TYPES).toContain("text/plain");
      expect(UPLOAD.ALLOWED_TYPES).toContain("text/markdown");
    });
  });

  describe("CHAT", () => {
    it("has expected values", () => {
      expect(CHAT.MAX_MESSAGES).toBe(20);
    });
  });
});
