import Dexie, { type EntityTable } from "dexie";
import type { Entry } from "../types/models.ts";

type KvRow = { key: string; value: unknown };

export class LotteryDb extends Dexie {
  entries!: EntityTable<Entry, "id">;
  kv!: EntityTable<KvRow, "key">;

  constructor() {
    super("LotteryDb");
    this.version(1).stores({
      entries: "id",
      kv: "key",
    });
  }
}

export const db = new LotteryDb();
