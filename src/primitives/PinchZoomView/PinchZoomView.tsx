import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  PanResponder,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type PanResponderGestureState,
  type ViewProps,
} from 'react-native';
import { useWarnOnceWhen } from '../../internal/devWarnings';
import {
  clampPanTranslate,
  clampScale,
  distanceBetweenTouches,
} from '../../internal/pinchZoomMath';

export interface PinchZoomViewProps extends Omit<ViewProps, 'children'> {
  children: ReactNode;
  minScale?: number;
  maxScale?: number;
  /** Scale a double-tap jumps to from `1`, and resets from when already past it. Defaults to `2`. */
  doubleTapScale?: number;
  disabled?: boolean;
  onScaleChange?: (scale: number) => void;
}

export interface PinchZoomViewHandle {
  reset: () => void;
  getScale: () => number;
}

const DOUBLE_TAP_DELAY_MS = 300;
const DOUBLE_TAP_MAX_DISTANCE = 24;
const TAP_MAX_DURATION_MS = 250;
const TAP_MAX_MOVEMENT = 8;

// Designed as a standalone gesture surface (e.g. a full-screen image
// viewer) that owns the whole touch area, not one nested under another
// PanResponder-claiming parent -- unlike Carousel/SwipeableRow, it claims
// the responder immediately so a plain tap/double-tap is never missed.
export const PinchZoomView = forwardRef<
  PinchZoomViewHandle,
  PinchZoomViewProps
>(function PinchZoomViewImpl(
  {
    children,
    minScale = 1,
    maxScale = 4,
    doubleTapScale = 2,
    disabled = false,
    onScaleChange,
    style,
    ...viewProps
  },
  ref
) {
  useWarnOnceWhen(
    minScale >= maxScale,
    () =>
      `PinchZoomView: \`minScale\` (${minScale}) must be less than \`maxScale\` (${maxScale}).`
  );

  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const stateRef = useRef({
    scale,
    translateX,
    translateY,
    containerSize,
    disabled,
    minScale,
    maxScale,
  });
  stateRef.current = {
    scale,
    translateX,
    translateY,
    containerSize,
    disabled,
    minScale,
    maxScale,
  };
  const onScaleChangeRef = useRef(onScaleChange);
  onScaleChangeRef.current = onScaleChange;

  const pinchStartDistanceRef = useRef(0);
  const scaleAtGrantRef = useRef(1);
  const panStartRef = useRef({ x: 0, y: 0 });
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(
    null
  );
  const gestureStartRef = useRef({ time: 0, touchCount: 0 });

  const applyScale = useCallback((next: number) => {
    setScale(next);
    onScaleChangeRef.current?.(next);
  }, []);

  const reset = useCallback(() => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    onScaleChangeRef.current?.(1);
  }, []);

  const toggleDoubleTapZoom = useCallback(() => {
    const current = stateRef.current;
    if (current.scale > 1) {
      reset();
    } else {
      applyScale(
        clampScale(doubleTapScale, current.minScale, current.maxScale)
      );
    }
  }, [applyScale, reset, doubleTapScale]);

  useImperativeHandle(
    ref,
    () => ({ reset, getScale: () => stateRef.current.scale }),
    [reset]
  );

  const panResponder = useRef(
    PanResponder.create({
      // Claims immediately (both single- and multi-touch) -- see the
      // module-level note on why this differs from the rest of the
      // library's "never claim on touch-down" gesture guard.
      onStartShouldSetPanResponder: () => !stateRef.current.disabled,
      onMoveShouldSetPanResponder: () => !stateRef.current.disabled,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event: GestureResponderEvent) => {
        const touches = event.nativeEvent.touches;
        gestureStartRef.current = {
          time: Date.now(),
          touchCount: touches.length,
        };
        if (touches.length >= 2) {
          pinchStartDistanceRef.current = distanceBetweenTouches(touches);
          scaleAtGrantRef.current = stateRef.current.scale;
        } else {
          panStartRef.current = {
            x: stateRef.current.translateX,
            y: stateRef.current.translateY,
          };
        }
      },
      onPanResponderMove: (
        event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        const touches = event.nativeEvent.touches;
        const current = stateRef.current;
        if (touches.length >= 2 && pinchStartDistanceRef.current > 0) {
          const distance = distanceBetweenTouches(touches);
          const rawScale =
            scaleAtGrantRef.current *
            (distance / pinchStartDistanceRef.current);
          applyScale(clampScale(rawScale, current.minScale, current.maxScale));
        } else if (touches.length === 1 && current.scale > 1) {
          setTranslateX(
            clampPanTranslate(
              panStartRef.current.x + gestureState.dx,
              current.containerSize.width,
              current.scale
            )
          );
          setTranslateY(
            clampPanTranslate(
              panStartRef.current.y + gestureState.dy,
              current.containerSize.height,
              current.scale
            )
          );
        }
      },
      onPanResponderRelease: (
        event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        const { time, touchCount } = gestureStartRef.current;
        const distanceMoved = Math.hypot(gestureState.dx, gestureState.dy);
        const wasTap =
          touchCount === 1 &&
          distanceMoved < TAP_MAX_MOVEMENT &&
          Date.now() - time < TAP_MAX_DURATION_MS;
        if (wasTap) {
          const tapX = event.nativeEvent.pageX;
          const tapY = event.nativeEvent.pageY;
          const lastTap = lastTapRef.current;
          const now = Date.now();
          if (
            lastTap &&
            now - lastTap.time < DOUBLE_TAP_DELAY_MS &&
            Math.hypot(tapX - lastTap.x, tapY - lastTap.y) <
              DOUBLE_TAP_MAX_DISTANCE
          ) {
            lastTapRef.current = null;
            toggleDoubleTapZoom();
          } else {
            lastTapRef.current = { time: now, x: tapX, y: tapY };
          }
        }
        pinchStartDistanceRef.current = 0;
      },
      onPanResponderTerminate: () => {
        pinchStartDistanceRef.current = 0;
      },
    })
  ).current;

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
  }, []);

  const handleAccessibilityAction = useCallback<
    NonNullable<ViewProps['onAccessibilityAction']>
  >(
    (event) => {
      const current = stateRef.current;
      if (current.disabled) return;
      const step = 0.5;
      if (event.nativeEvent.actionName === 'increment') {
        applyScale(
          clampScale(current.scale + step, current.minScale, current.maxScale)
        );
      } else if (event.nativeEvent.actionName === 'decrement') {
        applyScale(
          clampScale(current.scale - step, current.minScale, current.maxScale)
        );
      }
    },
    [applyScale]
  );

  return (
    <View
      {...panResponder.panHandlers}
      onLayout={handleLayout}
      accessibilityRole="adjustable"
      accessibilityState={{ disabled }}
      accessibilityValue={{ min: minScale, max: maxScale, now: scale }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={handleAccessibilityAction}
      style={[styles.container, style]}
      {...viewProps}
    >
      <View
        style={[
          styles.content,
          { transform: [{ translateX }, { translateY }, { scale }] },
        ]}
      >
        {children}
      </View>
    </View>
  );
});
PinchZoomView.displayName = 'PinchZoomView';

const styles = {
  container: { overflow: 'hidden' as const },
  content: { flex: 1 },
};
