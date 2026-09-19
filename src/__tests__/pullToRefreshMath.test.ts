import {
  applyPullResistance,
  pullProgress,
} from '../internal/pullToRefreshMath';

describe('pullToRefreshMath', () => {
  describe('applyPullResistance', () => {
    it('tracks the raw distance 1:1 below the threshold', () => {
      expect(applyPullResistance(0, 80)).toBe(0);
      expect(applyPullResistance(40, 80)).toBe(40);
      expect(applyPullResistance(80, 80)).toBe(80);
    });

    it('clamps negative raw distances to 0', () => {
      expect(applyPullResistance(-20, 80)).toBe(0);
    });

    it('eases distance past the threshold by the resistance factor', () => {
      expect(applyPullResistance(180, 80, 0.3)).toBeCloseTo(80 + 100 * 0.3);
    });

    it('defaults to a 0.3 resistance factor', () => {
      expect(applyPullResistance(180, 80)).toBeCloseTo(
        applyPullResistance(180, 80, 0.3)
      );
    });
  });

  describe('pullProgress', () => {
    it('is 0 at no pull and 1 at the threshold', () => {
      expect(pullProgress(0, 80)).toBe(0);
      expect(pullProgress(80, 80)).toBe(1);
    });

    it('is proportional between 0 and the threshold', () => {
      expect(pullProgress(40, 80)).toBe(0.5);
    });

    it('clamps to 1 past the threshold', () => {
      expect(pullProgress(200, 80)).toBe(1);
    });

    it('is 0 when the threshold is 0 or negative', () => {
      expect(pullProgress(40, 0)).toBe(0);
      expect(pullProgress(40, -10)).toBe(0);
    });
  });
});
