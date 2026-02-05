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
    <div className="mx-auto max-w-4xl rounded-2xl border border-gray-700 bg-gray-800/80 p-10">
      <h2 className="mb-10 text-center text-3xl font-bold text-white">
        🏆 Podium
      </h2>
      <div className="flex items-end justify-center gap-4">
        {/* 2nd - left */}
        <div className="flex w-44 flex-col items-center rounded-t-xl bg-gray-600/80 px-4 pb-5 pt-5">
          <span className="text-base font-semibold text-amber-300">2nd</span>
          <span className="text-sm text-gray-400">300₪</span>
          <span className="mt-3 w-full text-center text-xl font-bold text-white break-words">
            {second?.name ?? "—"}
          </span>
        </div>
        {/* 1st - center */}
        <div className="flex w-52 flex-col items-center rounded-t-xl bg-amber-500/90 px-4 pb-8 pt-8">
          <span className="text-base font-semibold text-gray-900">1st</span>
          <span className="text-sm text-gray-800">500₪</span>
          <span className="mt-3 w-full text-center text-2xl font-bold text-gray-900 break-words">
            {first?.name ?? "—"}
          </span>
        </div>
        {/* 3rd - right */}
        <div className="flex w-44 flex-col items-center rounded-t-xl bg-amber-700/70 px-4 pb-4 pt-4">
          <span className="text-base font-semibold text-amber-100">3rd</span>
          <span className="text-sm text-amber-200">200₪</span>
          <span className="mt-3 w-full text-center text-xl font-bold text-white break-words">
            {third?.name ?? "—"}
          </span>
        </div>
      </div>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 cursor-pointer"
        >
          Restart Lottery
        </button>
        <button
          type="button"
          onClick={onImportNew}
          className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500 cursor-pointer"
        >
          Import New CSV
        </button>
        <button
          type="button"
          onClick={onClearData}
          className="rounded-lg bg-gray-600 px-4 py-2 font-semibold text-white hover:bg-gray-500 cursor-pointer"
        >
          Clear Data
        </button>
      </div>
    </div>
  );
}
