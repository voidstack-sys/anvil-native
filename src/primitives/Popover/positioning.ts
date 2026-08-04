export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export type PopoverSide = 'top' | 'bottom' | 'left' | 'right';
export type PopoverAlign = 'start' | 'center' | 'end';

export interface ComputePositionOptions {
  anchorRect: Rect;
  contentSize: Size;
  windowSize: Size;
  side: PopoverSide;
  align: PopoverAlign;
  sideOffset: number;
  alignOffset: number;
  avoidCollisions: boolean;
}

export interface ComputedPosition {
  top: number;
  left: number;
  /** The side actually used, which may differ from the requested `side` if it got flipped to fit. */
  side: PopoverSide;
}

const OPPOSITE_SIDE: Record<PopoverSide, PopoverSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function primaryAxisPosition(
  side: PopoverSide,
  anchorRect: Rect,
  contentSize: Size,
  sideOffset: number
): number {
  switch (side) {
    case 'top':
      return anchorRect.y - contentSize.height - sideOffset;
    case 'bottom':
      return anchorRect.y + anchorRect.height + sideOffset;
    case 'left':
      return anchorRect.x - contentSize.width - sideOffset;
    case 'right':
      return anchorRect.x + anchorRect.width + sideOffset;
  }
}

function fitsOnSide(
  side: PopoverSide,
  anchorRect: Rect,
  contentSize: Size,
  windowSize: Size,
  sideOffset: number
): boolean {
  const position = primaryAxisPosition(
    side,
    anchorRect,
    contentSize,
    sideOffset
  );
  switch (side) {
    case 'top':
    case 'left':
      return position >= 0;
    case 'bottom':
      return position + contentSize.height <= windowSize.height;
    case 'right':
      return position + contentSize.width <= windowSize.width;
  }
}

function crossAxisPosition(
  anchorStart: number,
  anchorSize: number,
  contentSize: number,
  align: PopoverAlign,
  offset: number
): number {
  switch (align) {
    case 'start':
      return anchorStart + offset;
    case 'end':
      return anchorStart + anchorSize - contentSize + offset;
    case 'center':
      return anchorStart + anchorSize / 2 - contentSize / 2 + offset;
  }
}

/**
 * Pure geometry: given where the anchor and window are, decides where the
 * floating content should sit. Flips to the opposite side when the
 * requested side doesn't fit (and the opposite does), and clamps the
 * cross-axis position so content never renders off-screen.
 */
export function computePosition(
  options: ComputePositionOptions
): ComputedPosition {
  const {
    anchorRect,
    contentSize,
    windowSize,
    side,
    align,
    sideOffset,
    alignOffset,
    avoidCollisions,
  } = options;

  let resolvedSide = side;
  if (
    avoidCollisions &&
    !fitsOnSide(side, anchorRect, contentSize, windowSize, sideOffset) &&
    fitsOnSide(
      OPPOSITE_SIDE[side],
      anchorRect,
      contentSize,
      windowSize,
      sideOffset
    )
  ) {
    resolvedSide = OPPOSITE_SIDE[side];
  }

  const isVertical = resolvedSide === 'top' || resolvedSide === 'bottom';

  let top: number;
  let left: number;

  if (isVertical) {
    top = primaryAxisPosition(
      resolvedSide,
      anchorRect,
      contentSize,
      sideOffset
    );
    left = crossAxisPosition(
      anchorRect.x,
      anchorRect.width,
      contentSize.width,
      align,
      alignOffset
    );
    if (avoidCollisions) {
      left = clamp(left, 0, windowSize.width - contentSize.width);
    }
  } else {
    left = primaryAxisPosition(
      resolvedSide,
      anchorRect,
      contentSize,
      sideOffset
    );
    top = crossAxisPosition(
      anchorRect.y,
      anchorRect.height,
      contentSize.height,
      align,
      alignOffset
    );
    if (avoidCollisions) {
      top = clamp(top, 0, windowSize.height - contentSize.height);
    }
  }

  return { top, left, side: resolvedSide };
}
