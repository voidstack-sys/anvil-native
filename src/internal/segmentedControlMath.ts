/**
 * Pure math for SegmentedControl, kept separate from the PanResponder
 * wiring for the same reason as carouselMath.ts and sortableListMath.ts.
 */

export interface SegmentLayout {
  value: string;
  x: number;
  width: number;
}

/**
 * Which segment (by value) contains horizontal position `x`, or `null` if
 * none does -- used to resolve a drag-to-scrub gesture across the control.
 * Segments are expected to be non-overlapping; the first match wins.
 */
export function segmentAtPosition(
  x: number,
  segments: readonly SegmentLayout[]
): string | null {
  for (const segment of segments) {
    if (x >= segment.x && x < segment.x + segment.width) {
      return segment.value;
    }
  }
  return null;
}
