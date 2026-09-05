/**
 * Pure geometry/arithmetic for Carousel, kept separate from the
 * PanResponder wiring for the same reason as sliderMath.ts and
 * swipeableRowMath.ts: gesture callbacks can't be reliably unit-tested,
 * but this half can.
 */

/**
 * Clamps a drag offset so you can't drag past the first or last page --
 * there's no adjacent slide to reveal beyond either edge.
 */
export function clampCarouselDragOffset(
  dragOffset: number,
  page: number,
  count: number,
  viewportWidth: number
): number {
  const max = page > 0 ? viewportWidth : 0;
  const min = page < count - 1 ? -viewportWidth : 0;
  return Math.min(max, Math.max(min, dragOffset));
}

/**
 * Decides which page a drag settles on at release: past `thresholdRatio` of
 * the viewport's width, or a fast enough flick in that direction, advances
 * by one page; otherwise it snaps back to the current page. Clamped to
 * `[0, count - 1]`.
 */
export function resolvePageFromRelease(
  page: number,
  count: number,
  dragOffset: number,
  velocityX: number,
  viewportWidth: number,
  thresholdRatio: number = 0.2,
  velocityThreshold: number = 0.5
): number {
  if (dragOffset < 0) {
    if (
      velocityX < -velocityThreshold ||
      -dragOffset > viewportWidth * thresholdRatio
    ) {
      return Math.min(count - 1, page + 1);
    }
    return page;
  }
  if (dragOffset > 0) {
    if (
      velocityX > velocityThreshold ||
      dragOffset > viewportWidth * thresholdRatio
    ) {
      return Math.max(0, page - 1);
    }
    return page;
  }
  return page;
}

/** Where the track should render, given the committed page and any in-progress drag. */
export function trackTranslateX(
  page: number,
  viewportWidth: number,
  dragOffset: number
): number {
  return -(page * viewportWidth) + dragOffset;
}
