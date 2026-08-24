import { clampRatingValue, valueFromLocationX } from '../internal/ratingMath';

describe('ratingMath', () => {
  describe('clampRatingValue', () => {
    it('clamps to [0, max]', () => {
      expect(clampRatingValue(-3, 5)).toBe(0);
      expect(clampRatingValue(9, 5)).toBe(5);
    });

    it('rounds to the nearest integer', () => {
      expect(clampRatingValue(2.6, 5)).toBe(3);
      expect(clampRatingValue(2.4, 5)).toBe(2);
    });
  });

  describe('valueFromLocationX', () => {
    it('maps a touch position to the item it falls under (1-indexed value)', () => {
      // 5 items across a 100px row -> 20px each.
      expect(valueFromLocationX(5, 100, 5)).toBe(1);
      expect(valueFromLocationX(25, 100, 5)).toBe(2);
      expect(valueFromLocationX(99, 100, 5)).toBe(5);
    });

    it('clamps touches outside the row to the nearest end', () => {
      // Before the row starts reads as "no rating" (0), not the first item.
      expect(valueFromLocationX(-10, 100, 5)).toBe(0);
      expect(valueFromLocationX(500, 100, 5)).toBe(5);
    });

    it('returns 0 when rowWidth is 0 (not yet measured)', () => {
      expect(valueFromLocationX(50, 0, 5)).toBe(0);
    });
  });
});
