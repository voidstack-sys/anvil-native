import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  PanResponder,
  ScrollView,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type PanResponderGestureState,
  type ScrollViewProps,
  type ViewProps,
} from 'react-native';
import { typeChangeMessage, useWarnOnceWhen } from '../../internal/devWarnings';
import {
  clampScrollOffset,
  maxScrollOffset,
  scrollDeltaFromThumbDrag,
  thumbOffsetRatio,
  thumbSizeRatio,
} from '../../internal/scrollAreaMath';

export type ScrollAreaOrientation = 'vertical' | 'horizontal';

type ScrollViewRef = React.ComponentRef<typeof ScrollView>;

interface ScrollAreaContextValue {
  orientation: ScrollAreaOrientation;
  contentSize: number;
  viewportSize: number;
  trackSize: number;
  scrollOffset: number;
  setContentSize: (size: number) => void;
  setViewportSize: (size: number) => void;
  setTrackSize: (size: number) => void;
  setScrollOffset: (offset: number) => void;
  scrollTo: (offset: number) => void;
  viewportRef: React.RefObject<ScrollViewRef | null>;
}

const ScrollAreaContext = createContext<ScrollAreaContextValue | null>(null);

function useScrollAreaContext(component: string): ScrollAreaContextValue {
  const context = useContext(ScrollAreaContext);
  if (!context) {
    throw new Error(
      `ScrollArea.${component} must be used within a ScrollArea.Root`
    );
  }
  return context;
}

export interface ScrollAreaRootProps extends Omit<ViewProps, 'children'> {
  /** Which axis scrolls. Expected to stay constant for the component's lifetime. Defaults to `'vertical'`. */
  orientation?: ScrollAreaOrientation;
  children: React.ReactNode;
}

export interface ScrollAreaHandle {
  scrollTo: (offset: number) => void;
  getScrollOffset: () => number;
}

const Root = forwardRef<ScrollAreaHandle, ScrollAreaRootProps>(
  function ScrollAreaRoot(
    { orientation = 'vertical', children, ...viewProps },
    ref
  ) {
    const initialOrientation = useRef(orientation).current;
    useWarnOnceWhen(orientation !== initialOrientation, () =>
      typeChangeMessage(
        'ScrollArea.Root',
        initialOrientation,
        orientation,
        'orientation'
      )
    );

    const [contentSize, setContentSize] = useState(0);
    const [viewportSize, setViewportSize] = useState(0);
    const [trackSize, setTrackSize] = useState(0);
    const [scrollOffset, setScrollOffset] = useState(0);
    const viewportRef = useRef<ScrollViewRef>(null);

    // Kept in a ref (rather than only in state) so `scrollTo` can clamp
    // against the latest sizes without needing them in its own deps.
    const sizesRef = useRef({ contentSize, viewportSize });
    sizesRef.current = { contentSize, viewportSize };

    const scrollTo = useCallback(
      (offset: number) => {
        const { contentSize: content, viewportSize: viewport } =
          sizesRef.current;
        const clamped = clampScrollOffset(offset, content, viewport);
        const node = viewportRef.current;
        if (node) {
          if (orientation === 'vertical') {
            node.scrollTo({ y: clamped, animated: false });
          } else {
            node.scrollTo({ x: clamped, animated: false });
          }
        }
        setScrollOffset(clamped);
      },
      [orientation]
    );

    useImperativeHandle(
      ref,
      () => ({
        scrollTo,
        getScrollOffset: () => scrollOffset,
      }),
      [scrollTo, scrollOffset]
    );

    const contextValue = useMemo(
      () => ({
        orientation,
        contentSize,
        viewportSize,
        trackSize,
        scrollOffset,
        setContentSize,
        setViewportSize,
        setTrackSize,
        setScrollOffset,
        scrollTo,
        viewportRef,
      }),
      [
        orientation,
        contentSize,
        viewportSize,
        trackSize,
        scrollOffset,
        scrollTo,
      ]
    );

    return (
      <ScrollAreaContext.Provider value={contextValue}>
        <View {...viewProps}>{children}</View>
      </ScrollAreaContext.Provider>
    );
  }
);
Root.displayName = 'ScrollArea.Root';

export type ScrollAreaViewportProps = Omit<ScrollViewProps, 'horizontal'>;

