import Papa from "papaparse";
import type { Entry } from "../types/models.ts";

export type CsvParseResult =
  | { ok: true; entries: Entry[] }
  | { ok: false; error: string };

const HEADER_ALIASES: Record<string, string> = {
  name: "name",
  tickets: "tickets",
};

function normalizeHeader(header: string): string {
  const key = header.trim().toLowerCase();
  return HEADER_ALIASES[key] ?? key;
}

function parseTickets(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  const n = parseInt(s, 10);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

export function parseCsvToEntries(csvText: string): CsvParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    const first = parsed.errors[0];
    return { ok: false, error: first.message ?? "CSV parse error" };
  }

  const rows = parsed.data;
  if (rows.length === 0) return { ok: false, error: "CSV has no data rows" };

  const rawHeaders = Object.keys(rows[0] ?? {});
  const nameKey = rawHeaders.find((h) => normalizeHeader(h) === "name");
  const ticketsKey = rawHeaders.find((h) => normalizeHeader(h) === "tickets");

  if (!nameKey || !ticketsKey) {
    return {
      ok: false,
      error: "CSV must have columns: name, tickets (case-insensitive)",
    };
  }

  const byName = new Map<string, { name: string; tickets: number }>();

  for (const row of rows) {
    const name = String(row[nameKey] ?? "").trim();
    const tickets = parseTickets(row[ticketsKey]);
    if (!name) continue;
    if (tickets === null) continue;

    const existing = byName.get(name);
    if (existing) {
      existing.tickets += tickets;
    } else {
      byName.set(name, { name, tickets });
    }
  }

  if (byName.size === 0) {
    return { ok: false, error: "No valid rows (name non-empty, tickets >= 1)" };
  }

  const now = Date.now();
  const entries: Entry[] = Array.from(byName.entries()).map(([, data], i) => ({
    id: `entry-${now}-${i}`,
    name: data.name,
    tickets: data.tickets,
    createdAt: now,
  }));

  return { ok: true, entries };
}
