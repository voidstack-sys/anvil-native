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
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type PanResponderGestureState,
  type PressableProps,
  type ViewProps,
} from 'react-native';
import {
  controlledChangeMessage,
  useWarnOnceWhen,
} from '../../internal/devWarnings';
import {
  clampSwipeOffset,
  offsetForSide,
  resolveSideFromRelease,
  type SwipeableRowSide,
} from '../../internal/swipeableRowMath';

export type { SwipeableRowSide };

interface SwipeableRowContextValue {
  openSide: SwipeableRowSide;
  disabled: boolean;
  swipeOffset: number;
  leftActionsWidth: number;
  rightActionsWidth: number;
  isDraggingRef: React.RefObject<boolean>;
  setLeftActionsWidth: (width: number) => void;
  setRightActionsWidth: (width: number) => void;
  setSwipeOffset: (offset: number) => void;
  setOpenSide: (side: SwipeableRowSide) => void;
  closeRow: () => void;
}

const SwipeableRowContext = createContext<SwipeableRowContextValue | null>(
  null
);

function useSwipeableRowContext(component: string): SwipeableRowContextValue {
  const context = useContext(SwipeableRowContext);
  if (!context) {
    throw new Error(
      `SwipeableRow.${component} must be used within a SwipeableRow.Root`
    );
  }
  return context;
}

export interface SwipeableRowRootProps extends Omit<ViewProps, 'children'> {
  openSide?: SwipeableRowSide;
  defaultOpenSide?: SwipeableRowSide;
  onOpenSideChange?: (side: SwipeableRowSide) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export interface SwipeableRowHandle {
  open: (side: 'left' | 'right') => void;
  close: () => void;
  getOpenSide: () => SwipeableRowSide;
}

const Root = forwardRef<SwipeableRowHandle, SwipeableRowRootProps>(
  function SwipeableRowRoot(
    {
      openSide,
      defaultOpenSide = 'none',
      onOpenSideChange,
      disabled = false,
      children,
      ...viewProps
    },
    ref
  ) {
    const isControlled = openSide !== undefined;
    const initialIsControlled = useRef(isControlled).current;

    useWarnOnceWhen(isControlled !== initialIsControlled, () =>
      controlledChangeMessage(
        'SwipeableRow.Root',
        initialIsControlled,
        isControlled,
        'openSide'
      )
    );

    const [uncontrolledOpenSide, setUncontrolledOpenSide] =
      useState<SwipeableRowSide>(defaultOpenSide);
    const currentOpenSide = isControlled
      ? (openSide ?? 'none')
      : uncontrolledOpenSide;

    const setOpenSide = useCallback(
      (next: SwipeableRowSide) => {
        if (!isControlled) {
          setUncontrolledOpenSide(next);
        }
        onOpenSideChange?.(next);
      },
      [isControlled, onOpenSideChange]
    );

    const [leftActionsWidth, setLeftActionsWidth] = useState(0);
    const [rightActionsWidth, setRightActionsWidth] = useState(0);
    const [swipeOffset, setSwipeOffset] = useState(0);
    const isDraggingRef = useRef(false);

    // Keeps the visual offset in sync with the committed side whenever it
    // (or the measured action widths) change from the outside -- but never
    // while a drag is actively in progress, since the gesture owns the
    // offset until it's released.
    useEffect(() => {
      if (isDraggingRef.current) return;
      setSwipeOffset(
        offsetForSide(currentOpenSide, leftActionsWidth, rightActionsWidth)
      );
    }, [currentOpenSide, leftActionsWidth, rightActionsWidth]);

    const closeRow = useCallback(() => setOpenSide('none'), [setOpenSide]);
    const openRow = useCallback(
      (side: 'left' | 'right') => setOpenSide(side),
      [setOpenSide]
    );

    useImperativeHandle(
      ref,
      () => ({
        open: openRow,
        close: closeRow,
        getOpenSide: () => currentOpenSide,
      }),
      [openRow, closeRow, currentOpenSide]
    );

    const contextValue = useMemo(
      () => ({
        openSide: currentOpenSide,
        disabled,
        swipeOffset,
        leftActionsWidth,
        rightActionsWidth,
        isDraggingRef,
        setLeftActionsWidth,
        setRightActionsWidth,
        setSwipeOffset,
        setOpenSide,
        closeRow,
      }),
      [
        currentOpenSide,
        disabled,
        swipeOffset,
        leftActionsWidth,
        rightActionsWidth,
        setOpenSide,
        closeRow,
      ]
    );

    return (
      <SwipeableRowContext.Provider value={contextValue}>
        <View {...viewProps}>{children}</View>
      </SwipeableRowContext.Provider>
    );
  }
);
Root.displayName = 'SwipeableRow.Root';

export type SwipeableRowContentRenderProps = {
  /** How far (px) the content is currently offset. Positive reveals `LeftActions`, negative reveals `RightActions`. */
  swipeOffset: number;
  openSide: SwipeableRowSide;
};

export interface SwipeableRowContentProps extends Omit<ViewProps, 'children'> {
  children:
    | React.ReactNode
    | ((state: SwipeableRowContentRenderProps) => React.ReactNode);
}

function Content({ style, children, ...viewProps }: SwipeableRowContentProps) {
  const context = useSwipeableRowContext('Content');
  const { swipeOffset, openSide } = context;

  // Keeps the PanResponder's handlers (created once) reading fresh
  // context without recreating them every render -- same technique
  // Slider.Thumb/BottomSheet.Handle use.
  const latestRef = useRef(context);
  latestRef.current = context;
  const offsetAtGrantRef = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      // Never claim on mere touch-down -- a swipeable row commonly lives
      // inside a vertically-scrolling list, and grabbing the responder
      // immediately would break that list's own scroll gesture.
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
        offsetAtGrantRef.current = latestRef.current.swipeOffset;
      },
      onPanResponderMove: (
        _event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        const { leftActionsWidth, rightActionsWidth, setSwipeOffset } =
          latestRef.current;
        setSwipeOffset(
          clampSwipeOffset(
            offsetAtGrantRef.current + gestureState.dx,
            leftActionsWidth,
            rightActionsWidth
          )
        );
      },
      onPanResponderRelease: (
        _event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        const {
          leftActionsWidth,
          rightActionsWidth,
          swipeOffset: latestOffset,
          setOpenSide,
          setSwipeOffset,
          isDraggingRef,
        } = latestRef.current;
        isDraggingRef.current = false;
        const resolvedSide = resolveSideFromRelease(
          latestOffset,
          leftActionsWidth,
          rightActionsWidth,
          gestureState.vx
        );
        setSwipeOffset(
          offsetForSide(resolvedSide, leftActionsWidth, rightActionsWidth)
        );
        setOpenSide(resolvedSide);
      },
      onPanResponderTerminate: () => {
        const {
          openSide: latestOpenSide,
          leftActionsWidth,
          rightActionsWidth,
          setSwipeOffset,
          isDraggingRef,
        } = latestRef.current;
        isDraggingRef.current = false;
        setSwipeOffset(
          offsetForSide(latestOpenSide, leftActionsWidth, rightActionsWidth)
        );
      },
    })
  ).current;

  return (
    <View
      {...panResponder.panHandlers}
      style={[{ transform: [{ translateX: swipeOffset }] }, style]}
      {...viewProps}
    >
      {typeof children === 'function'
        ? children({ swipeOffset, openSide })
        : children}
    </View>
  );
}
Content.displayName = 'SwipeableRow.Content';

