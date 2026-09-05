import {
  clampCarouselDragOffset,
  resolvePageFromRelease,
  trackTranslateX,
} from '../internal/carouselMath';

describe('carouselMath', () => {
  describe('clampCarouselDragOffset', () => {
    it('allows dragging right (revealing the previous page) when not on the first page', () => {
      expect(clampCarouselDragOffset(150, 1, 3, 300)).toBe(150);
      expect(clampCarouselDragOffset(9999, 1, 3, 300)).toBe(300);
    });

    it('disallows dragging right at all on the first page', () => {
      expect(clampCarouselDragOffset(150, 0, 3, 300)).toBe(0);
    });

    it('allows dragging left (revealing the next page) when not on the last page', () => {
      expect(clampCarouselDragOffset(-150, 0, 3, 300)).toBe(-150);
      expect(clampCarouselDragOffset(-9999, 0, 3, 300)).toBe(-300);
    });

    it('disallows dragging left at all on the last page', () => {
      expect(clampCarouselDragOffset(-150, 2, 3, 300)).toBe(0);
    });
  });

  describe('resolvePageFromRelease', () => {
    it('advances to the next page past the distance threshold', () => {
      expect(resolvePageFromRelease(0, 3, -70, 0, 300)).toBe(1);
    });

    it('advances to the next page on a fast enough flick, even if short', () => {
      expect(resolvePageFromRelease(0, 3, -10, -1, 300)).toBe(1);
    });

    it('goes back to the previous page past the distance threshold', () => {
      expect(resolvePageFromRelease(1, 3, 70, 0, 300)).toBe(0);
    });

    it('snaps back to the current page below both thresholds', () => {
      expect(resolvePageFromRelease(1, 3, 20, 0, 300)).toBe(1);
    });

    it('clamps to the first/last page', () => {
      expect(resolvePageFromRelease(0, 3, 70, 0, 300)).toBe(0);
      expect(resolvePageFromRelease(2, 3, -70, 0, 300)).toBe(2);
    });
  });

  describe('trackTranslateX', () => {
    it('is the negative page offset plus the in-progress drag', () => {
      expect(trackTranslateX(1, 300, 0)).toBe(-300);
      expect(trackTranslateX(1, 300, 50)).toBe(-250);
      expect(trackTranslateX(0, 300, 0)).toBe(0);
    });
  });
});
