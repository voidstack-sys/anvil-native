/**
 * Pure geometry/arithmetic for Slider, kept separate from the PanResponder
 * wiring because gesture callbacks can't be reliably unit-tested (no real
 * touch pipeline in Jest/RNTL) — this half can, the same split used for
 * Popover/Menu's `computePosition`.
 */

export function roundToStep(value: number, min: number, step: number): number {
  if (step <= 0) return value;
  return min + Math.round((value - min) / step) * step;
}

export function clampSliderValue(
  rawValue: number,
  min: number,
  max: number,
  step: number
): number {
  const stepped = roundToStep(rawValue, min, step);
  return Math.min(max, Math.max(min, stepped));
}

/**
 * Clamps `candidate` to [min, max] and steps it, then further clamps it so
 * it can't cross its neighboring thumbs — required for range sliders, where
 * two thumbs must never swap order.
 */
export function clampAgainstNeighbors(
  values: number[],
  index: number,
  candidate: number,
  min: number,
  max: number,
  step: number
): number {
  const clamped = clampSliderValue(candidate, min, max, step);
  const lowerBound = index > 0 ? values[index - 1]! : min;
  const upperBound = index < values.length - 1 ? values[index + 1]! : max;
  return Math.min(upperBound, Math.max(lowerBound, clamped));
}

export function pixelDeltaToValue(
  startValue: number,
  dx: number,
  trackWidth: number,
  min: number,
  max: number
): number {
  if (trackWidth <= 0) return startValue;
  return startValue + (dx / trackWidth) * (max - min);
}

export function valueToPercentage(
  value: number,
  min: number,
  max: number
): number {
  if (max <= min) return 0;
  return ((value - min) / (max - min)) * 100;
}
