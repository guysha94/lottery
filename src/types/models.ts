export type Entry = { id: string; name: string; tickets: number; createdAt: number };

export type Place = "third" | "second" | "first";

export type Winner = {
  place: Place;
  entryId: string;
  name: string;
  prizeLabel: string;
  wonAt: number;
};

export type LotteryStep =
  | "idle"
  | "ready"
  | "third_done"
  | "second_done"
  | "first_done";

export type LotteryState = {
  step: LotteryStep;
  winners: Winner[];
  lastImportAt: number | null;
};
