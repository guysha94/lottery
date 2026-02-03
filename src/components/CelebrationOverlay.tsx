import { useEffect } from "react";
import confetti from "canvas-confetti";
import type { Place, Winner } from "../types/models.ts";

const PLACE_LABELS: Record<Place, string> = {
  third: "3rd Place",
  second: "2nd Place",
  first: "1st Place",
};

const APPLAUSE_VOLUME = 0.45;

function playApplause(): void {
  try {
    const audio = new Audio("/crowd_applause.mp3");
    audio.volume = APPLAUSE_VOLUME;
    audio.play().catch(() => {});
  } catch {
    // no-op if file missing or playback unsupported
  }
}

type CelebrationOverlayProps = {
  place: Place;
  winner: Winner;
  primaryLabel: string;
  onClose: () => void;
};

export function CelebrationOverlay({
  place,
  winner,
  primaryLabel,
  onClose,
}: CelebrationOverlayProps) {
  useEffect(() => {
    playApplause();
    const burst = (): void => {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    };
    burst();
    const t1 = setTimeout(burst, 200);
    const t2 = setTimeout(burst, 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Winner celebration"
    >
      <div className="rounded-2xl border border-amber-500/50 bg-gray-900/95 px-8 py-6 text-center shadow-2xl">
        <p className="text-lg font-semibold text-amber-400">
          {PLACE_LABELS[place]}
        </p>
        <p className="mt-1 text-2xl font-bold text-white">{winner.prizeLabel}</p>
        <p className="mt-4 text-4xl font-bold text-white">{winner.name}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 rounded-lg bg-amber-500 px-6 py-2.5 font-semibold text-gray-900 hover:bg-amber-400"
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}
