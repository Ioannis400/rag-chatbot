import { logger } from "@/lib/logger";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry<T>(
  url: string,
  retries = 3,
  baseDelayMs = 500,
  timeoutMs = 15000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} – ${res.statusText}`);
      }
      return (await res.json()) as T;
    } catch (err) {
      lastError = err;
      logger.error("Tool", `Attempt ${attempt}/${retries} failed – ${url}`, err);
      if (attempt < retries) {
        await sleep(baseDelayMs * attempt); // 500ms, 1000ms, 1500ms
      }
    }
  }

  throw lastError;
}
