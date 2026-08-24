/**
 * Pure geometry/arithmetic for SwipeableRow, kept separate from the
 * PanResponder wiring for the same reason as sliderMath.ts: gesture
 * callbacks can't be reliably unit-tested, but this half can.
 */

export type SwipeableRowSide = 'left' | 'right' | 'none';

export function offsetForSide(
  side: SwipeableRowSide,
  leftActionsWidth: number,
  rightActionsWidth: number
): number {
  if (side === 'left') return leftActionsWidth;
  if (side === 'right') return -rightActionsWidth;
  return 0;
}

export function clampSwipeOffset(
  offset: number,
  leftActionsWidth: number,
  rightActionsWidth: number
): number {
  return Math.min(leftActionsWidth, Math.max(-rightActionsWidth, offset));
}

/**
 * Decides where a drag settles on release: past `openThresholdRatio` of the
 * relevant side's width, or a fast enough flick in that direction, opens it;
 * otherwise it snaps closed.
 */
export function resolveSideFromRelease(
  offset: number,
  leftActionsWidth: number,
  rightActionsWidth: number,
  velocityX: number,
  openThresholdRatio: number = 0.5,
  velocityThreshold: number = 0.5
): SwipeableRowSide {
  if (offset > 0) {
    if (
      velocityX > velocityThreshold ||
      offset > leftActionsWidth * openThresholdRatio
    ) {
      return 'left';
    }
    return 'none';
  }
  if (offset < 0) {
    if (
      velocityX < -velocityThreshold ||
      -offset > rightActionsWidth * openThresholdRatio
    ) {
      return 'right';
    }
    return 'none';
  }
  return 'none';
}
