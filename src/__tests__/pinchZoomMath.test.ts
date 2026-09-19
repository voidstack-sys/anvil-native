import {
  clampPanTranslate,
  clampScale,
  distanceBetweenTouches,
} from '../internal/pinchZoomMath';

describe('pinchZoomMath', () => {
  describe('distanceBetweenTouches', () => {
    it('returns 0 with fewer than two touches', () => {
      expect(distanceBetweenTouches([])).toBe(0);
      expect(distanceBetweenTouches([{ pageX: 0, pageY: 0 }])).toBe(0);
    });

    it('returns the Euclidean distance between the first two touches', () => {
      expect(
        distanceBetweenTouches([
          { pageX: 0, pageY: 0 },
          { pageX: 3, pageY: 4 },
        ])
      ).toBe(5);
    });
  });

  describe('clampScale', () => {
    it('leaves an in-range scale unchanged', () => {
      expect(clampScale(2, 1, 4)).toBe(2);
    });

    it('clamps below minScale and above maxScale', () => {
      expect(clampScale(0.5, 1, 4)).toBe(1);
      expect(clampScale(10, 1, 4)).toBe(4);
    });
  });

  describe('clampPanTranslate', () => {
    it('is always 0 at scale <= 1', () => {
      expect(clampPanTranslate(50, 300, 1)).toBe(0);
      expect(clampPanTranslate(50, 300, 0.5)).toBe(0);
    });

    it('allows panning within the overflow created by scaling', () => {
      // containerSize 300, scale 2 -> overflow bound is (300*(2-1))/2 = 150
      expect(clampPanTranslate(100, 300, 2)).toBe(100);
      expect(clampPanTranslate(-100, 300, 2)).toBe(-100);
    });

    it('clamps beyond the overflow bound', () => {
      expect(clampPanTranslate(9999, 300, 2)).toBe(150);
      expect(clampPanTranslate(-9999, 300, 2)).toBe(-150);
    });
  });
});
