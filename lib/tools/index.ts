import type { FunctionTool } from "openai/resources/responses/responses";
import { logger } from "@/lib/logger";
import { fetchWithRetry } from "@/lib/tools/fetch";

// ---------------------------------------------------------------------------
// Tool definitions (shown to the LLM)
// ---------------------------------------------------------------------------

export const toolDefinitions: FunctionTool[] = [
  {
    type: "function",
    name: "get_vacation_days",
    description:
      "Ruft die verbleibenden Urlaubstage des eingeloggten Nutzers ab. " +
      "Nutze dieses Tool, wenn der Nutzer nach Urlaub, Urlaubstagen, Resturlaub oder ähnlichem fragt.",
    parameters: { type: "object", properties: {}, required: [] },
    strict: false,
  },
  {
    type: "function",
    name: "get_public_holidays",
    description:
      "Gibt die gesetzlichen Feiertage für Österreich (AT) oder Deutschland (DE) für ein bestimmtes Jahr zurück. " +
      "Nutze dieses Tool, wenn der Nutzer nach Feiertagen, freien Tagen oder Brückentagen fragt.",
    parameters: {
      type: "object",
      properties: {
        year: {
          type: "number",
          description: "Das Kalenderjahr (z.B. 2026). Wenn nicht angegeben, aktuelles Jahr.",
        },
        country: {
          type: "string",
          enum: ["AT", "DE"],
          description: "Ländercode: AT für Österreich, DE für Deutschland. Standard: DE.",
        },
      },
      required: [],
    },
    strict: false,
  },
  {
    type: "function",
    name: "get_weather",
    description:
      "Ruft das aktuelle Wetter für einen bestimmten Ort ab. " +
      "Nutze dieses Tool nur, wenn der Nutzer einen Ort (Stadt oder PLZ) genannt hat. " +
      "WICHTIG: Wenn der Nutzer keinen Ort angibt, rufe das Tool NICHT auf — frage stattdessen explizit nach der Stadt oder PLZ. Rate oder vermute niemals einen Ort (z.B. Wien).",
    parameters: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "Stadtname (Deutsch oder Englisch) oder PLZ, z.B. 'Wien', 'Bergheim', 'München', '50667'.",
        },
      },
      required: ["city"],
    },
    strict: false,
  },
  {
    type: "function",
    name: "get_company_news",
    description:
      "Gibt die neuesten Unternehmensnachrichten zurück. " +
      "Nutze dieses Tool, wenn der Nutzer nach News, Neuigkeiten, Ankündigungen oder aktuellen Entwicklungen im Unternehmen fragt.",
    parameters: { type: "object", properties: {}, required: [] },
    strict: false,
  },
  {
    type: "function",
    name: "get_next_meeting",
    description:
      "Gibt das nächste geplante Meeting des Nutzers zurück. " +
      "Nutze dieses Tool, wenn der Nutzer nach seinem nächsten Termin, Meeting, Besprechung oder Kalender fragt.",
    parameters: { type: "object", properties: {}, required: [] },
    strict: false,
  },
];

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

async function getVacationDays(userId?: number): Promise<object> {
  const perUser: Record<number, { remainingDays: number; usedDays: number }> = {
    1: { remainingDays: 18, usedDays: 12 },
    2: { remainingDays: 7, usedDays: 23 },
    3: { remainingDays: 25, usedDays: 5 },
  };

  let data: { remainingDays: number; usedDays: number };
  if (userId != null && perUser[userId]) {
    data = perUser[userId];
  } else {
    // Deterministischer Fallback: aus userId eine konsistente Zahl ableiten
    const totalDays = 30;
    const usedDays = userId != null ? userId % (totalDays + 1) : 12;
    data = { remainingDays: totalDays - usedDays, usedDays };
  }

  return {
    remainingDays: data.remainingDays,
    totalDays: 30,
    usedDays: data.usedDays,
    year: new Date().getFullYear(),
    userId: userId ?? null,
  };
}

interface NagerHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
}

