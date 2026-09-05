/**
 * Pure geometry/arithmetic for SortableList, kept separate from the
 * PanResponder wiring for the same reason as sliderMath.ts and
 * swipeableRowMath.ts: gesture callbacks can't be reliably unit-tested,
 * but this half can.
 *
 * Positions are tracked by *index* into the current `order` array, using
 * each item's own measured height (`itemHeights`, one entry per index, in
 * the same order). A drag crosses into a neighboring slot once it's
 * dragged past half that neighbor's height, which is what makes the list
 * feel like it swaps at the natural halfway point rather than only once
 * fully past the neighbor.
 */

/** Clamps a drag offset to the total height of the items above/below `fromIndex`. */
export function clampDragOffset(
  dragOffset: number,
  fromIndex: number,
  itemHeights: readonly number[]
): number {
  // Positive (downward) drag is bounded by how much room exists below;
  // negative (upward) drag is bounded by how much room exists above.
  const max = itemHeights.slice(fromIndex + 1).reduce((sum, h) => sum + h, 0);
  const min = -itemHeights.slice(0, fromIndex).reduce((sum, h) => sum + h, 0);
  return Math.min(max, Math.max(min, dragOffset));
}

/**
 * Where a drag starting at `fromIndex` currently resolves to, given how far
 * (px) it's been dragged. Positive `dragOffset` moves down the list,
 * negative moves up.
 */
export function targetIndexFromOffset(
  fromIndex: number,
  dragOffset: number,
  itemHeights: readonly number[]
): number {
  if (dragOffset > 0) {
    let remaining = dragOffset;
    let index = fromIndex;
    while (index < itemHeights.length - 1) {
      const neighborHeight =
        itemHeights[index + 1] ?? itemHeights[fromIndex] ?? 0;
      if (remaining < neighborHeight / 2) break;
      remaining -= neighborHeight;
      index += 1;
    }
    return index;
  }
  if (dragOffset < 0) {
    let remaining = -dragOffset;
    let index = fromIndex;
    while (index > 0) {
      const neighborHeight =
        itemHeights[index - 1] ?? itemHeights[fromIndex] ?? 0;
      if (remaining < neighborHeight / 2) break;
      remaining -= neighborHeight;
      index -= 1;
    }
    return index;
  }
  return fromIndex;
}

/**
 * How far (px) a *non-dragged* item at `itemIndex` should shift to make
 * room, given the dragged item is moving from `fromIndex` to `toIndex`.
 */
export function offsetForOtherItem(
  itemIndex: number,
  fromIndex: number,
  toIndex: number,
  draggedHeight: number
): number {
  if (fromIndex === toIndex) return 0;
  if (toIndex > fromIndex) {
    // Dragged item is moving down past this one -- it shifts up to fill the gap.
    if (itemIndex > fromIndex && itemIndex <= toIndex) return -draggedHeight;
    return 0;
  }
  // Dragged item is moving up past this one -- it shifts down to fill the gap.
  if (itemIndex >= toIndex && itemIndex < fromIndex) return draggedHeight;
  return 0;
}

/** Returns a new array with the element at `fromIndex` moved to `toIndex`. */
export function reorder<T>(
  array: readonly T[],
  fromIndex: number,
  toIndex: number
): T[] {
  const copy = array.slice();
  const [moved] = copy.splice(fromIndex, 1);
  if (moved !== undefined) {
    copy.splice(toIndex, 0, moved);
  }
  return copy;
}
