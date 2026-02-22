/**
 * RAG-Konfiguration: Chunking, Search, Upload, Chat.
 */

/** Chunking – Textaufteilung für Embeddings */
export const CHUNK = {
  /** Maximale Tokens pro Chunk */
  MAX_TOKENS: 300,
  /** Überlappung zwischen Chunks (Tokens) */
  OVERLAP: 50,
} as const;

/** Search – Vektor- und Hybrid-Suche */
export const SEARCH = {
  /** Top-K Chunks für den Chat-Kontext (finale Anzahl) */
  TOP_K: 10,
  /** RRF-Fusion: k-Parameter (höher = weniger Gewicht für niedrige Ränge) */
  RRF_K: 60,
  /** Anzahl Chunks pro Ranking vor der RRF-Fusion (Vector + FTS) */
  HYBRID_FETCH_LIMIT: 20,
  /** Minimale Query-Länge für Full-Text-Search (Zeichen) */
  FTS_MIN_QUERY_LENGTH: 2,
} as const;

/** Upload – Dokumenten-Upload */
export const UPLOAD = {
  /** Maximale Dateigröße in Bytes (10 MB) */
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  /** Erlaubte MIME-Types */
  ALLOWED_TYPES: [
    "application/pdf",
    "text/plain",
    "text/markdown",
    "text/x-markdown",
  ] as const,
} as const;

/** Chat – Konversations-Kontext */
export const CHAT = {
  /** Maximale Anzahl Messages im Kontext (History) */
  MAX_MESSAGES: 20,
} as const;
