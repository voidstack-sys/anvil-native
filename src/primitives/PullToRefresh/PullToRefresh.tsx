import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  PanResponder,
  View,
  type GestureResponderEvent,
  type PanResponderGestureState,
  type ViewProps,
} from 'react-native';
import { useWarnOnceWhen } from '../../internal/devWarnings';
import {
  applyPullResistance,
  pullProgress,
} from '../../internal/pullToRefreshMath';

interface PullToRefreshContextValue {
  pullDistance: number;
  refreshing: boolean;
  disabled: boolean;
  threshold: number;
  scrollOffset: number;
  isDraggingRef: React.RefObject<boolean>;
  setPullDistance: (distance: number) => void;
  onRefreshRef: React.RefObject<(() => void) | undefined>;
}

const PullToRefreshContext = createContext<PullToRefreshContextValue | null>(
  null
);

function usePullToRefreshContext(component: string): PullToRefreshContextValue {
  const context = useContext(PullToRefreshContext);
  if (!context) {
    throw new Error(
      `PullToRefresh.${component} must be used within a PullToRefresh.Root`
    );
  }
  return context;
}

export interface PullToRefreshRootProps extends Omit<ViewProps, 'children'> {
  /**
   * Whether a refresh is currently in flight. There's no uncontrolled mode
   * for this one -- it always reflects a real async operation the consumer
   * owns (typically a network request), so there's no sensible internal
   * default to fall back to.
   */
  refreshing: boolean;
  /** Fires once, when a pull crosses `threshold` and is released. Flip `refreshing` to `true` in response. */
  onRefresh: () => void;
  /** How far (px) the content must be pulled before `onRefresh` fires. Defaults to `80`. */
  threshold?: number;
  /**
   * The wrapped scrollable's current vertical offset, so the pull gesture
   * only engages once it's scrolled to the top -- pass your `ScrollView`/
   * `FlatList`'s live `contentOffset.y` here. Omit for content that's
   * always at the top (e.g. short, non-scrolling content). Defaults to `0`.
   */
  scrollOffset?: number;
  disabled?: boolean;
  children: React.ReactNode;
}

const Root = function PullToRefreshRoot({
  refreshing,
  onRefresh,
  threshold = 80,
  scrollOffset = 0,
  disabled = false,
  children,
  style,
  ...viewProps
}: PullToRefreshRootProps) {
  useWarnOnceWhen(
    threshold <= 0,
    () =>
      `PullToRefresh.Root: \`threshold\` must be greater than 0, received ${threshold}.`
  );

  const [pullDistance, setPullDistance] = useState(0);
  const isDraggingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  // Keeps the indicator pinned at the threshold while a refresh is in
  // flight, and eases it back to 0 once the consumer flips `refreshing`
  // back to false -- but never while a drag is actively in progress, the
  // same guard SwipeableRow/Carousel use for their own committed-vs-dragging
  // state.
  useEffect(() => {
    if (isDraggingRef.current) return;
    setPullDistance(refreshing ? threshold : 0);
  }, [refreshing, threshold]);

  const handleAccessibilityAction = useCallback<
    NonNullable<ViewProps['onAccessibilityAction']>
  >(
    (event) => {
      if (disabled || refreshing) return;
      if (event.nativeEvent.actionName === 'activate') {
        onRefreshRef.current?.();
      }
    },
    [disabled, refreshing]
  );

  const contextValue = useMemo(
    () => ({
      pullDistance,
      refreshing,
      disabled,
      threshold,
      scrollOffset,
      isDraggingRef,
      setPullDistance,
      onRefreshRef,
    }),
    [pullDistance, refreshing, disabled, threshold, scrollOffset]
  );

  return (
    <PullToRefreshContext.Provider value={contextValue}>
      <View
        accessibilityState={{ disabled, busy: refreshing }}
        // A "magic tap"-style escape hatch for screen reader users, who
        // can't perform the drag gesture -- the same double coverage
        // Slider/Carousel/Stepper give their own gestures.
        accessibilityActions={[{ name: 'activate' }]}
        onAccessibilityAction={handleAccessibilityAction}
        style={[styles.root, style]}
        {...viewProps}
      >
        {children}
      </View>
    </PullToRefreshContext.Provider>
  );
};
Root.displayName = 'PullToRefresh.Root';