async function getPublicHolidays(args: {
  year?: number;
  country?: string;
}): Promise<object> {
  const year = args.year ?? new Date().getFullYear();
  const country = args.country ?? "DE";
  const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`;

  const holidays = await fetchWithRetry<NagerHoliday[]>(url);
  return {
    country,
    year,
    count: holidays.length,
    holidays: holidays.map((h) => ({ date: h.date, name: h.localName })),
  };
}

interface WttrResponse {
  current_condition: {
    temp_C: string;
    weatherDesc: { value: string }[];
    humidity: string;
    windspeedKmph: string;
    FeelsLikeC: string;
  }[];
}

async function getWeather(args: { city: string }): Promise<object> {
  const city = encodeURIComponent(args.city);
  const url = `https://wttr.in/${city}?format=j1`;

  const data = await fetchWithRetry<WttrResponse>(url);
  const cond = data.current_condition?.[0];
  if (!cond) throw new Error("No weather data returned");

  return {
    city: args.city,
    tempC: Number(cond.temp_C),
    feelsLikeC: Number(cond.FeelsLikeC),
    description: cond.weatherDesc?.[0]?.value ?? "n/a",
    humidity: `${cond.humidity}%`,
    windKmph: Number(cond.windspeedKmph),
  };
}

function getCompanyNews(): object {
  return {
    source: "Unternehmens-Newsfeed (Fake Unternehmen)",
    retrievedAt: new Date().toISOString(),
    articles: [
      {
        date: "2026-02-18",
        title: "Fake Unternehmen erhält 1 Million Euro Investition",
        summary:
          "Fake Unternehmen hat erfolgreich eine Finanzierungsrunde über 1.000.000 € abgeschlossen. " +
          "Das Kapital wird für den Ausbau der digitalen Plattform und die Expansion in neue Märkte eingesetzt.",
      },
      {
        date: "2026-02-12",
        title: "Neues Büro eröffnet",
        summary:
          "Das neue Standortbüro nimmt ab sofort den Betrieb auf und schafft 25 neue Arbeitsplätze in der Region.",
      },
      {
        date: "2026-01-29",
        title: "Auszeichnung als Top-Arbeitgeber 2026",
        summary:
          "Fake Unternehmen wurde zum dritten Mal in Folge als einer der besten Arbeitgeber ausgezeichnet.",
      },
    ],
  };
}

function getNextMeeting(userId?: number): object {
  // Mock – per userId unterschiedliche Termine
  const perUser: Record<number, { title: string; date: string; participants: string[] }> = {
    1: {
      title: "Quarterly Review Q1 2030",
      date: "2030-04-02T10:00:00+02:00",
      participants: ["Anna Müller", "Stefan Berger", "Maria Hofer"],
    },
    2: {
      title: "Team-Standup",
      date: "2030-04-02T09:00:00+02:00",
      participants: ["Thomas Klein", "Julia Wagner"],
    },
    3: {
      title: "Kundenpräsentation – Siemens AG",
      date: "2030-04-02T14:30:00+02:00",
      participants: ["Klaus Richter", "Sandra Bauer", "Robert Fuchs"],
    },
  };

  const meeting = (userId != null && perUser[userId]) || perUser[1];
  const meetingDate = new Date(meeting.date);
  const now = new Date();
  const diffMs = meetingDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    userId: userId ?? null,
    title: meeting.title,
    date: meeting.date,
    dateFormatted: meetingDate.toLocaleDateString("de-AT", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    participants: meeting.participants,
    inDays: diffDays,
  };
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export async function executeTool(
  name: string,
  args: string,
  userId?: number
): Promise<string> {
  const start = Date.now();
  logger.tool(`${name} called`, { userId, args });

  try {
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(args) as Record<string, unknown>;
    } catch {
      // args might be empty string – treat as {}
    }

    let result: object;

    switch (name) {
      case "get_vacation_days":
        result = await getVacationDays(userId);
        break;
      case "get_public_holidays":
        result = await getPublicHolidays(parsed as { year?: number; country?: string });
        break;
      case "get_weather":
        result = await getWeather(parsed as { city: string });
        break;
      case "get_company_news":
        result = getCompanyNews();
        break;
      case "get_next_meeting":
        result = getNextMeeting(userId);
        break;
      default:
        logger.error("Tool", `Unknown tool: ${name}`);
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }

    logger.tool(`${name} success`, { durationMs: Date.now() - start });
    return JSON.stringify(result);
  } catch (err) {
    logger.error("Tool", `${name} failed`, err);
    const message = err instanceof Error ? err.message : String(err);
    return JSON.stringify({ error: `Tool "${name}" fehlgeschlagen: ${message}` });
  }
}
