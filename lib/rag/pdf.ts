import { PDFParse } from "pdf-parse";

export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === "application/pdf") {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      return reconstructTables(result.text);
    } finally {
      await parser.destroy();
    }
  }
  if (
    mimeType === "text/plain" ||
    mimeType === "text/markdown" ||
    mimeType === "text/x-markdown"
  ) {
    return reconstructTables(buffer.toString("utf-8"));
  }
  throw new Error(`Unsupported mime type: ${mimeType}`);
}

/**
 * Heuristische Tabellenerkennung: Zeilen mit mehrfachen Leerzeichen (≥2)
 * werden als Tabellenspalten interpretiert und in Markdown-Tabellen umgewandelt.
 */
export function reconstructTables(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let tableBuffer: string[] = [];
  let tableColumnCount = 0;

  function flushTable() {
    if (tableBuffer.length === 0) return;
    const rows = tableBuffer.map((line) =>
      line.split(/\s{2,}/).map((cell) => cell.trim())
    );
    const cols = Math.max(...rows.map((r) => r.length));
    if (cols >= 2) {
      const header = rows[0];
      const separator = header.map(() => "---").join(" | ");
      result.push("| " + header.join(" | ") + " |");
      result.push("| " + separator + " |");
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        while (row.length < cols) row.push("");
        result.push("| " + row.join(" | ") + " |");
      }
    } else {
      result.push(...tableBuffer);
    }
    tableBuffer = [];
    tableColumnCount = 0;
  }

  for (const line of lines) {
    const spacedColumns = line.split(/\s{2,}/).filter((s) => s.length > 0);
    const looksLikeTableRow = spacedColumns.length >= 2;

    if (looksLikeTableRow) {
      if (tableBuffer.length === 0) {
        tableColumnCount = spacedColumns.length;
      }
      if (spacedColumns.length === tableColumnCount) {
        tableBuffer.push(line);
      } else {
        flushTable();
        result.push(line);
      }
    } else {
      flushTable();
      result.push(line);
    }
  }
  flushTable();

  return result.join("\n");
}