export type SwipeableRowActionsProps = ViewProps;

function LeftActions({ style, ...viewProps }: SwipeableRowActionsProps) {
  const { openSide, setLeftActionsWidth } =
    useSwipeableRowContext('LeftActions');
  const revealed = openSide === 'left';

  return (
    <View
      onLayout={(event) => setLeftActionsWidth(event.nativeEvent.layout.width)}
      accessibilityElementsHidden={!revealed}
      importantForAccessibility={revealed ? 'auto' : 'no-hide-descendants'}
      style={[styles.leftActions, style]}
      {...viewProps}
    />
  );
}
LeftActions.displayName = 'SwipeableRow.LeftActions';

function RightActions({ style, ...viewProps }: SwipeableRowActionsProps) {
  const { openSide, setRightActionsWidth } =
    useSwipeableRowContext('RightActions');
  const revealed = openSide === 'right';

  return (
    <View
      onLayout={(event) => setRightActionsWidth(event.nativeEvent.layout.width)}
      accessibilityElementsHidden={!revealed}
      importantForAccessibility={revealed ? 'auto' : 'no-hide-descendants'}
      style={[styles.rightActions, style]}
      {...viewProps}
    />
  );
}
RightActions.displayName = 'SwipeableRow.RightActions';

export type SwipeableRowCloseProps = PressableProps;

function Close({ onPress, ...pressableProps }: SwipeableRowCloseProps) {
  const { closeRow } = useSwipeableRowContext('Close');

  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      closeRow();
      onPress?.(event);
    },
    [closeRow, onPress]
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      {...pressableProps}
    />
  );
}
Close.displayName = 'SwipeableRow.Close';

const styles = StyleSheet.create({
  leftActions: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  rightActions: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
  },
});

export const SwipeableRow = {
  Root,
  Content,
  LeftActions,
  RightActions,
  Close,
};
