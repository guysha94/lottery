import type { LotteryStep } from "../types/models.ts";

type ControlsProps = {
  step: LotteryStep;
  isSpinning: boolean;
  overlayOpen: boolean;
  onSpinThird: () => void;
  onSpinSecond: () => void;
  onSpinFirst: () => void;
};

const PLACES = [
  { step: "ready" as const, label: "Spin 3rd", handler: "onSpinThird" },
  { step: "third_done" as const, label: "Spin 2nd", handler: "onSpinSecond" },
  { step: "second_done" as const, label: "Spin 1st", handler: "onSpinFirst" },
] as const;

export function Controls({
  step,
  isSpinning,
  overlayOpen,
  onSpinThird,
  onSpinSecond,
  onSpinFirst,
}: ControlsProps) {
  const disabled = isSpinning || overlayOpen;

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {PLACES.map(({ step: requiredStep, label, handler }) => {
        const enabled = step === requiredStep && !disabled;
        const onClick =
          handler === "onSpinThird"
            ? onSpinThird
            : handler === "onSpinSecond"
              ? onSpinSecond
              : onSpinFirst;
        return (
          <button
            key={requiredStep}
            type="button"
            onClick={onClick}
            disabled={!enabled}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
