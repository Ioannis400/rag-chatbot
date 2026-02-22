-- Add tsvector column for full-text search (german)
ALTER TABLE "Chunk"
  ADD COLUMN IF NOT EXISTS content_tsv tsvector;

UPDATE "Chunk" SET content_tsv = to_tsvector('german', content);

CREATE OR REPLACE FUNCTION chunk_content_tsv_update()
RETURNS trigger AS $$
BEGIN
  NEW.content_tsv := to_tsvector('german', NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_chunk_content_tsv
  BEFORE INSERT OR UPDATE ON "Chunk"
  FOR EACH ROW EXECUTE FUNCTION chunk_content_tsv_update();

-- Expression-based GIN index (not tracked by Prisma, avoids schema drift)
CREATE INDEX IF NOT EXISTS idx_chunk_fts
  ON "Chunk" USING GIN (to_tsvector('german', content));
