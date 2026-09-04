/**
 * Pure geometry/arithmetic for ScrollArea, kept separate from the
 * PanResponder/ScrollView wiring for the same reason as sliderMath.ts and
 * swipeableRowMath.ts: gesture and scroll-event callbacks can't be reliably
 * unit-tested, but this half can.
 */

/** The furthest the viewport can scroll, given how much content overflows it. */
export function maxScrollOffset(
  contentSize: number,
  viewportSize: number
): number {
  return Math.max(contentSize - viewportSize, 0);
}

export function clampScrollOffset(
  offset: number,
  contentSize: number,
  viewportSize: number
): number {
  return Math.min(
    Math.max(offset, 0),
    maxScrollOffset(contentSize, viewportSize)
  );
}

/** The thumb's length as a fraction (0-1) of the track -- 1 when nothing overflows. */
export function thumbSizeRatio(
  viewportSize: number,
  contentSize: number
): number {
  if (contentSize <= 0 || viewportSize <= 0) return 1;
  return Math.min(1, viewportSize / contentSize);
}

/** How far along the track the thumb currently sits, as a fraction (0-1). */
export function thumbOffsetRatio(
  scrollOffset: number,
  contentSize: number,
  viewportSize: number
): number {
  const maxOffset = maxScrollOffset(contentSize, viewportSize);
  if (maxOffset <= 0) return 0;
  return Math.min(1, Math.max(0, scrollOffset / maxOffset));
}

/**
 * Converts a drag delta (px, along the track) applied to the thumb into the
 * equivalent scroll-offset delta (px, along the content), accounting for the
 * thumb being shorter than the track it travels along.
 */
export function scrollDeltaFromThumbDrag(
  dragDelta: number,
  trackSize: number,
  contentSize: number,
  viewportSize: number
): number {
  const maxOffset = maxScrollOffset(contentSize, viewportSize);
  const thumbTravel =
    trackSize * (1 - thumbSizeRatio(viewportSize, contentSize));
  if (thumbTravel <= 0 || maxOffset <= 0) return 0;
  return (dragDelta / thumbTravel) * maxOffset;
}
