import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractText, reconstructTables } from "@/lib/rag/pdf";

const { mockGetText, mockDestroy } = vi.hoisted(() => ({
  mockGetText: vi.fn(),
  mockDestroy: vi.fn(),
}));

vi.mock("pdf-parse", () => ({
  PDFParse: class MockPDFParse {
    getText = mockGetText;
    destroy = mockDestroy;
  },
}));

describe("extractText", () => {
  beforeEach(() => {
    mockGetText.mockReset();
    mockDestroy.mockReset();
  });

  it("extracts text from plain text buffer", async () => {
    const buffer = Buffer.from("Hello World", "utf-8");
    const result = await extractText(buffer, "text/plain");
    expect(result).toBe("Hello World");
  });

  it("extracts text from markdown buffer", async () => {
    const buffer = Buffer.from("# Title\n\nContent", "utf-8");
    const result = await extractText(buffer, "text/markdown");
    expect(result).toBe("# Title\n\nContent");
  });

  it("extracts text from PDF buffer", async () => {
    mockGetText.mockResolvedValue({ text: "PDF content here" });
    mockDestroy.mockResolvedValue(undefined);
    const buffer = Buffer.from("fake-pdf");
    const result = await extractText(buffer, "application/pdf");
    expect(result).toBe("PDF content here");
    expect(mockDestroy).toHaveBeenCalled();
  });

  it("throws for unsupported mime type", async () => {
    const buffer = Buffer.from("x");
    await expect(extractText(buffer, "image/png")).rejects.toThrow("Unsupported mime type");
  });
});

describe("reconstructTables", () => {
  it("returns plain text unchanged when no table-like structure", () => {
    const input = "Ein normaler Absatz.\nNoch ein Absatz.";
    expect(reconstructTables(input)).toBe(input);
  });

  it("converts spaced columns to markdown table", () => {
    const input = "Name    Alter    Stadt\nMax     30       Berlin\nAnna    25       München";
    const result = reconstructTables(input);
    expect(result).toContain("| Name | Alter | Stadt |");
    expect(result).toContain("| --- | --- | --- |");
    expect(result).toContain("| Max | 30 | Berlin |");
    expect(result).toContain("| Anna | 25 | München |");
  });

  it("handles single-column rows as plain text", () => {
    const input = "Überschrift\n\nEinzeiliger Text";
    const result = reconstructTables(input);
    expect(result).not.toContain("|");
  });

  it("flushes table when column count changes", () => {
    const input = "A    B\n1    2\nX    Y    Z";
    const result = reconstructTables(input);
    expect(result).toContain("| A | B |");
    expect(result).toContain("| 1 | 2 |");
    expect(result).toContain("X    Y    Z");
  });

  it("outputs plain text when table has only one column", () => {
    const input = "A  \nB  ";
    const result = reconstructTables(input);
    expect(result).toContain("A  ");
    expect(result).toContain("B  ");
  });
});
