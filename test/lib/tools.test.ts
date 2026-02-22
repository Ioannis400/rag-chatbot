import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeTool, toolDefinitions } from "@/lib/tools";

// Mock fetchWithRetry so tests don't make real HTTP calls
vi.mock("@/lib/tools/fetch", () => ({
  fetchWithRetry: vi.fn(),
}));

import { fetchWithRetry } from "@/lib/tools/fetch";
const mockedFetch = vi.mocked(fetchWithRetry);

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// toolDefinitions
// ---------------------------------------------------------------------------

describe("toolDefinitions", () => {
  const names = toolDefinitions.map((t) => t.name);

  it("contains all expected tools", () => {
    expect(names).toContain("get_vacation_days");
    expect(names).toContain("get_public_holidays");
    expect(names).toContain("get_weather");
    expect(names).toContain("get_company_news");
    expect(names).toContain("get_next_meeting");
  });

  it("every tool has type function and a description", () => {
    for (const tool of toolDefinitions) {
      expect(tool.type).toBe("function");
      expect(tool.description).toBeDefined();
      expect(tool.description!.length).toBeGreaterThan(10);
    }
  });
});

// ---------------------------------------------------------------------------
// get_vacation_days
// ---------------------------------------------------------------------------

describe("executeTool – get_vacation_days", () => {
  it("returns default vacation data", async () => {
    const result = JSON.parse(await executeTool("get_vacation_days", "{}"));
    expect(result).toHaveProperty("remainingDays");
    expect(result).toHaveProperty("totalDays", 30);
    expect(result).toHaveProperty("usedDays");
    expect(result).toHaveProperty("year");
    expect(typeof result.remainingDays).toBe("number");
  });

  it("returns user-specific data for userId 2", async () => {
    const result = JSON.parse(await executeTool("get_vacation_days", "{}", 2));
    expect(result.remainingDays).toBe(7);
    expect(result.usedDays).toBe(23);
    expect(result.userId).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// get_public_holidays
// ---------------------------------------------------------------------------

describe("executeTool – get_public_holidays", () => {
  it("returns holiday list from external API", async () => {
    mockedFetch.mockResolvedValueOnce([
      { date: "2026-01-01", localName: "Neujahr", name: "New Year's Day", countryCode: "AT" },
      { date: "2026-12-25", localName: "Weihnachten", name: "Christmas Day", countryCode: "AT" },
    ]);

    const result = JSON.parse(
      await executeTool("get_public_holidays", JSON.stringify({ year: 2026, country: "AT" }))
    );
    expect(result.country).toBe("AT");
    expect(result.year).toBe(2026);
    expect(result.count).toBe(2);
    expect(result.holidays[0]).toHaveProperty("date", "2026-01-01");
    expect(result.holidays[0]).toHaveProperty("name", "Neujahr");
  });

  it("defaults to DE and current year when no args given", async () => {
    mockedFetch.mockResolvedValueOnce([]);
    const result = JSON.parse(await executeTool("get_public_holidays", "{}"));
    expect(result.country).toBe("DE");
    expect(result.year).toBe(new Date().getFullYear());
  });

  it("returns error payload when API fails", async () => {
    mockedFetch.mockRejectedValueOnce(new Error("Network timeout"));
    const result = JSON.parse(await executeTool("get_public_holidays", "{}"));
    expect(result).toHaveProperty("error");
    expect(result.error).toContain("get_public_holidays");
  });
});

// ---------------------------------------------------------------------------
// get_weather
// ---------------------------------------------------------------------------

describe("executeTool – get_weather", () => {
  it("returns parsed weather data", async () => {
    mockedFetch.mockResolvedValueOnce({
      current_condition: [
        {
          temp_C: "12",
          FeelsLikeC: "10",
          weatherDesc: [{ value: "Partly cloudy" }],
          humidity: "65",
          windspeedKmph: "18",
        },
      ],
    });

    const result = JSON.parse(
      await executeTool("get_weather", JSON.stringify({ city: "Vienna" }))
    );
    expect(result.city).toBe("Vienna");
    expect(result.tempC).toBe(12);
    expect(result.description).toBe("Partly cloudy");
    expect(result.humidity).toBe("65%");
    expect(result.windKmph).toBe(18);
  });

  it("returns error payload on network failure", async () => {
    mockedFetch.mockRejectedValueOnce(new Error("HTTP 503"));
    const result = JSON.parse(
      await executeTool("get_weather", JSON.stringify({ city: "Vienna" }))
    );
    expect(result).toHaveProperty("error");
  });
});

// ---------------------------------------------------------------------------
// get_company_news
// ---------------------------------------------------------------------------

describe("executeTool – get_company_news", () => {
  it("returns articles array", async () => {
    const result = JSON.parse(await executeTool("get_company_news", "{}"));
    expect(result).toHaveProperty("articles");
    expect(Array.isArray(result.articles)).toBe(true);
    expect(result.articles.length).toBeGreaterThan(0);
    expect(result.articles[0]).toHaveProperty("title");
    expect(result.articles[0]).toHaveProperty("summary");
    expect(result.articles[0]).toHaveProperty("date");
  });

  it("contains the 1-million news item", async () => {
    const result = JSON.parse(await executeTool("get_company_news", "{}"));
    const millionNews = result.articles.find((a: { title: string }) =>
      a.title.toLowerCase().includes("million")
    );
    expect(millionNews).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// get_next_meeting
// ---------------------------------------------------------------------------

describe("executeTool – get_next_meeting", () => {
  it("returns meeting data with required fields", async () => {
    const result = JSON.parse(await executeTool("get_next_meeting", "{}"));
    expect(result).toHaveProperty("title");
    expect(result).toHaveProperty("date");
    expect(result).toHaveProperty("dateFormatted");
    expect(result).toHaveProperty("participants");
    expect(result).toHaveProperty("inDays");
    expect(Array.isArray(result.participants)).toBe(true);
  });

  it("returns user-specific meeting for userId 3", async () => {
    const result = JSON.parse(await executeTool("get_next_meeting", "{}", 3));
    expect(result.title).toContain("Siemens");
    expect(result.userId).toBe(3);
  });

  it("meeting date is in the future", async () => {
    const result = JSON.parse(await executeTool("get_next_meeting", "{}"));
    const meetingDate = new Date(result.date);
    expect(meetingDate.getTime()).toBeGreaterThan(Date.now());
  });
});

// ---------------------------------------------------------------------------
// unknown tool
// ---------------------------------------------------------------------------

describe("executeTool – unknown tool", () => {
  it("returns error for unknown tool name", async () => {
    const result = JSON.parse(await executeTool("does_not_exist", "{}"));
    expect(result).toHaveProperty("error");
    expect(result.error).toContain("does_not_exist");
  });
});
