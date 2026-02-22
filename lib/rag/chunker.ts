import { Tiktoken, encodingForModel } from "js-tiktoken";
import { CHUNK } from "@/config";

let encoder: Tiktoken | null = null;

function getEncoder(): Tiktoken {
  if (!encoder) {
    encoder = encodingForModel("gpt-5");
  }
  return encoder;
}

export function chunkText(
  text: string,
  maxTokens: number = CHUNK.MAX_TOKENS,
  overlap: number = CHUNK.OVERLAP
): string[] {
  const enc = getEncoder();
  const tokens = enc.encode(text);
  const chunks: string[] = [];
  let start = 0;

  while (start < tokens.length) {
    const end = Math.min(start + maxTokens, tokens.length);
    const chunkTokens = tokens.slice(start, end);
    chunks.push(enc.decode(chunkTokens));
    if (end >= tokens.length) break;
    start = end - overlap;
  }

  return chunks;
}
