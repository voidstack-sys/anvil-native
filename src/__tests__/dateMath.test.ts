import { clampDateToRange, clampDay, daysInMonth } from '../internal/dateMath';

describe('dateMath', () => {
  describe('daysInMonth', () => {
    it('returns 31 for January', () => {
      expect(daysInMonth(2026, 0)).toBe(31);
    });

    it('returns 28 for February in a common year', () => {
      expect(daysInMonth(2026, 1)).toBe(28);
    });

    it('returns 29 for February in a leap year', () => {
      expect(daysInMonth(2024, 1)).toBe(29);
    });

    it('returns 30 for April', () => {
      expect(daysInMonth(2026, 3)).toBe(30);
    });
  });

  describe('clampDay', () => {
    it('leaves a valid day unchanged', () => {
      expect(clampDay(15, 2026, 0)).toBe(15);
    });

    it('clamps down to the last valid day of the month', () => {
      expect(clampDay(31, 2026, 1)).toBe(28);
      expect(clampDay(31, 2024, 1)).toBe(29);
    });
  });

  describe('clampDateToRange', () => {
    const date = new Date(2026, 5, 15);

    it('leaves a date inside the range unchanged', () => {
      const min = new Date(2026, 0, 1);
      const max = new Date(2026, 11, 31);
      expect(clampDateToRange(date, min, max).getTime()).toBe(date.getTime());
    });

    it('clamps to minimumDate when before it', () => {
      const min = new Date(2026, 6, 1);
      expect(clampDateToRange(date, min, undefined).getTime()).toBe(
        min.getTime()
      );
    });

    it('clamps to maximumDate when after it', () => {
      const max = new Date(2026, 4, 1);
      expect(clampDateToRange(date, undefined, max).getTime()).toBe(
        max.getTime()
      );
    });

    it('is a no-op when neither bound is given', () => {
      expect(clampDateToRange(date).getTime()).toBe(date.getTime());
    });
  });
});
