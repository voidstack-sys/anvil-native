import {
  clampWheelDragOffset,
  resolveWheelIndexFromRelease,
  wheelTrackTranslateY,
} from '../internal/wheelPickerMath';

describe('wheelPickerMath', () => {
  describe('clampWheelDragOffset', () => {
    it('allows dragging down (revealing an earlier value) when not at the first index', () => {
      expect(clampWheelDragOffset(20, 1, 5, 40)).toBe(20);
      expect(clampWheelDragOffset(9999, 1, 5, 40)).toBe(40);
    });

    it('disallows dragging down at all at the first index', () => {
      expect(clampWheelDragOffset(20, 0, 5, 40)).toBe(0);
    });

    it('allows dragging up (revealing a later value) when not at the last index', () => {
      expect(clampWheelDragOffset(-20, 0, 5, 40)).toBe(-20);
      expect(clampWheelDragOffset(-9999, 0, 5, 40)).toBe(-160);
    });

    it('disallows dragging up at all at the last index', () => {
      expect(clampWheelDragOffset(-20, 4, 5, 40)).toBe(0);
    });
  });

  describe('resolveWheelIndexFromRelease', () => {
    it('moves to the next index past the distance threshold', () => {
      expect(resolveWheelIndexFromRelease(0, 5, -10, 0, 40)).toBe(1);
    });

    it('moves to the next index on a fast enough flick, even if short', () => {
      expect(resolveWheelIndexFromRelease(0, 5, -2, -1, 40)).toBe(1);
    });

    it('moves to the previous index past the distance threshold', () => {
      expect(resolveWheelIndexFromRelease(1, 5, 10, 0, 40)).toBe(0);
    });

    it('snaps back to the current index below both thresholds', () => {
      expect(resolveWheelIndexFromRelease(1, 5, 3, 0, 40)).toBe(1);
    });

    it('clamps to the first/last index', () => {
      expect(resolveWheelIndexFromRelease(0, 5, 10, 0, 40)).toBe(0);
      expect(resolveWheelIndexFromRelease(4, 5, -10, 0, 40)).toBe(4);
    });
  });

  describe('wheelTrackTranslateY', () => {
    it('is the negative index offset plus the in-progress drag', () => {
      expect(wheelTrackTranslateY(1, 40, 0)).toBe(-40);
      expect(wheelTrackTranslateY(1, 40, 10)).toBe(-30);
      expect(wheelTrackTranslateY(0, 40, 0)).toBe(0);
    });
  });
});
