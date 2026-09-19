/**
 * Pure math for PinchZoomView, kept separate from the PanResponder wiring
 * for the same reason as sliderMath.ts and swipeableRowMath.ts.
 */

export interface TouchPoint {
  pageX: number;
  pageY: number;
}

/** Euclidean distance between two touches -- the basis for pinch scale. Returns 0 with fewer than two touches. */
export function distanceBetweenTouches(touches: readonly TouchPoint[]): number {
  if (touches.length < 2) return 0;
  const a = touches[0]!;
  const b = touches[1]!;
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
}

export function clampScale(
  scale: number,
  minScale: number,
  maxScale: number
): number {
  return Math.min(maxScale, Math.max(minScale, scale));
}

/**
 * Clamps a pan translation so content scaled by `scale` can't be dragged
 * past its own edge -- at `scale <= 1` there's no overflow to pan into.
 * Assumes the content fills `containerSize` at `scale === 1`.
 */
export function clampPanTranslate(
  translate: number,
  containerSize: number,
  scale: number
): number {
  if (scale <= 1) return 0;
  const bound = (containerSize * (scale - 1)) / 2;
  return Math.min(bound, Math.max(-bound, translate));
}
