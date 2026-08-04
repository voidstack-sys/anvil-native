import {
  computePosition,
  type Rect,
  type Size,
} from '../primitives/Popover/positioning';

const WINDOW: Size = { width: 400, height: 800 };
const CONTENT: Size = { width: 100, height: 50 };

function anchorAt(x: number, y: number, width = 40, height = 20): Rect {
  return { x, y, width, height };
}

describe('computePosition', () => {
  it('places content below the anchor by default', () => {
    const result = computePosition({
      anchorRect: anchorAt(150, 100),
      contentSize: CONTENT,
      windowSize: WINDOW,
      side: 'bottom',
      align: 'center',
      sideOffset: 8,
      alignOffset: 0,
      avoidCollisions: true,
    });

    expect(result.side).toBe('bottom');
    expect(result.top).toBe(100 + 20 + 8); // anchor.y + anchor.height + sideOffset
  });

  it('centers on the cross axis by default', () => {
    const result = computePosition({
      anchorRect: anchorAt(150, 100, 40, 20),
      contentSize: CONTENT,
      windowSize: WINDOW,
      side: 'bottom',
      align: 'center',
      sideOffset: 0,
      alignOffset: 0,
      avoidCollisions: true,
    });

    // anchor center x = 150 + 20 = 170; content centered -> left = 170 - 50 = 120
    expect(result.left).toBe(120);
  });

  it('aligns to start/end of the anchor', () => {
    const start = computePosition({
      anchorRect: anchorAt(150, 100, 40, 20),
      contentSize: CONTENT,
      windowSize: WINDOW,
      side: 'bottom',
      align: 'start',
      sideOffset: 0,
      alignOffset: 0,
      avoidCollisions: true,
    });
    expect(start.left).toBe(150);

    const end = computePosition({
      anchorRect: anchorAt(150, 100, 40, 20),
      contentSize: CONTENT,
      windowSize: WINDOW,
      side: 'bottom',
      align: 'end',
      sideOffset: 0,
      alignOffset: 0,
      avoidCollisions: true,
    });
    expect(end.left).toBe(150 + 40 - 100); // anchor right edge - content width
  });

  it('flips to the top when there is no room below', () => {
    const result = computePosition({
      anchorRect: anchorAt(150, 780, 40, 20), // near the bottom edge of an 800px-tall window
      contentSize: CONTENT, // 50 tall
      windowSize: WINDOW,
      side: 'bottom',
      align: 'center',
      sideOffset: 8,
      alignOffset: 0,
      avoidCollisions: true,
    });

    expect(result.side).toBe('top');
    expect(result.top).toBe(780 - 50 - 8); // anchor.y - contentSize.height - sideOffset
  });

  it('flips to the left when there is no room on the right', () => {
    const result = computePosition({
      anchorRect: anchorAt(350, 100, 40, 20), // near the right edge of a 400px-wide window
      contentSize: CONTENT, // 100 wide
      windowSize: WINDOW,
      side: 'right',
      align: 'center',
      sideOffset: 8,
      alignOffset: 0,
      avoidCollisions: true,
    });

    expect(result.side).toBe('left');
  });

  it('does not flip when avoidCollisions is false, even if it overflows', () => {
    const result = computePosition({
      anchorRect: anchorAt(150, 780, 40, 20),
      contentSize: CONTENT,
      windowSize: WINDOW,
      side: 'bottom',
      align: 'center',
      sideOffset: 8,
      alignOffset: 0,
      avoidCollisions: false,
    });

    expect(result.side).toBe('bottom');
  });

  it('clamps the cross axis so content never renders off-screen', () => {
    const result = computePosition({
      anchorRect: anchorAt(10, 100, 20, 20), // near the left edge
      contentSize: CONTENT, // wider than the anchor, would push off-screen to the left
      windowSize: WINDOW,
      side: 'bottom',
      align: 'center',
      sideOffset: 0,
      alignOffset: 0,
      avoidCollisions: true,
    });

    expect(result.left).toBeGreaterThanOrEqual(0);
  });

  it('does not flip when the opposite side does not fit either', () => {
    const tinyWindow: Size = { width: 400, height: 60 };
    const result = computePosition({
      anchorRect: anchorAt(150, 20, 40, 20),
      contentSize: CONTENT, // 50 tall, doesn't fit above or below in a 60px window
      windowSize: tinyWindow,
      side: 'bottom',
      align: 'center',
      sideOffset: 8,
      alignOffset: 0,
      avoidCollisions: true,
    });

    // Neither side fits, so it stays on the originally requested side.
    expect(result.side).toBe('bottom');
  });

  it('applies sideOffset and alignOffset', () => {
    const result = computePosition({
      anchorRect: anchorAt(150, 100, 40, 20),
      contentSize: CONTENT,
      windowSize: WINDOW,
      side: 'bottom',
      align: 'start',
      sideOffset: 12,
      alignOffset: 5,
      avoidCollisions: true,
    });

    expect(result.top).toBe(100 + 20 + 12);
    expect(result.left).toBe(150 + 5);
  });
});
