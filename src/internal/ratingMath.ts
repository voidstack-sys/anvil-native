/**
 * Pure geometry/arithmetic for Rating, kept separate from the PanResponder
 * wiring for the same reason as sliderMath.ts: gesture callbacks can't be
 * reliably unit-tested, but this half can.
 */

export function clampRatingValue(value: number, max: number): number {
  return Math.min(max, Math.max(0, Math.round(value)));
}

export function valueFromLocationX(
  locationX: number,
  rowWidth: number,
  max: number
): number {
  if (rowWidth <= 0 || max <= 0) return 0;
  const itemWidth = rowWidth / max;
  const index = Math.floor(locationX / itemWidth);
  return clampRatingValue(index + 1, max);
}
