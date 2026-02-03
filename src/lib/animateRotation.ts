import { easeOutCubic } from "./easing.ts";

export function animateRotation(
  fromRad: number,
  toRad: number,
  durationMs: number,
  onProgress: (rotationRad: number) => void,
  onComplete: () => void,
  ease: (t: number) => number = easeOutCubic
): () => void {
  const start = performance.now();
  let rafId: number;

  const tick = (): void => {
    const elapsed = performance.now() - start;
    const t = Math.min(elapsed / durationMs, 1);
    const eased = ease(t);
    const current = fromRad + (toRad - fromRad) * eased;
    onProgress(current);
    if (t < 1) {
      rafId = requestAnimationFrame(tick);
    } else {
      onComplete();
    }
  };

  rafId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(rafId);
}
