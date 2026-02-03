import { db } from "./dexie.ts";
import type { Entry, LotteryState } from "../types/models.ts";

const LOTTERY_STATE_KEY = "lotteryState";

export async function getEntries(): Promise<Entry[]> {
  return db.entries.toArray();
}

export async function replaceEntries(entries: Entry[]): Promise<void> {
  await db.transaction("rw", db.entries, db.kv, async () => {
    await db.entries.clear();
    if (entries.length > 0) await db.entries.bulkAdd(entries);
    await db.kv.put({ key: LOTTERY_STATE_KEY, value: { step: "ready", winners: [], lastImportAt: Date.now() } satisfies LotteryState });
  });
}

export async function getLotteryState(): Promise<LotteryState | null> {
  const row = await db.kv.get(LOTTERY_STATE_KEY);
  if (!row || typeof row.value !== "object" || row.value === null) return null;
  const v = row.value as Record<string, unknown>;
  if (typeof v.step !== "string" || !Array.isArray(v.winners)) return null;
  return row.value as LotteryState;
}

export async function setLotteryState(state: LotteryState): Promise<void> {
  await db.kv.put({ key: LOTTERY_STATE_KEY, value: state });
}

export async function clearAll(): Promise<void> {
  await db.transaction("rw", db.entries, db.kv, async () => {
    await db.entries.clear();
    await db.kv.clear();
  });
}

export async function resetLotteryKeepEntries(): Promise<void> {
  const state = await getLotteryState();
  if (!state) return;
  await setLotteryState({
    step: "ready",
    winners: [],
    lastImportAt: state.lastImportAt,
  });
}
