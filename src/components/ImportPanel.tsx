import { useRef, useState } from "react";
import type { Entry, Place } from "../types/models.ts";
import { parseCsvToEntries } from "../lib/csv.ts";

const PLACE_LABELS: Record<Place, string> = {
  third: "1st spin (3rd place)",
  second: "2nd spin (2nd place)",
  first: "3rd spin (1st place)",
};

type ImportPanelProps = {
  entries: Entry[];
  onReplace: (entries: Entry[]) => void;
  onClear: () => void;
  disabled?: boolean;
  spinDurationsSec: Record<Place, number>;
  onSaveSpinDurations: (durations: Record<Place, number>) => void;
};

export function ImportPanel({
  entries,
  onReplace,
  onClear,
  disabled = false,
  spinDurationsSec,
  onSaveSpinDurations,
}: ImportPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [draftDurations, setDraftDurations] = useState<Record<Place, number>>(spinDurationsSec);

  const openSettings = () => {
    setDraftDurations({ ...spinDurationsSec });
    setShowSettings(true);
  };

  const saveSettings = () => {
    onSaveSpinDurations(draftDurations);
    setShowSettings(false);
  };

  const participants = entries.length;
  const totalTickets = entries.reduce((sum, e) => sum + e.tickets, 0);

  const downloadTemplate = () => {
    const csv = `name,tickets
alice,2
bob,5
carol,3`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lottery-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text !== "string") return;
      const result = parseCsvToEntries(text);
      if (result.ok) {
        onReplace(result.entries);
      } else {
        alert(result.error);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-300">
          Participants: <strong>{participants}</strong>
        </span>
        <span className="text-sm text-gray-400">|</span>
        <span className="text-sm text-gray-300">
          Total tickets: <strong>{totalTickets}</strong>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
        >
          Import / Replace CSV
        </button>
        <button
          type="button"
          onClick={downloadTemplate}
          className="rounded border border-gray-500 bg-transparent px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-gray-700 cursor-pointer"
        >
          Download template CSV
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="rounded bg-gray-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-500 disabled:opacity-50 cursor-pointer"
        >
          Clear Data
        </button>
        <button
          type="button"
          onClick={openSettings}
          disabled={disabled}
          className="ml-auto rounded p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50 cursor-pointer"
          title="Spin duration settings"
          aria-label="Spin duration settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Spin duration settings"
          onClick={(e) => e.target === e.currentTarget && setShowSettings(false)}
        >
          <div className="w-full max-w-sm rounded-xl border border-gray-600 bg-gray-800 p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-white">Spin duration (seconds)</h3>
            <div className="space-y-3">
              {(["third", "second", "first"] as const).map((place) => (
                <label key={place} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-300">{PLACE_LABELS[place]}</span>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={draftDurations[place]}
                    onChange={(e) =>
                      setDraftDurations((prev) => ({
                        ...prev,
                        [place]: Math.max(1, Math.min(60, Number(e.target.value) || 1)),
                      }))
                    }
                    className="w-20 rounded border border-gray-600 bg-gray-700 px-2 py-1.5 text-right text-white"
                  />
                </label>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="rounded bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveSettings}
                className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
