/**
 * Pure geometry/arithmetic for DatePicker.Column's wheel-scroll gesture,
 * kept separate from the PanResponder wiring for the same reason as
 * carouselMath.ts -- and deliberately mirroring its shape: positions here
 * are tracked by *index* into a column's `values` array (rather than by
 * page), and `itemHeight` plays the role `viewportWidth` plays there,
 * since every row is assumed to be exactly `itemHeight` tall.
 *
 * A positive drag (finger moving down) reveals earlier entries -- the same
 * direction convention a native scroll view uses.
 */

/** Clamps a drag offset so you can't drag past the first or last value. */
export function clampWheelDragOffset(
  dragOffset: number,
  index: number,
  itemCount: number,
  itemHeight: number
): number {
  const max = index * itemHeight;
  // Written as `(index - itemCount + 1) * itemHeight` rather than
  // `-(itemCount - 1 - index) * itemHeight` so the last-index case (where
  // this is mathematically 0) doesn't come out as -0.
  const min = (index - itemCount + 1) * itemHeight;
  return Math.min(max, Math.max(min, dragOffset));
}

/**
 * Decides which index a drag settles on at release: past `thresholdRatio`
 * of a row's height, or a fast enough flick in that direction, moves by
 * one row; otherwise it snaps back to the current index. Clamped to
 * `[0, itemCount - 1]`.
 */
export function resolveWheelIndexFromRelease(
  index: number,
  itemCount: number,
  dragOffset: number,
  velocityY: number,
  itemHeight: number,
  thresholdRatio: number = 0.2,
  velocityThreshold: number = 0.5
): number {
  if (dragOffset < 0) {
    if (
      velocityY < -velocityThreshold ||
      -dragOffset > itemHeight * thresholdRatio
    ) {
      return Math.min(itemCount - 1, index + 1);
    }
    return index;
  }
  if (dragOffset > 0) {
    if (
      velocityY > velocityThreshold ||
      dragOffset > itemHeight * thresholdRatio
    ) {
      return Math.max(0, index - 1);
    }
    return index;
  }
  return index;
}

/** Where the value stack should render, given the committed index and any in-progress drag. */
export function wheelTrackTranslateY(
  index: number,
  itemHeight: number,
  dragOffset: number
): number {
  return -(index * itemHeight) + dragOffset;
}
