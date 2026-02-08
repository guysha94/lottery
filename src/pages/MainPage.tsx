import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import * as repo from "../db/repo.ts";
import type {Entry, LotteryState, Place, Winner} from "../types/models.ts";
import {ImportPanel} from "../components/ImportPanel.tsx";
import {CelebrationOverlay} from "../components/CelebrationOverlay.tsx";
import {Podium} from "../components/Podium.tsx";
import {type PrizeWheelRef, type Sector} from '@mertercelik/react-prize-wheel';
import '@mertercelik/react-prize-wheel/style.css';
import {Wheel} from "../components/Wheel.tsx";

const SEGMENT_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#06b6d4", "#6366f1", "#84cc16",
];

const SPIN_DURATION_STORAGE_KEY = "lottery-spin-duration";

const DEFAULT_SPIN_DURATIONS_SEC: Record<Place, number> = {
  third: 10,
  second: 13,
  first: 15,
};

function loadSpinDurations(): Record<Place, number> {
  try {
    const raw = localStorage.getItem(SPIN_DURATION_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SPIN_DURATIONS_SEC };
    const parsed = JSON.parse(raw) as Record<string, number>;
    return {
      third: clampDuration(parsed.third ?? DEFAULT_SPIN_DURATIONS_SEC.third),
      second: clampDuration(parsed.second ?? DEFAULT_SPIN_DURATIONS_SEC.second),
      first: clampDuration(parsed.first ?? DEFAULT_SPIN_DURATIONS_SEC.first),
    };
  } catch {
    return { ...DEFAULT_SPIN_DURATIONS_SEC };
  }
}

function clampDuration(s: number): number {
  return Math.max(1, Math.min(60, Math.round(Number(s)) || 1));
}

function saveSpinDurations(durations: Record<Place, number>): void {
  localStorage.setItem(SPIN_DURATION_STORAGE_KEY, JSON.stringify(durations));
}

const SPIN_CONFIG: Record<
  Place,
  { prizeLabel: string; extraTurns: number }
