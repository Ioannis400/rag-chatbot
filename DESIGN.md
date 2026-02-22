# Design-Entscheidungen

## Tool Calling vs. Keyword-Router

| Option | Beschreibung |
|--------|---------------|
| **A: Keyword-Matching** (`if message.includes("urlaub")`) | Einfach, aber unflexibel und wartungsintensiv |
| **B: LLM-natives Tool Calling** | Modell entscheidet eigenständig, mehrsprachig, keine Keyword-Listen |

**Gewählt:** Tool Calling – klare Trennung zwischen Entscheidungslogik und Ausführung. Der LLM interpretiert die Frage und ruft das passende Tool auf.

---

## pgvector vs. externe Vector DB

| Option | Beschreibung |
|--------|---------------|
| **A: Pinecone / Weaviate** | Spezialisiert, aber extra Service + extra Kosten |
| **B: pgvector** | In derselben Postgres-Instanz |

**Gewählt:** pgvector – ein Service weniger, Transaktionskonsistenz, für diesen Scope ausreichend.

---

## Direkte OpenAI API vs. LangChain

| Option | Beschreibung |
|--------|---------------|
| **A: LangChain** | Viel out-of-the-box, schneller Start |
| **B: Direkte OpenAI API** | Volle Kontrolle über jeden Schritt |

**Gewählt:** Direkt – keine Magic-Abstraktionen, Pipeline bewusst gebaut. Jeder Schritt ist nachvollziehbar.

---

## Hybrid Search (Vector + FTS) vs. nur Vektorsuche

| Option | Beschreibung |
|--------|---------------|
| **A: Nur Vector** | Semantische Ähnlichkeit, aber Fachbegriffe/PLZ können schlecht matchen |
| **B: Vector + Full-Text** | RRF-Fusion kombiniert beide – bessere Ergebnisse bei exakten Begriffen |

**Gewählt:** Hybrid Search – PostgreSQL tsvector (german) + pgvector, RRF-Fusion. Top-10 Chunks aus der kombinierten Rangliste.

---

## Token-basiertes Chunking (tiktoken)

| Option | Beschreibung |
|--------|---------------|
| **A: Token-basiert** (tiktoken) | Präziser für das Modell, gleiche Einheit wie API-Limits |
| **B: Zeichen-basiert** (1200 Zeichen, 150 Overlap) | Kein externer Tokenizer, aber ungenau |

**Gewählt:** tiktoken – 300 Tokens pro Chunk, 50 Overlap. Präzise für Embeddings und API-Limits, gleiche Tokenisierung wie OpenAI.

---

## PDF-Tabellen: Heuristische Rekonstruktion

- **TXT und Markdown:** Direkt als UTF-8 String – Tabellen bleiben erhalten
- **PDFs:** pdf-parse liefert Plaintext ohne Tabellenstruktur – heuristische Rekonstruktion notwendig

**Gewählt:** Heuristische Tabellenerkennung – aufeinanderfolgende Zeilen mit mehrfachen Leerzeichen (≥2) werden als Tabellenspalten erkannt und in Markdown-Tabellen umgewandelt.

**Limitation:** Tabellen ohne klare Spaltenabstände (z.B. manche gescannte PDFs) werden nicht korrekt erkannt.

---

## Retry-Pattern für externe Services

**Gewählt:** `fetchWithRetry()` in `lib/tools/fetch.ts` – 3 Versuche, exponentieller Backoff (500ms, 1000ms, 1500ms), 5s Timeout pro Request.

**Mit echten Services:** API-Key in Header, Auth-Refresh, Rate-Limiting, Circuit Breaker bei wiederholten Fehlern.

---

## Was mit mehr Zeit umgesetzt würde

| Verbesserung | Beschreibung |
|--------------|--------------|
| **OCR** | Für gescannte PDFs: Tesseract oder AWS Textract |
| **Echte HR-API** | Urlaubstage statt Mock aus echtem HR-System |
| **Reranking** | Cohere Rerank oder ähnlich für präzisere Chunk-Auswahl |
| **Tool-Registry** | Neue Tools hinzufügen ohne Switch-Block in `executeTool` ändern zu müssen |
| **Monitoring** | Query-Logging, Latenz-Metriken, Fehler-Tracking |
