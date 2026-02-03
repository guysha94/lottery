import type { Winner } from "../types/models.ts";

type PodiumProps = {
  winners: Winner[];
  onRestart: () => void;
  onImportNew: () => void;
  onClearData: () => void;
};

export function Podium({
  winners,
  onRestart,
  onImportNew,
  onClearData,
}: PodiumProps) {
  const byPlace = new Map(winners.map((w) => [w.place, w]));
  const first = byPlace.get("first");
  const second = byPlace.get("second");
  const third = byPlace.get("third");

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-gray-700 bg-gray-800/80 p-8">
      <h2 className="mb-8 text-center text-2xl font-bold text-white">
        🏆 Podium
      </h2>
      <div className="flex items-end justify-center gap-2">
        {/* 2nd - left */}
        <div className="flex w-32 flex-col items-center rounded-t-lg bg-gray-600/80 px-2 pb-4 pt-4">
          <span className="text-sm font-semibold text-amber-300">2nd</span>
          <span className="text-xs text-gray-400">300₪</span>
          <span className="mt-2 text-lg font-bold text-white">
            {second?.name ?? "—"}
          </span>
        </div>
        {/* 1st - center */}
        <div className="flex w-36 flex-col items-center rounded-t-lg bg-amber-500/90 px-2 pb-6 pt-6">
          <span className="text-sm font-semibold text-gray-900">1st</span>
          <span className="text-xs text-gray-800">500₪</span>
          <span className="mt-2 text-xl font-bold text-gray-900">
            {first?.name ?? "—"}
          </span>
        </div>
        {/* 3rd - right */}
        <div className="flex w-32 flex-col items-center rounded-t-lg bg-amber-700/70 px-2 pb-3 pt-3">
          <span className="text-sm font-semibold text-amber-100">3rd</span>
          <span className="text-xs text-amber-200">200₪</span>
          <span className="mt-2 text-lg font-bold text-white">
            {third?.name ?? "—"}
          </span>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500"
        >
          Restart Lottery
        </button>
        <button
          type="button"
          onClick={onImportNew}
          className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500"
        >
          Import New CSV
        </button>
        <button
          type="button"
          onClick={onClearData}
          className="rounded-lg bg-gray-600 px-4 py-2 font-semibold text-white hover:bg-gray-500"
        >
          Clear Data
        </button>
      </div>
    </div>
  );
}
