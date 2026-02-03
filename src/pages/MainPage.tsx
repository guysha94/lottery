import { useEffect, useState, useRef, useCallback } from "react";
import * as repo from "../db/repo.ts";
import { pickWeighted } from "../lib/weighted.ts";
import { buildSlices, computeTargetRotation } from "../lib/wheelMath.ts";
import { animateRotation } from "../lib/animateRotation.ts";
import type { Entry, LotteryState, Place, Winner } from "../types/models.ts";
import { ImportPanel } from "../components/ImportPanel.tsx";
import { WheelSvg } from "../components/WheelSvg.tsx";
import { CelebrationOverlay } from "../components/CelebrationOverlay.tsx";
import { Podium } from "../components/Podium.tsx";

const SPIN_CONFIG: Record<
  Place,
  { durationMs: number; prizeLabel: string; extraTurns: number }
> = {
  third: { durationMs: 4000, prizeLabel: "BUY ME – 200₪", extraTurns: 6 },
  second: { durationMs: 6000, prizeLabel: "BUY ME – 300₪", extraTurns: 8 },
  first: { durationMs: 8000, prizeLabel: "BUY ME – 500₪", extraTurns: 10 },
};

const NEXT_STEP: Record<Place, LotteryState["step"]> = {
  third: "third_done",
  second: "second_done",
  first: "first_done",
};

function getRemainingEntries(entries: Entry[], winners: Winner[]): Entry[] {
  const winnerIds = new Set(winners.map((w) => w.entryId));
  return entries.filter((e) => !winnerIds.has(e.id));
}

export function MainPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [lotteryState, setLotteryState] = useState<LotteryState | null>(null);
  const [rotationRad, setRotationRad] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [overlay, setOverlay] = useState<{
    place: Place;
    winner: Winner;
  } | null>(null);
  const [showPodiumView, setShowPodiumView] = useState(false);
  const cancelAnimationRef = useRef<(() => void) | null>(null);

  const load = useCallback(async () => {
    const [e, s] = await Promise.all([
      repo.getEntries(),
      repo.getLotteryState(),
    ]);
    setEntries(e);
    let state = s;
    if (!state && e.length > 0) {
      state = { step: "ready", winners: [], lastImportAt: null };
      await repo.setLotteryState(state);
    }
    setLotteryState(state);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const step = lotteryState?.step ?? "idle";
  const winners = lotteryState?.winners ?? [];
  const remaining = getRemainingEntries(entries, winners);
  const disabled = isSpinning || overlay !== null;

  const doSpin = useCallback(
    async (place: Place) => {
      if (remaining.length === 0) return;
      const winner = pickWeighted(remaining);
      if (!winner) return;
      const slices = buildSlices(remaining);
      const slice = slices.find((s) => s.entry.id === winner.id);
      if (!slice) return;

      const config = SPIN_CONFIG[place];
      const targetRotation = computeTargetRotation(
        rotationRad,
        slice.centerAngle,
        config.extraTurns,
        config.durationMs
      );

      setIsSpinning(true);
      const winnerRecord: Winner = {
        place,
        entryId: winner.id,
        name: winner.name,
        prizeLabel: config.prizeLabel,
        wonAt: Date.now(),
      };

      cancelAnimationRef.current = animateRotation(
        rotationRad,
        targetRotation,
        config.durationMs,
        setRotationRad,
        () => {
          setIsSpinning(false);
          setLotteryState((prev) => {
            if (!prev) return prev;
            const next: LotteryState = {
              step: NEXT_STEP[place],
              winners: [...prev.winners, winnerRecord],
              lastImportAt: prev.lastImportAt,
            };
            repo.setLotteryState(next).catch(() => {});
            return next;
          });
          setOverlay({ place, winner: winnerRecord });
        }
      );
    },
    [remaining, rotationRad]
  );

  const closeOverlay = useCallback(() => {
    setOverlay((current) => {
      if (current?.place === "first") setShowPodiumView(true);
      return null;
    });
  }, []);

  const handleRestart = useCallback(async () => {
    await repo.resetLotteryKeepEntries();
    const s = await repo.getLotteryState();
    setLotteryState(s);
    setRotationRad(0);
    setOverlay(null);
    setShowPodiumView(false);
  }, []);

  const handleImportNewFromPodium = useCallback(() => {
    setShowPodiumView(false);
  }, []);

  const handleReplace = useCallback(async (newEntries: Entry[]) => {
    await repo.replaceEntries(newEntries);
    setEntries(newEntries);
    setLotteryState({
      step: "ready",
      winners: [],
      lastImportAt: Date.now(),
    });
    setRotationRad(0);
    setOverlay(null);
    setShowPodiumView(false);
  }, []);

  const handleClear = useCallback(async () => {
    await repo.clearAll();
    setEntries([]);
    setLotteryState(null);
    setRotationRad(0);
    setOverlay(null);
    setShowPodiumView(false);
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationRef.current?.();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const target = document.activeElement;
      const isInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
      if (isInput) return;
      if (disabled) return;
      e.preventDefault();
      if (step === "ready") doSpin("third");
      else if (step === "third_done") doSpin("second");
      else if (step === "second_done") doSpin("first");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [disabled, step, doSpin]);
  const handleWheelClick = useCallback(() => {
    if (disabled) return;
    if (step === "ready") doSpin("third");
    else if (step === "third_done") doSpin("second");
    else if (step === "second_done") doSpin("first");
  }, [disabled, step, doSpin]);

  if (step === "first_done" && showPodiumView) {
    return (
      <div className="min-h-screen px-4 py-8">
        <Podium
          winners={lotteryState?.winners ?? []}
          onRestart={handleRestart}
          onImportNew={handleImportNewFromPodium}
          onClearData={handleClear}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pt-[14vh]">
      <div className="flex-1 min-h-0 flex items-center justify-center p-2">
        <div className="h-full w-full flex items-center justify-center min-w-0">
          <div className="w-[min(88vmin,100%)] max-h-full aspect-square">
            <WheelSvg
            entries={remaining}
            rotationRad={rotationRad}
            onSpin={disabled ? undefined : handleWheelClick}
          />
          </div>
        </div>
      </div>
      <div className="shrink-0 px-4 py-4">
        <ImportPanel
          entries={entries}
          onReplace={handleReplace}
          onClear={handleClear}
          disabled={disabled}
        />
      </div>
      {overlay && (
        <CelebrationOverlay
          place={overlay.place}
          winner={overlay.winner}
          primaryLabel={overlay.place === "first" ? "Show Podium" : "Continue"}
          onClose={closeOverlay}
        />
      )}
    </div>
  );
}
