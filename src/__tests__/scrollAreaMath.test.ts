import {
  clampScrollOffset,
  maxScrollOffset,
  scrollDeltaFromThumbDrag,
  thumbOffsetRatio,
  thumbSizeRatio,
} from '../internal/scrollAreaMath';

describe('scrollAreaMath', () => {
  describe('maxScrollOffset', () => {
    it('is the overflow amount when content exceeds the viewport', () => {
      expect(maxScrollOffset(1000, 400)).toBe(600);
    });

    it('is 0 when content fits entirely within the viewport', () => {
      expect(maxScrollOffset(300, 400)).toBe(0);
    });
  });

  describe('clampScrollOffset', () => {
    it('clamps to [0, maxScrollOffset]', () => {
      expect(clampScrollOffset(-50, 1000, 400)).toBe(0);
      expect(clampScrollOffset(9999, 1000, 400)).toBe(600);
      expect(clampScrollOffset(300, 1000, 400)).toBe(300);
    });
  });

  describe('thumbSizeRatio', () => {
    it('is the viewport/content ratio when content overflows', () => {
      expect(thumbSizeRatio(400, 1000)).toBeCloseTo(0.4);
    });

    it('is capped at 1 when content fits within the viewport', () => {
      expect(thumbSizeRatio(400, 300)).toBe(1);
    });

    it('is 1 when either size is not yet measured (0)', () => {
      expect(thumbSizeRatio(0, 1000)).toBe(1);
      expect(thumbSizeRatio(400, 0)).toBe(1);
    });
  });

  describe('thumbOffsetRatio', () => {
    it('is 0 at the top/start', () => {
      expect(thumbOffsetRatio(0, 1000, 400)).toBe(0);
    });

    it('is 1 at the bottom/end', () => {
      expect(thumbOffsetRatio(600, 1000, 400)).toBe(1);
    });

    it('is proportional in between', () => {
      expect(thumbOffsetRatio(300, 1000, 400)).toBeCloseTo(0.5);
    });

    it('is 0 when nothing overflows (no meaningful offset)', () => {
      expect(thumbOffsetRatio(0, 300, 400)).toBe(0);
    });
  });

  describe('scrollDeltaFromThumbDrag', () => {
    it('scales the drag delta by the ratio of content travel to thumb travel', () => {
      // track=200, thumb occupies 40% of it (80px) -> thumb travels 120px
      // across a maxOffset of 600 -- so a 12px thumb drag should move the
      // content by 60px (120px of travel maps to 600px of content).
      expect(scrollDeltaFromThumbDrag(12, 200, 1000, 400)).toBeCloseTo(60);
    });

    it('is 0 when nothing overflows', () => {
      expect(scrollDeltaFromThumbDrag(50, 200, 300, 400)).toBe(0);
    });

    it('is 0 when the track has not been measured yet', () => {
      expect(scrollDeltaFromThumbDrag(50, 0, 1000, 400)).toBe(0);
    });
  });
});
