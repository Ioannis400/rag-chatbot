/**
 * Visueller Logger für RAG, Upload, Embedding und Chat.
 * Immer aktiv, gut lesbar in der Konsole.
 */

const C = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
};

function ts(): string {
  return new Date().toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function fmt(tag: string, color: string, msg: string, meta?: Record<string, unknown>): void {
  const metaStr = meta && Object.keys(meta).length > 0
    ? ` ${C.dim}${JSON.stringify(meta)}${C.reset}`
    : "";
  console.log(`${C.dim}${ts()}${C.reset} ${color}${C.bold}[${tag}]${C.reset} ${msg}${metaStr}`);
}

export const logger = {
  rag: (msg: string, meta?: Record<string, unknown>) =>
    fmt("RAG", C.cyan, msg, meta),

  upload: (msg: string, meta?: Record<string, unknown>) =>
    fmt("Upload", C.green, msg, meta),

  embed: (msg: string, meta?: Record<string, unknown>) =>
    fmt("Embed", C.yellow, msg, meta),

  search: (msg: string, meta?: Record<string, unknown>) =>
    fmt("Search", C.blue, msg, meta),

  chat: (msg: string, meta?: Record<string, unknown>) =>
    fmt("Chat", C.magenta, msg, meta),

  tool: (msg: string, meta?: Record<string, unknown>) =>
    fmt("Tool", C.yellow, msg, meta),

  doc: (msg: string, meta?: Record<string, unknown>) =>
    fmt("Doc", C.green, msg, meta),

  error: (tag: string, msg: string, err?: unknown) => {
    const errStr = err instanceof Error ? err.message : String(err);
    console.error(`${C.dim}${ts()}${C.reset} ${C.red}${C.bold}[${tag}]${C.reset} ${msg} ${C.dim}${errStr}${C.reset}`);
    if (err instanceof Error && err.stack) {
      console.error(C.dim + err.stack + C.reset);
    }
  },
};
