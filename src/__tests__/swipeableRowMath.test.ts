import {
  clampSwipeOffset,
  offsetForSide,
  resolveSideFromRelease,
} from '../internal/swipeableRowMath';

describe('swipeableRowMath', () => {
  describe('offsetForSide', () => {
    it('maps each side to its signed offset', () => {
      expect(offsetForSide('left', 80, 60)).toBe(80);
      expect(offsetForSide('right', 80, 60)).toBe(-60);
      expect(offsetForSide('none', 80, 60)).toBe(0);
    });
  });

  describe('clampSwipeOffset', () => {
    it('clamps to [-rightActionsWidth, leftActionsWidth]', () => {
      expect(clampSwipeOffset(200, 80, 60)).toBe(80);
      expect(clampSwipeOffset(-200, 80, 60)).toBe(-60);
      expect(clampSwipeOffset(20, 80, 60)).toBe(20);
    });

    it('clamps to 0 on a side with no actions', () => {
      expect(clampSwipeOffset(50, 0, 60)).toBe(0);
      // `Math.max(-0, -50)` is `-0`, not `0` -- toBeCloseTo treats them the
      // same, since they're equivalent for a translateX transform.
      expect(clampSwipeOffset(-50, 80, 0)).toBeCloseTo(0);
    });
  });

  describe('resolveSideFromRelease', () => {
    it('opens left when dragged past half the left width', () => {
      expect(resolveSideFromRelease(41, 80, 60, 0)).toBe('left');
      expect(resolveSideFromRelease(39, 80, 60, 0)).toBe('none');
    });

    it('opens right when dragged past half the right width', () => {
      expect(resolveSideFromRelease(-31, 80, 60, 0)).toBe('right');
      expect(resolveSideFromRelease(-29, 80, 60, 0)).toBe('none');
    });

    it('opens on a fast flick even below the distance threshold', () => {
      expect(resolveSideFromRelease(10, 80, 60, 0.8)).toBe('left');
      expect(resolveSideFromRelease(-10, 80, 60, -0.8)).toBe('right');
    });

    it('returns none when the offset is exactly 0', () => {
      expect(resolveSideFromRelease(0, 80, 60, 0)).toBe('none');
    });
  });
});