export type PullToRefreshIndicatorRenderProps = {
  pullDistance: number;
  progress: number;
  refreshing: boolean;
};

export interface PullToRefreshIndicatorProps extends Omit<
  ViewProps,
  'children'
> {
  children:
    | React.ReactNode
    | ((state: PullToRefreshIndicatorRenderProps) => React.ReactNode);
}

function Indicator({
  style,
  children,
  ...viewProps
}: PullToRefreshIndicatorProps) {
  const { pullDistance, refreshing, threshold } =
    usePullToRefreshContext('Indicator');
  const progress = pullProgress(pullDistance, threshold);

  return (
    <View
      // Informative, not decorative -- announce it while a refresh is
      // actually happening, the way a native activity indicator would be.
      accessibilityLiveRegion={refreshing ? 'polite' : 'none'}
      style={[
        styles.indicator,
        { transform: [{ translateY: pullDistance - threshold }] },
        style,
      ]}
      {...viewProps}
    >
      {typeof children === 'function'
        ? children({ pullDistance, progress, refreshing })
        : children}
    </View>
  );
}
Indicator.displayName = 'PullToRefresh.Indicator';

export type PullToRefreshContentRenderProps = {
  pullDistance: number;
  refreshing: boolean;
};

export interface PullToRefreshContentProps extends Omit<ViewProps, 'children'> {
  children:
    | React.ReactNode
    | ((state: PullToRefreshContentRenderProps) => React.ReactNode);
}

function Content({ style, children, ...viewProps }: PullToRefreshContentProps) {
  const context = usePullToRefreshContext('Content');
  const { pullDistance, refreshing } = context;

  // Keeps the PanResponder's handlers (created once) reading fresh context
  // without recreating them every render -- same technique
  // SwipeableRow.Content/Carousel.Track use.
  const latestRef = useRef(context);
  latestRef.current = context;
  const pullStartRef = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      // Never claim on mere touch-down -- the wrapped content is commonly
      // itself scrollable, and grabbing the responder immediately would
      // break its own scroll gesture.
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (
        _event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) =>
        !latestRef.current.disabled &&
        !latestRef.current.refreshing &&
        latestRef.current.scrollOffset <= 0 &&
        gestureState.dy > 4 &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        latestRef.current.isDraggingRef.current = true;
        pullStartRef.current = latestRef.current.pullDistance;
      },
      onPanResponderMove: (
        _event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        const current = latestRef.current;
        const raw = Math.max(0, pullStartRef.current + gestureState.dy);
        current.setPullDistance(applyPullResistance(raw, current.threshold));
      },
      onPanResponderRelease: () => {
        const current = latestRef.current;
        current.isDraggingRef.current = false;
        if (current.pullDistance >= current.threshold) {
          current.setPullDistance(current.threshold);
          current.onRefreshRef.current?.();
        } else {
          current.setPullDistance(0);
        }
      },
      onPanResponderTerminate: () => {
        latestRef.current.isDraggingRef.current = false;
        latestRef.current.setPullDistance(0);
      },
    })
  ).current;

  return (
    <View
      {...panResponder.panHandlers}
      style={[{ transform: [{ translateY: pullDistance }] }, style]}
      {...viewProps}
    >
      {typeof children === 'function'
        ? children({ pullDistance, refreshing })
        : children}
    </View>
  );
}
Content.displayName = 'PullToRefresh.Content';

const styles = {
  root: { position: 'relative' as const, overflow: 'hidden' as const },
  indicator: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
};

export const PullToRefresh = {
  Root,
  Indicator,
  Content,
};
