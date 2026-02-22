-- Replace column-based GIN index with expression-based GIN index
-- (expression indexes are not tracked by Prisma, preventing schema drift)
DROP INDEX IF EXISTS "idx_chunk_content_tsv";

CREATE INDEX IF NOT EXISTS idx_chunk_fts
  ON "Chunk" USING GIN (to_tsvector('german', content));
