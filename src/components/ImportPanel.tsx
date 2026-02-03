import { useRef } from "react";
import type { Entry } from "../types/models.ts";
import { parseCsvToEntries } from "../lib/csv.ts";

type ImportPanelProps = {
  entries: Entry[];
  onReplace: (entries: Entry[]) => void;
  onClear: () => void;
  disabled?: boolean;
};

export function ImportPanel({
  entries,
  onReplace,
  onClear,
  disabled = false,
}: ImportPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);

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
      <div className="flex flex-wrap gap-2">
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
      </div>
    </div>
  );
}
