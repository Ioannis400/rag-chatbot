import type { ChunkResult } from "./search";

export interface UserContext {
  name?: string | null;
}

const BASE_INSTRUCTIONS = `
## Verhaltensregeln
- Antworte in der Sprache, in der der Nutzer schreibt.
- Nutze Markdown für Struktur (Listen, Fettdruck, Überschriften) wenn es die Lesbarkeit verbessert.
- Wenn du dir bei einer Aussage nicht sicher bist, kennzeichne das explizit.
- Nutze verfügbare Tools, sobald eine Anfrage es erfordert (z. B. Urlaubstage abfragen).
- Für allgemeines Wissen (Programmierung, Konzepte, Erklärungen) kannst du auf dein Trainingswissen zurückgreifen — kennzeichne das mit „Basierend auf allgemeinem Wissen:".
- Bei Wetter-Anfragen ohne Ortsangabe: frage explizit nach Stadt oder PLZ — rate oder vermute niemals einen Ort.
`.trim();

function userContextBlock(user?: UserContext | null): string {
  if (!user?.name?.trim()) return "";
  return `\n## Nutzer-Kontext\nDu sprichst mit **${user.name.trim()}**. Nutze den Namen für eine persönliche Ansprache, wenn es natürlich passt.\n`;
}

export function buildSystemPrompt(
  chunks: ChunkResult[],
  user?: UserContext | null
): string {
  const userBlock = userContextBlock(user);

  if (chunks.length === 0) {
    return `Du bist ein intelligenter Assistent. Es wurden keine passenden Dokumente zur aktuellen Frage gefunden.
${userBlock}
${BASE_INSTRUCTIONS}

Beantworte die Frage aus deinem allgemeinen Wissen oder nutze ein verfügbares Tool, falls passend.
Füge keinen Quellen-Abschnitt ein, da keine Dokumente bereitgestellt wurden.`;
  }

  const contextBlocks = chunks
    .map((c) => `[${c.filename}]\n${c.content}`)
    .join("\n\n---\n\n");

  return `Du bist ein intelligenter Assistent mit Zugriff auf die Dokumente des Nutzers.
${userBlock}
${BASE_INSTRUCTIONS}

## Umgang mit dem Dokumenten-Kontext
- Priorisiere immer die bereitgestellten Dokumente als primäre Informationsquelle.
- Schreibe die Antwort fließend und natürlich — KEINE inline-Quellenangaben wie „Laut dokument.pdf" mitten im Text.
- Kombiniere bei Bedarf Informationen aus mehreren Dokumenten nahtlos.
- Wenn die gesuchte Information nicht in den Dokumenten enthalten ist, sage das klar — und ergänze ggf. aus allgemeinem Wissen, mit entsprechender Kennzeichnung.
- Füge einen Abschnitt **„Quellen"** nur ein, wenn du tatsächlich Informationen aus den bereitgestellten Dokumenten verwendet hast. Liste dort nur die genutzten Dateinamen auf. Wenn du ausschließlich aus Tools oder allgemeinem Wissen geantwortet hast, lasse den Quellen-Abschnitt komplett weg.

## Dokumenten-Kontext
---
${contextBlocks}
---`;
}
