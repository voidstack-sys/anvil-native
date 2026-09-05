import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  PanResponder,
  View,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type PanResponderGestureState,
  type ViewProps,
} from 'react-native';
import {
  controlledChangeMessage,
  useWarnOnceWhen,
} from '../../internal/devWarnings';
import {
  clampCarouselDragOffset,
  resolvePageFromRelease,
  trackTranslateX,
} from '../../internal/carouselMath';

function clampPage(page: number, count: number): number {
  return Math.min(Math.max(page, 0), Math.max(count - 1, 0));
}

interface CarouselContextValue {
  page: number;
  count: number;
  disabled: boolean;
  viewportWidth: number;
  dragOffset: number;
  isDraggingRef: React.RefObject<boolean>;
  setViewportWidth: (width: number) => void;
  setDragOffset: (offset: number) => void;
  goToPage: (page: number) => void;
  next: () => void;
  previous: () => void;
}

const CarouselContext = createContext<CarouselContextValue | null>(null);

function useCarouselContext(component: string): CarouselContextValue {
  const context = useContext(CarouselContext);
  if (!context) {
    throw new Error(
      `Carousel.${component} must be used within a Carousel.Root`
    );
  }
  return context;
}

export interface CarouselRootProps {
  /** Total number of slides. */
  count: number;
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  /** Disables the drag gesture and accessibility actions. */
  disabled?: boolean;
  children: React.ReactNode;
}

export interface CarouselHandle {
  getPage: () => number;
  setPage: (page: number) => void;
  next: () => void;
  previous: () => void;
}

const Root = forwardRef<CarouselHandle, CarouselRootProps>(
  function CarouselRoot(
    { count, page, defaultPage = 0, onPageChange, disabled = false, children },
    ref
  ) {
    const isControlled = page !== undefined;
    const initialIsControlled = useRef(isControlled).current;

    useWarnOnceWhen(isControlled !== initialIsControlled, () =>
      controlledChangeMessage(
        'Carousel.Root',
        initialIsControlled,
        isControlled,
        'page'
      )
    );
    useWarnOnceWhen(
      count <= 0,
      () =>
        `Carousel.Root: \`count\` must be greater than 0, received ${count}.`
    );

    const [uncontrolledPage, setUncontrolledPage] = useState(() =>
      clampPage(defaultPage, count)
    );
    const currentPage = clampPage(
      isControlled ? (page ?? 0) : uncontrolledPage,
      count
    );

    const setPage = useCallback(
      (next: number) => {
        const clamped = clampPage(next, count);
        if (!isControlled) {
          setUncontrolledPage(clamped);
        }
        onPageChange?.(clamped);
      },
      [isControlled, count, onPageChange]
    );

    const goToPage = setPage;
    const next = useCallback(
      () => goToPage(currentPage + 1),
      [goToPage, currentPage]
    );
    const previous = useCallback(
      () => goToPage(currentPage - 1),
      [goToPage, currentPage]
    );

    const [viewportWidth, setViewportWidth] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const isDraggingRef = useRef(false);

    // Keeps the track snapped to the committed page whenever it changes from
    // the outside (a controlled `page` update, or an imperative call) -- but
    // never while a drag is actively in progress, since the gesture owns the
    // offset until it's released. Mirrors SwipeableRow's same guard.
    useEffect(() => {
      if (isDraggingRef.current) return;
      setDragOffset(0);
    }, [currentPage]);

    useImperativeHandle(
      ref,
      () => ({
        getPage: () => currentPage,
        setPage,
        next,
        previous,
      }),
      [currentPage, setPage, next, previous]
    );

    const contextValue = useMemo(
      () => ({
        page: currentPage,
        count,
        disabled,
        viewportWidth,
        dragOffset,
        isDraggingRef,
        setViewportWidth,
        setDragOffset,
        goToPage,
        next,
        previous,
      }),
      [
        currentPage,
        count,
        disabled,
        viewportWidth,
        dragOffset,
        goToPage,
        next,
        previous,
      ]
    );

    return (
      <CarouselContext.Provider value={contextValue}>
        {children}
      </CarouselContext.Provider>
    );
  }
);
Root.displayName = 'Carousel.Root';

