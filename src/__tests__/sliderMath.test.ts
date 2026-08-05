import {
  clampAgainstNeighbors,
  clampSliderValue,
  pixelDeltaToValue,
  roundToStep,
  valueToPercentage,
} from '../internal/sliderMath';

describe('sliderMath', () => {
  describe('roundToStep', () => {
    it('rounds to the nearest step relative to min', () => {
      expect(roundToStep(23, 0, 10)).toBe(20);
      expect(roundToStep(27, 0, 10)).toBe(30);
      expect(roundToStep(25, 10, 10)).toBe(30);
    });

    it('is a no-op when step is 0 or negative', () => {
      expect(roundToStep(23, 0, 0)).toBe(23);
      expect(roundToStep(23, 0, -5)).toBe(23);
    });
  });

  describe('clampSliderValue', () => {
    it('clamps to [min, max] after stepping', () => {
      expect(clampSliderValue(150, 0, 100, 10)).toBe(100);
      expect(clampSliderValue(-20, 0, 100, 10)).toBe(0);
    });

    it('steps a value within range', () => {
      expect(clampSliderValue(53, 0, 100, 10)).toBe(50);
    });
  });

  describe('clampAgainstNeighbors', () => {
    it('clamps a middle thumb between its neighbors', () => {
      const values = [10, 50, 90];
      expect(clampAgainstNeighbors(values, 1, 95, 0, 100, 1)).toBe(90);
      expect(clampAgainstNeighbors(values, 1, 5, 0, 100, 1)).toBe(10);
      expect(clampAgainstNeighbors(values, 1, 60, 0, 100, 1)).toBe(60);
    });

    it('clamps the first thumb against min and the next thumb', () => {
      const values = [10, 50];
      expect(clampAgainstNeighbors(values, 0, -20, 0, 100, 1)).toBe(0);
      expect(clampAgainstNeighbors(values, 0, 80, 0, 100, 1)).toBe(50);
    });

    it('clamps the last thumb against its previous neighbor and max', () => {
      const values = [10, 50];
      expect(clampAgainstNeighbors(values, 1, 5, 0, 100, 1)).toBe(10);
      expect(clampAgainstNeighbors(values, 1, 150, 0, 100, 1)).toBe(100);
    });

    it('never lets two thumbs cross, keeping the group ordered', () => {
      const values = [30, 30];
      const result = clampAgainstNeighbors(values, 0, 50, 0, 100, 1);
      expect(result).toBeLessThanOrEqual(values[1]!);
    });
  });

  describe('pixelDeltaToValue', () => {
    it('converts a pixel drag delta into a value delta proportional to track width', () => {
      expect(pixelDeltaToValue(50, 100, 200, 0, 100)).toBe(100);
      expect(pixelDeltaToValue(50, -50, 200, 0, 100)).toBe(25);
    });

    it('returns the start value unchanged when track width is 0 (not yet measured)', () => {
      expect(pixelDeltaToValue(50, 100, 0, 0, 100)).toBe(50);
    });
  });

  describe('valueToPercentage', () => {
    it('maps a value within [min, max] to 0-100', () => {
      expect(valueToPercentage(50, 0, 100)).toBe(50);
      expect(valueToPercentage(0, 0, 100)).toBe(0);
      expect(valueToPercentage(100, 0, 100)).toBe(100);
      expect(valueToPercentage(25, 0, 50)).toBe(50);
    });

    it('returns 0 when max <= min instead of dividing by zero', () => {
      expect(valueToPercentage(5, 10, 10)).toBe(0);
      expect(valueToPercentage(5, 10, 5)).toBe(0);
    });
  });
});
