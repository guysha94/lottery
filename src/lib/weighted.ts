import type { Entry } from "../types/models.ts";

/**
 * Pick one entry from a list with probability proportional to tickets.
 * Uses a single random draw; deterministic given the same entries and rng.
 */
export function pickWeighted(
  entries: Entry[],
  random: () => number = Math.random
): Entry | null {
  if (entries.length === 0) return null;
  const total = entries.reduce((sum, e) => sum + e.tickets, 0);
  if (total <= 0) return null;
  let r = random() * total;
  for (const entry of entries) {
    r -= entry.tickets;
    if (r <= 0) return entry;
  }
  return entries[entries.length - 1] ?? null;
}
