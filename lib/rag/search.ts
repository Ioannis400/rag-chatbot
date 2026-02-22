import { Pool } from "pg";
import { SEARCH } from "@/config";
import { logger } from "@/lib/logger";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface ChunkResult {
  content: string;
  filename: string;
  score: number;
}

export async function searchChunks(
  embedding: number[],
  userId: number,
  topK = SEARCH.TOP_K
): Promise<ChunkResult[]> {
  const vectorStr = `[${embedding.join(",")}]`;

  const result = await pool.query<{
    content: string;
    filename: string;
    score: number;
  }>(
    `
    SELECT c.content, d.filename,
           1 - (c.embedding <=> $1::vector) AS score
    FROM "Chunk" c
    JOIN "Document" d ON c."documentId" = d.id
    WHERE d."userId" = $2
      AND d.status = 'INGESTED'
      AND c.embedding IS NOT NULL
    ORDER BY c.embedding <=> $1::vector
    LIMIT $3
    `,
    [vectorStr, userId, topK]
  );

  return result.rows;
}

function rrfFusion(
  vectorRows: { id: number; content: string; filename: string }[],
  ftsRows: { id: number; content: string; filename: string }[]
): { id: number; content: string; filename: string; score: number }[] {
  const scores = new Map<
    number,
    { content: string; filename: string; score: number }
  >();

  vectorRows.forEach((row, rank) => {
    const rrfScore = 1 / (SEARCH.RRF_K + rank + 1);
    const existing = scores.get(row.id);
    if (existing) {
      existing.score += rrfScore;
    } else {
      scores.set(row.id, {
        content: row.content,
        filename: row.filename,
        score: rrfScore,
      });
    }
  });

  ftsRows.forEach((row, rank) => {
    const rrfScore = 1 / (SEARCH.RRF_K + rank + 1);
    const existing = scores.get(row.id);
    if (existing) {
      existing.score += rrfScore;
    } else {
      scores.set(row.id, {
        content: row.content,
        filename: row.filename,
        score: rrfScore,
      });
    }
  });

  return [...scores.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .map(([id, { content, filename, score }]) => ({
      id,
      content,
      filename,
      score,
    }));
}

export async function hybridSearchChunks(
  embedding: number[],
  query: string,
  userId: number,
  topK = SEARCH.TOP_K
): Promise<ChunkResult[]> {
  const vectorStr = `[${embedding.join(",")}]`;

  const vectorQuery = `
    SELECT c.id, c.content, d.filename
    FROM "Chunk" c
    JOIN "Document" d ON c."documentId" = d.id
    WHERE d."userId" = $1
      AND d.status = 'INGESTED'
      AND c.embedding IS NOT NULL
    ORDER BY c.embedding <=> $2::vector
    LIMIT $3
  `;

  const [vectorResult, ftsResult] = await Promise.all([
    pool.query<{ id: number; content: string; filename: string }>(
      vectorQuery,
      [userId, vectorStr, SEARCH.HYBRID_FETCH_LIMIT]
    ),
    (async () => {
      const q = query.trim();
      if (q.length < SEARCH.FTS_MIN_QUERY_LENGTH) return { rows: [] };
      try {
        return await pool.query<{ id: number; content: string; filename: string }>(
          `
          SELECT c.id, c.content, d.filename
          FROM "Chunk" c
          JOIN "Document" d ON c."documentId" = d.id
          WHERE d."userId" = $1
            AND d.status = 'INGESTED'
            AND c.content_tsv @@ plainto_tsquery('german', $2)
          ORDER BY ts_rank(c.content_tsv, plainto_tsquery('german', $2)) DESC
          LIMIT $3
          `,
          [userId, q, SEARCH.HYBRID_FETCH_LIMIT]
        );
      } catch {
        return { rows: [] };
      }
    })(),
  ]);

  const fused = rrfFusion(vectorResult.rows, ftsResult.rows);
  const top = fused.slice(0, topK);

  logger.search("Hybrid-Search", {
    vectorHits: vectorResult.rows.length,
    ftsHits: ftsResult.rows.length,
    fusedCount: fused.length,
    topK: top.length,
    sources: [...new Set(top.map((r) => r.filename))],
  });

  return top.map(({ content, filename, score }) => ({
    content,
    filename,
    score,
  }));
}