> = {
  third: { prizeLabel: "BUY ME – 200₪", extraTurns: 6 },
  second: { prizeLabel: "BUY ME – 300₪", extraTurns: 8 },
  first: { prizeLabel: "BUY ME – 500₪", extraTurns: 10 },
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

function getPlaceFromStep(step: LotteryState["step"]): Place | null {
    if (step === "ready") return "third";
    if (step === "third_done") return "second";
    if (step === "second_done") return "first";
    return null;
}

export function MainPage() {
  const wheelRef = useRef<PrizeWheelRef>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [lotteryState, setLotteryState] = useState<LotteryState | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [overlay, setOverlay] = useState<{
    place: Place;
    winner: Winner;
  } | null>(null);
  const [showPodiumView, setShowPodiumView] = useState(false);
  const [spinDurationsSec, setSpinDurationsSec] = useState<Record<Place, number>>(
    () => loadSpinDurations()
  );
  /** Place we're spinning for; set when spin starts, read in onSpinEnd. */
  const spinningForPlaceRef = useRef<Place | null>(null);
  const spinSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      spinSoundRef.current?.pause();
      spinSoundRef.current = null;
    };
  }, []);

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
  const place = getPlaceFromStep(step);

  /** Sectors for the wheel: remaining entries with id, label, probability (tickets). Library picks by probability on spin(). */
  const wheelSectors = useMemo<Sector[]>(
    () =>
      remaining.map((e) => ({
        id: e.id,
        label: e.name,
        text: e.name,
        probability: Math.max(1, e.tickets),
      })),
    [remaining]
  );

  const doSpin = useCallback(() => {
    if (remaining.length === 0 || !place || !wheelRef.current?.spin()) return;
    spinningForPlaceRef.current = place;
    // Create and play spin sound in same user gesture so browsers allow audio
    if (!spinSoundRef.current) spinSoundRef.current = new Audio("/spin-sound.mp3");
    const audio = spinSoundRef.current;
    audio.currentTime = 0;
    audio.play().catch(() => {});
    wheelRef.current.spin();
  }, [remaining.length, place]);

  const onSpinStart = useCallback(() => {
    setIsSpinning(true);
    if (!spinSoundRef.current) spinSoundRef.current = new Audio("/spin-sound.mp3");
    spinningForPlaceRef.current = place;
    const audio = spinSoundRef.current;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, [place]);

  const onSpinEnd = useCallback((sector: Sector) => {


    const placeForSpin = spinningForPlaceRef.current;
    spinningForPlaceRef.current = null;
    setIsSpinning(false);

    // Stop spin sound
    spinSoundRef.current?.pause();
    if (spinSoundRef.current) spinSoundRef.current.currentTime = 0;

    if (!placeForSpin) return;

    const config = SPIN_CONFIG[placeForSpin];
    const winnerRecord: Winner = {
      place: placeForSpin,
      entryId: String(sector.id),
      name: sector.label,
      prizeLabel: config.prizeLabel,
      wonAt: Date.now(),
    };
    // Set winner and advance step (winner is excluded from next spins via getRemainingEntries)
    setLotteryState((prev) => {
      if (!prev) return prev;
      const next: LotteryState = {
        step: NEXT_STEP[placeForSpin],
        winners: [...prev.winners, winnerRecord],
        lastImportAt: prev.lastImportAt,
      };
      repo.setLotteryState(next).catch(() => {});
      return next;
    });

    // Open celebration overlay
    setOverlay({ place: placeForSpin, winner: winnerRecord });
  }, []);

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
    setOverlay(null);
    setShowPodiumView(false);
  }, []);

  const handleClear = useCallback(async () => {
    await repo.clearAll();
    setEntries([]);
    setLotteryState(null);
    setOverlay(null);
    setShowPodiumView(false);
  }, []);

  const handleSaveSpinDurations = useCallback((durations: Record<Place, number>) => {
    const clamped = {
      third: clampDuration(durations.third),
      second: clampDuration(durations.second),
      first: clampDuration(durations.first),
    };
    saveSpinDurations(clamped);
    setSpinDurationsSec(clamped);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const target = document.activeElement;
      const isInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;
      if (isInput) return;
      if (disabled) return;
      e.preventDefault();
      doSpin();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [disabled, doSpin]);

  
  if (step === "first_done" && showPodiumView) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <Podium
          winners={lotteryState?.winners ?? []}
          onRestart={handleRestart}
          onImportNew={handleImportNewFromPodium}
          onClearData={handleClear}
        />
      </div>
    );
  }

  const spinDuration = place ? spinDurationsSec[place] : 4;
  const spinTurns = place ? SPIN_CONFIG[place].extraTurns : 6;

  return (
    <div className="min-h-screen flex flex-col pt-[14vh]">
      <div className="flex-1 min-h-0 flex items-center justify-center p-2">
        <div className="h-full w-full flex items-center justify-center min-w-0">
          <div
            className={`w-[min(88vmin,100%)] max-h-full aspect-square flex items-center justify-center ${!disabled && place ? "cursor-pointer" : ""}`}
            onClick={() => {
              if (disabled || !place) return;
              doSpin();
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (!disabled && place) doSpin();
              }
            }}
            aria-label="Spin the wheel"
          >
            {wheelSectors.length < 2 ? (
              <div className="flex size-full items-center justify-center rounded-full bg-gray-700 text-gray-400 text-center px-4">
                {wheelSectors.length === 0 ? "No entries" : "Add at least 2 entries to spin"}
              </div>
            ) : (
              <Wheel
                ref={wheelRef}
                sectors={wheelSectors}
                wheelColors={SEGMENT_COLORS as [string, string]}
                onSpinStart={onSpinStart}
                onSpinEnd={onSpinEnd}
                duration={spinDuration}
                minSpins={spinTurns}
                maxSpins={spinTurns}
              />
            )}
          </div>
        </div>
      </div>
      <div className="shrink-0 px-4 py-4">
        <ImportPanel
          entries={entries}
          onReplace={handleReplace}
          onClear={handleClear}
          disabled={disabled}
          spinDurationsSec={spinDurationsSec}
          onSaveSpinDurations={handleSaveSpinDurations}
        />
      </div>
      {overlay && (
        <CelebrationOverlay
          key={`${overlay.place}-${overlay.winner.entryId}-${overlay.winner.wonAt}`}
          place={overlay.place}
          winner={overlay.winner}
          primaryLabel={overlay.place === "first" ? "Show Podium" : "Continue"}
          onClose={closeOverlay}
        />
      )}
    </div>
  );
}
