import {
  clampDragOffset,
  offsetForOtherItem,
  reorder,
  targetIndexFromOffset,
} from '../internal/sortableListMath';

describe('sortableListMath', () => {
  const heights = [40, 50, 60, 70]; // indices 0..3

  describe('clampDragOffset', () => {
    it('clamps downward drag to the total height of items below', () => {
      // From index 1: items below are heights[2]+heights[3] = 130.
      expect(clampDragOffset(9999, 1, heights)).toBe(130);
    });

    it('clamps upward drag to the total height of items above', () => {
      // From index 2: items above are heights[0]+heights[1] = 90.
      expect(clampDragOffset(-9999, 2, heights)).toBe(-90);
    });

    it('passes through an offset already within bounds', () => {
      expect(clampDragOffset(30, 1, heights)).toBe(30);
    });
  });

  describe('targetIndexFromOffset', () => {
    it('stays put below the halfway point of the next neighbor', () => {
      // From index 0, neighbor (index 1) height is 50 -> halfway is 25.
      expect(targetIndexFromOffset(0, 20, heights)).toBe(0);
    });

    it('crosses into the next slot past the halfway point', () => {
      expect(targetIndexFromOffset(0, 30, heights)).toBe(1);
    });

    it('keeps crossing multiple slots for a large enough offset', () => {
      // Past index 1 (50) and into index 2 (60): 50 + 31 = 81.
      expect(targetIndexFromOffset(0, 81, heights)).toBe(2);
    });

    it('crosses upward past the halfway point of the previous neighbor', () => {
      // From index 2, neighbor (index 1) height is 50 -> halfway is 25.
      expect(targetIndexFromOffset(2, -30, heights)).toBe(1);
    });

    it('never goes past the first or last index', () => {
      expect(targetIndexFromOffset(0, -9999, heights)).toBe(0);
      expect(targetIndexFromOffset(3, 9999, heights)).toBe(3);
    });

    it('returns fromIndex unchanged when dragOffset is 0', () => {
      expect(targetIndexFromOffset(2, 0, heights)).toBe(2);
    });
  });

  describe('offsetForOtherItem', () => {
    it('is 0 for every item when the dragged item has not moved', () => {
      expect(offsetForOtherItem(0, 1, 1, 50)).toBe(0);
      expect(offsetForOtherItem(2, 1, 1, 50)).toBe(0);
    });

    it('shifts items between fromIndex (exclusive) and toIndex (inclusive) up, when moving down', () => {
      // Dragging index 0 down to index 2: items originally at 1 and 2 shift up.
      expect(offsetForOtherItem(1, 0, 2, 40)).toBe(-40);
      expect(offsetForOtherItem(2, 0, 2, 40)).toBe(-40);
      expect(offsetForOtherItem(3, 0, 2, 40)).toBe(0);
      expect(offsetForOtherItem(0, 0, 2, 40)).toBe(0);
    });

    it('shifts items between toIndex (inclusive) and fromIndex (exclusive) down, when moving up', () => {
      // Dragging index 3 up to index 1: items originally at 1 and 2 shift down.
      expect(offsetForOtherItem(1, 3, 1, 70)).toBe(70);
      expect(offsetForOtherItem(2, 3, 1, 70)).toBe(70);
      expect(offsetForOtherItem(0, 3, 1, 70)).toBe(0);
      expect(offsetForOtherItem(3, 3, 1, 70)).toBe(0);
    });
  });

  describe('reorder', () => {
    it('moves an element from one index to another', () => {
      expect(reorder(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
      expect(reorder(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
    });

    it('does not mutate the original array', () => {
      const original = ['a', 'b', 'c'];
      reorder(original, 0, 2);
      expect(original).toEqual(['a', 'b', 'c']);
    });
  });
});
