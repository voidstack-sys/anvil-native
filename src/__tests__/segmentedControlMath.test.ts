import { segmentAtPosition } from '../internal/segmentedControlMath';

describe('segmentedControlMath', () => {
  describe('segmentAtPosition', () => {
    const segments = [
      { value: 'day', x: 0, width: 100 },
      { value: 'week', x: 100, width: 100 },
      { value: 'month', x: 200, width: 100 },
    ];

    it('finds the segment containing a position in its middle', () => {
      expect(segmentAtPosition(50, segments)).toBe('day');
      expect(segmentAtPosition(150, segments)).toBe('week');
      expect(segmentAtPosition(250, segments)).toBe('month');
    });

    it('treats the start edge as inclusive and the end edge as exclusive', () => {
      expect(segmentAtPosition(100, segments)).toBe('week');
      expect(segmentAtPosition(99.999, segments)).toBe('day');
    });

    it('returns null for a position outside every segment', () => {
      expect(segmentAtPosition(-10, segments)).toBeNull();
      expect(segmentAtPosition(300, segments)).toBeNull();
    });

    it('returns null when there are no segments', () => {
      expect(segmentAtPosition(50, [])).toBeNull();
    });
  });
});
