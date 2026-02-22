import { describe, it, expect } from "vitest";
import { MODEL, EMBED_MODEL } from "@/config";

describe("config/openai", () => {
  it("exports MODEL", () => {
    expect(MODEL).toBe("gpt-5.2");
  });

  it("exports EMBED_MODEL", () => {
    expect(EMBED_MODEL).toBe("text-embedding-3-small");
  });
});
