/**
 * easeOutCubic: t => 1 - (1 - t)^3
 * Used for spin animation so wheel decelerates at the end.
 */
export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}
