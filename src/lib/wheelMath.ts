import type { Entry } from "../types/models.ts";

export type WheelSlice = {
  entry: Entry;
  startAngle: number;
  endAngle: number;
  centerAngle: number;
};

/**
 * Build slices for the wheel. Angles in radians, 0 = 12 o'clock (top).
 * Sizes proportional to tickets; drawn clockwise from top.
 */
export function buildSlices(entries: Entry[]): WheelSlice[] {
  const total = entries.reduce((sum, e) => sum + e.tickets, 0);
  if (total <= 0) return [];

  const slices: WheelSlice[] = [];
  let startAngle = -Math.PI / 2; // 12 o'clock

  for (const entry of entries) {
    const span = (entry.tickets / total) * 2 * Math.PI;
    const endAngle = startAngle + span;
    const centerAngle = startAngle + span / 2;
    slices.push({ entry, startAngle, endAngle, centerAngle });
    startAngle = endAngle;
  }

  return slices;
}

/**
 * Pointer is at 3 o'clock. WheelSvg draws slice θ at local angle θ+π/2; SVG rotate(R) is CW.
 * After CW rotation R, slice θ is at fixed angle (θ+π/2)−R. For pointer (0): R = θ+π/2 (mod 2π).
 */
export function computeTargetRotation(
  currentRotationRad: number,
  winnerCenterAngleRad: number,
  extraFullTurns: number,
  _durationMs: number
): number {
  // Normalize current to [0, 2π)
  const twoPi = 2 * Math.PI;
  let curr = currentRotationRad % twoPi;
  if (curr < 0) curr += twoPi;

  // Final rotation mod 2π must be winnerCenterAngle + π/2 so winner lands at 3 o'clock.
  let targetMod = (winnerCenterAngleRad + Math.PI / 2) % twoPi;
  if (targetMod < 0) targetMod += twoPi;
  while (targetMod < curr) targetMod += twoPi;
  let delta = targetMod - curr;
  if (delta <= 0) delta += twoPi;
  // Add extra full turns (more drama for longer duration)
  const fullTurns = Math.max(extraFullTurns, 1);
  return currentRotationRad + (fullTurns - 1) * twoPi + delta;
}
