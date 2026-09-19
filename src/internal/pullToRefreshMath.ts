/**
 * Pure math for PullToRefresh, kept separate from the PanResponder wiring
 * for the same reason as sliderMath.ts and swipeableRowMath.ts: gesture
 * callbacks can't be reliably unit-tested, but this half can.
 */

/**
 * Eases a raw pull distance once it passes `threshold`, so the indicator
 * keeps giving feedback on a long pull without tracking the finger 1:1
 * forever (the same "rubber band" feel native scroll views give past their
 * own bounds).
 */
export function applyPullResistance(
  rawDistance: number,
  threshold: number,
  resistance: number = 0.3
): number {
  if (rawDistance <= 0) return 0;
  if (rawDistance <= threshold) return rawDistance;
  return threshold + (rawDistance - threshold) * resistance;
}

/** 0-1 progress toward triggering a refresh. */
export function pullProgress(pullDistance: number, threshold: number): number {
  if (threshold <= 0) return 0;
  return Math.min(1, Math.max(0, pullDistance / threshold));
}
