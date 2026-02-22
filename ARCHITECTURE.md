# Architektur

## Upload-Pipeline

Dokumente werden extrahiert, gechunkt, embeddet und in PostgreSQL gespeichert.

```mermaid
flowchart LR
    subgraph upload [Upload]
        A[PDF/TXT/MD] --> B[extractText]
        B --> C[reconstructTables]
        C --> D[chunkText]
        D --> E[embedText]
        E --> F[(pgvector + tsvector)]
    end
```

| Schritt | Datei | Beschreibung |
|---------|-------|--------------|
| Upload | `app/api/documents/upload/route.ts` | Datei empfangen, MIME-Type prüfen |
| Extract | `lib/rag/pdf.ts` | pdf-parse für PDF, UTF-8 für TXT/MD |
| Chunk | `lib/rag/chunker.ts` | tiktoken, 300 Tokens, 50 Overlap |
| Embed | `lib/openai/embed.ts` | text-embedding-3-small |
| Store | Prisma + raw SQL | Chunk + embedding in `Chunk`, tsvector für FTS |

---

## Query-Pipeline (RAG)

Anfrage wird embeddet, Hybrid Search liefert Top-Chunks, LLM antwortet mit Kontext.

```mermaid
flowchart LR
    subgraph query [Query]
        Q[User Query] --> E1[embedText]
        E1 --> V[Vector Search]
        Q --> FTS[Full-Text Search]
        V --> RRF[RRF Fusion]
        FTS --> RRF
        RRF --> C[Top-K Chunks]
        C --> P[buildSystemPrompt]
        P --> LLM[OpenAI LLM]
        LLM --> S[Stream Response]
    end
```

| Schritt | Datei | Beschreibung |
|---------|-------|--------------|
| Embed | `lib/openai/embed.ts` | Query vektorisieren |
| Search | `lib/rag/search.ts` | Vector + FTS, RRF-Fusion |
| Context | `lib/rag/context.ts` | System-Prompt mit Chunks + User-Name |
| Chat | `app/api/chat/route.ts` | LLM aufrufen, streamen |

---

## Tool-Flow (dynamische Daten)

LLM entscheidet, ob ein Tool nötig ist; Backend führt es aus und liefert das Ergebnis zurück.

```mermaid
flowchart LR
    subgraph toolFlow [Tool Flow]
        U[User Message] --> LLM1[LLM]
        LLM1 -->|"Tool Call?"| T{Tool?}
        T -->|Ja| EX[executeTool]
        EX --> API[API / Mock]
        API --> RES[Result]
        RES --> LLM2[LLM]
        LLM2 --> A[Antwort]
        T -->|Nein| A
    end
```

| Komponente | Datei | Beschreibung |
|------------|-------|--------------|
| Tool Definitions | `lib/tools/index.ts` | 5 Tools (Urlaub, Feiertage, Wetter, News, Meeting) |
| Retry | `lib/tools/fetch.ts` | fetchWithRetry, 3 Versuche, Backoff |
| Execution | `lib/tools/index.ts` | executeTool Dispatcher |
| Integration | `app/api/chat/route.ts` | Tool-Call erkennen, ausführen, Ergebnis an LLM |

---

## Verzeichnisstruktur

```
rag_chatbot/
├── app/
│   ├── (app)/           # Geschützte Routen (Chat, RAG)
│   │   ├── chat/        # Chat-UI
│   │   └── rag/         # Dokumenten-Verwaltung
│   ├── (auth)/          # Login
│   └── api/             # API Routes
│       ├── auth/        # JWT, Login
│       ├── chat/        # RAG + Tool Calling
│       ├── conversations/
│       └── documents/   # Upload, CRUD
├── components/          # React-Komponenten (chat, rag, ui)
├── config/              # OpenAI, RAG-Parameter
├── lib/
│   ├── rag/             # Extraktion, Chunking, Search, Context
│   ├── openai/          # Client, Embeddings
│   ├── tools/           # Tool-Definitionen, executeTool, fetchWithRetry
│   ├── auth/
│   └── logger.ts
├── prisma/              # Schema, Migrations
├── store/               # Zustand (chat, auth, documents)
└── test/
```

---

## Datenbankschema

```mermaid
erDiagram
    User ||--o{ Document : has
    User ||--o{ Conversation : has
    Conversation ||--o{ Message : contains
    Document ||--o{ Chunk : contains

    User {
        int id PK
        string name
        string email UK
        string passwordHash
    }

    Document {
        int id PK
        int userId FK
        string filename
        string filepath
        string mimeType
        enum status
    }

    Conversation {
        int id PK
        int userId FK
        string title
    }

    Message {
        int id PK
        int conversationId FK
        enum role
        string content
    }

    Chunk {
        int id PK
        int documentId FK
        string content
        vector embedding
        tsvector content_tsv
    }
```

| Tabelle | Zweck |
|---------|-------|
| User | Auth, Name für personalisierte Ansprache |
| Document | Hochgeladene Dateien, Metadaten |
| Chunk | Text-Chunks mit pgvector embedding + tsvector für FTS |
| Conversation | Chat-Verlauf |
| Message | Einzelne Nachrichten (user/assistant) |