const Viewport = forwardRef<ScrollViewRef, ScrollAreaViewportProps>(
  function ScrollAreaViewport(
    { onScroll, onContentSizeChange, onLayout, ...scrollViewProps },
    forwardedRef
  ) {
    const {
      orientation,
      setContentSize,
      setViewportSize,
      setScrollOffset,
      viewportRef,
    } = useScrollAreaContext('Viewport');

    const setRefs = useCallback(
      (node: ScrollViewRef | null) => {
        viewportRef.current = node;
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef, viewportRef]
    );

    const handleScroll = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { x, y } = event.nativeEvent.contentOffset;
        setScrollOffset(orientation === 'vertical' ? y : x);
        onScroll?.(event);
      },
      [orientation, setScrollOffset, onScroll]
    );

    const handleContentSizeChange = useCallback(
      (width: number, height: number) => {
        setContentSize(orientation === 'vertical' ? height : width);
        onContentSizeChange?.(width, height);
      },
      [orientation, setContentSize, onContentSizeChange]
    );

    const handleLayout = useCallback(
      (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setViewportSize(orientation === 'vertical' ? height : width);
        onLayout?.(event);
      },
      [orientation, setViewportSize, onLayout]
    );

    return (
      <ScrollView
        ref={setRefs}
        horizontal={orientation === 'horizontal'}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        {...scrollViewProps}
      />
    );
  }
);
Viewport.displayName = 'ScrollArea.Viewport';

export interface ScrollAreaScrollbarProps extends Omit<ViewProps, 'children'> {
  /** Keep rendered even when there's nothing to scroll. Defaults to `false` (hidden). */
  forceMount?: boolean;
  children?: React.ReactNode;
}

function Scrollbar({
  forceMount = false,
  onLayout,
  children,
  ...viewProps
}: ScrollAreaScrollbarProps) {
  const { orientation, contentSize, viewportSize, setTrackSize } =
    useScrollAreaContext('Scrollbar');
  const isScrollable = contentSize > viewportSize;

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      setTrackSize(orientation === 'vertical' ? height : width);
      onLayout?.(event);
    },
    [orientation, setTrackSize, onLayout]
  );

  if (!isScrollable && !forceMount) {
    return null;
  }

  return (
    // Decorative: it's a visual echo of the Viewport's own native scroll
    // affordance, which already carries its own accessibility handling --
    // same rationale as Badge and SpeedDial.Backdrop.
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={handleLayout}
      {...viewProps}
    >
      {children}
    </View>
  );
}
Scrollbar.displayName = 'ScrollArea.Scrollbar';

export type ScrollAreaThumbRenderProps = {
  /** The thumb's length as a fraction (0-1) of the track -- 1 when nothing overflows. */
  size: number;
  /** How far along the track the thumb sits, as a fraction (0-1). */
  offset: number;
};

export interface ScrollAreaThumbProps extends Omit<ViewProps, 'children'> {
  children?:
    React.ReactNode | ((state: ScrollAreaThumbRenderProps) => React.ReactNode);
}

function Thumb({ style, children, ...viewProps }: ScrollAreaThumbProps) {
  const context = useScrollAreaContext('Thumb');
  const { contentSize, viewportSize, scrollOffset } = context;

  // Keeps the PanResponder's handlers (created once) reading fresh
  // sizes/scrollOffset without recreating them every render -- same
  // technique BottomSheet.Handle and Slider.Thumb use.
  const latestRef = useRef(context);
  latestRef.current = context;
  const dragStartOffsetRef = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () =>
        latestRef.current.contentSize > latestRef.current.viewportSize,
      onMoveShouldSetPanResponder: (
        _event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        const {
          orientation,
          contentSize: content,
          viewportSize: viewport,
        } = latestRef.current;
        const delta =
          orientation === 'vertical' ? gestureState.dy : gestureState.dx;
        return content > viewport && Math.abs(delta) > 2;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        dragStartOffsetRef.current = latestRef.current.scrollOffset;
      },
      onPanResponderMove: (
        _event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        const {
          orientation,
          trackSize: track,
          contentSize: content,
          viewportSize: viewport,
        } = latestRef.current;
        const dragDelta =
          orientation === 'vertical' ? gestureState.dy : gestureState.dx;
        const scrollDelta = scrollDeltaFromThumbDrag(
          dragDelta,
          track,
          content,
          viewport
        );
        latestRef.current.scrollTo(dragStartOffsetRef.current + scrollDelta);
      },
    })
  ).current;

  const size = thumbSizeRatio(viewportSize, contentSize);
  const offset = thumbOffsetRatio(scrollOffset, contentSize, viewportSize);
  const isScrollable = maxScrollOffset(contentSize, viewportSize) > 0;

  return (
    <View
      {...(isScrollable ? panResponder.panHandlers : null)}
      style={style}
      {...viewProps}
    >
      {typeof children === 'function' ? children({ size, offset }) : children}
    </View>
  );
}
Thumb.displayName = 'ScrollArea.Thumb';

export const ScrollArea = {
  Root,
  Viewport,
  Scrollbar,
  Thumb,
};