export interface CarouselViewportProps extends Omit<ViewProps, 'children'> {
  children: React.ReactNode;
}

function Viewport({ onLayout, ...viewProps }: CarouselViewportProps) {
  const { page, count, disabled, setViewportWidth, goToPage } =
    useCarouselContext('Viewport');

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      setViewportWidth(event.nativeEvent.layout.width);
      onLayout?.(event);
    },
    [setViewportWidth, onLayout]
  );

  const handleAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      if (disabled) return;
      if (event.nativeEvent.actionName === 'increment') {
        goToPage(page + 1);
      } else if (event.nativeEvent.actionName === 'decrement') {
        goToPage(page - 1);
      }
    },
    [disabled, page, goToPage]
  );

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityValue={{ min: 0, max: Math.max(count - 1, 0), now: page }}
      accessibilityState={{ disabled }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={handleAccessibilityAction}
      onLayout={handleLayout}
      {...viewProps}
    />
  );
}
Viewport.displayName = 'Carousel.Viewport';

export type CarouselTrackRenderProps = {
  /** How far (px) the track is currently dragged from its resting position. */
  dragOffset: number;
};

export interface CarouselTrackProps extends Omit<ViewProps, 'children'> {
  children:
    React.ReactNode | ((state: CarouselTrackRenderProps) => React.ReactNode);
}

function Track({ style, children, ...viewProps }: CarouselTrackProps) {
  const context = useCarouselContext('Track');
  const { page, viewportWidth, dragOffset } = context;

  // Keeps the PanResponder's handlers (created once) reading fresh context
  // without recreating them every render -- same technique
  // SwipeableRow.Content/BottomSheet.Handle use.
  const latestRef = useRef(context);
  latestRef.current = context;
  const offsetAtGrantRef = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      // Never claim on mere touch-down -- a carousel commonly lives inside a
      // vertically-scrolling page, and grabbing the responder immediately
      // would break that page's own scroll gesture.
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (
        _event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) =>
        !latestRef.current.disabled &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
        Math.abs(gestureState.dx) > 4,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        latestRef.current.isDraggingRef.current = true;
        offsetAtGrantRef.current = latestRef.current.dragOffset;
      },
      onPanResponderMove: (
        _event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        const current = latestRef.current;
        current.setDragOffset(
          clampCarouselDragOffset(
            offsetAtGrantRef.current + gestureState.dx,
            current.page,
            current.count,
            current.viewportWidth
          )
        );
      },
      onPanResponderRelease: (
        _event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        const current = latestRef.current;
        current.isDraggingRef.current = false;
        const nextPage = resolvePageFromRelease(
          current.page,
          current.count,
          current.dragOffset,
          gestureState.vx,
          current.viewportWidth
        );
        current.setDragOffset(0);
        current.goToPage(nextPage);
      },
      onPanResponderTerminate: () => {
        latestRef.current.isDraggingRef.current = false;
        latestRef.current.setDragOffset(0);
      },
    })
  ).current;

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.track,
        {
          transform: [
            { translateX: trackTranslateX(page, viewportWidth, dragOffset) },
          ],
        },
        style,
      ]}
      {...viewProps}
    >
      {typeof children === 'function' ? children({ dragOffset }) : children}
    </View>
  );
}
Track.displayName = 'Carousel.Track';

const styles = { track: { flexDirection: 'row' as const } };

export type CarouselSlideProps = Omit<ViewProps, 'children'> & {
  children?: ViewProps['children'];
};

function Slide({ style, ...viewProps }: CarouselSlideProps) {
  const { viewportWidth } = useCarouselContext('Slide');
  return <View style={[{ width: viewportWidth }, style]} {...viewProps} />;
}
Slide.displayName = 'Carousel.Slide';

export const Carousel = {
  Root,
  Viewport,
  Track,
  Slide,
};
