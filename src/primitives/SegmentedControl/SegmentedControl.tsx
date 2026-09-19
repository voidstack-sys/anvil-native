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
  Animated,
  PanResponder,
  Pressable,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type PanResponderGestureState,
  type PressableProps,
  type ViewProps,
} from 'react-native';
import {
  controlledChangeMessage,
  useWarnOnceWhen,
} from '../../internal/devWarnings';
import {
  segmentAtPosition,
  type SegmentLayout,
} from '../../internal/segmentedControlMath';

type SegmentMap = Record<string, { x: number; width: number }>;

interface SegmentedControlContextValue {
  value: string | null;
  disabled: boolean;
  order: string[];
  segments: SegmentMap;
  selectValue: (value: string) => void;
  registerValue: (value: string) => void;
  unregisterValue: (value: string) => void;
  registerSegment: (
    value: string,
    layout: { x: number; width: number }
  ) => void;
  unregisterSegment: (value: string) => void;
}

const SegmentedControlContext =
  createContext<SegmentedControlContextValue | null>(null);

function useSegmentedControlContext(
  component: string
): SegmentedControlContextValue {
  const context = useContext(SegmentedControlContext);
  if (!context) {
    throw new Error(
      `SegmentedControl.${component} must be used within a SegmentedControl.Root`
    );
  }
  return context;
}

export interface SegmentedControlRootProps extends Omit<ViewProps, 'children'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export interface SegmentedControlHandle {
  select: (value: string) => void;
  getValue: () => string | null;
}

const Root = forwardRef<SegmentedControlHandle, SegmentedControlRootProps>(
  function SegmentedControlRoot(
    {
      value,
      defaultValue,
      onValueChange,
      disabled = false,
      children,
      ...viewProps
    },
    ref
  ) {
    const isControlled = value !== undefined;
    const initialIsControlled = useRef(isControlled).current;

    useWarnOnceWhen(isControlled !== initialIsControlled, () =>
      controlledChangeMessage(
        'SegmentedControl.Root',
        initialIsControlled,
        isControlled
      )
    );

    const [uncontrolledValue, setUncontrolledValue] = useState<string | null>(
      defaultValue ?? null
    );
    const activeValue = isControlled ? (value ?? null) : uncontrolledValue;

    const selectValue = useCallback(
      (next: string) => {
        if (!isControlled) {
          setUncontrolledValue(next);
        }
        onValueChange?.(next);
      },
      [isControlled, onValueChange]
    );

    const [order, setOrder] = useState<string[]>([]);
    const [segments, setSegments] = useState<SegmentMap>({});

    // Kept separate from `segments` (below): this is which values exist and
    // in what order, needed for increment/decrement navigation regardless
    // of whether layout has measured anything yet. Registered on mount, not
    // on layout -- a screen reader user invoking the group's accessibility
    // action shouldn't depend on a layout pass having already happened.
    const registerValue = useCallback((segmentValue: string) => {
      setOrder((prev) =>
        prev.includes(segmentValue) ? prev : [...prev, segmentValue]
      );
    }, []);

    const unregisterValue = useCallback((segmentValue: string) => {
      setOrder((prev) => prev.filter((entry) => entry !== segmentValue));
    }, []);

    const registerSegment = useCallback(
      (segmentValue: string, layout: { x: number; width: number }) => {
        setSegments((prev) => {
          const existing = prev[segmentValue];
          if (
            existing &&
            existing.x === layout.x &&
            existing.width === layout.width
          ) {
            return prev;
          }
          return { ...prev, [segmentValue]: layout };
        });
      },
      []
    );

    const unregisterSegment = useCallback((segmentValue: string) => {
      setSegments((prev) => {
        if (!(segmentValue in prev)) return prev;
        const next = { ...prev };
        delete next[segmentValue];
        return next;
      });
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        select: selectValue,
        getValue: () => activeValue,
      }),
      [selectValue, activeValue]
    );

    const contextValue = useMemo(
      () => ({
        value: activeValue,
        disabled,
        order,
        segments,
        selectValue,
        registerValue,
        unregisterValue,
        registerSegment,
        unregisterSegment,
      }),
      [
        activeValue,
        disabled,
        order,
        segments,
        selectValue,
        registerValue,
        unregisterValue,
        registerSegment,
        unregisterSegment,
      ]
    );

    return (
      <SegmentedControlContext.Provider value={contextValue}>
        <View accessibilityState={{ disabled }} {...viewProps}>
          {children}
        </View>
      </SegmentedControlContext.Provider>
    );
  }
);
Root.displayName = 'SegmentedControl.Root';

export type SegmentedControlListProps = ViewProps;

function List({ style, children, ...viewProps }: SegmentedControlListProps) {
  const context = useSegmentedControlContext('List');

  // Keeps the PanResponder's handlers (created once) reading fresh context
  // without recreating them every render -- same technique Carousel.Track
  // uses.
  const latestRef = useRef(context);
  latestRef.current = context;

  const panResponder = useRef(
    PanResponder.create({
      // Never claim on mere touch-down -- a quick tap on an Item needs to
      // reach its own Pressable untouched. Only a real horizontal drag
      // (scrubbing across segments) gets claimed here.
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (
        _event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) =>
        !latestRef.current.disabled &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
        Math.abs(gestureState.dx) > 4,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (event: GestureResponderEvent) => {
        const current = latestRef.current;
        const x = event.nativeEvent.locationX;
        const layouts: SegmentLayout[] = current.order
          .map((segmentValue) => {
            const layout = current.segments[segmentValue];
            return layout ? { value: segmentValue, ...layout } : null;
          })
          .filter((entry): entry is SegmentLayout => entry !== null);
        const hit = segmentAtPosition(x, layouts);
        if (hit && hit !== current.value) {
          current.selectValue(hit);
        }
      },
    })
  ).current;

  const handleAccessibilityAction = useCallback<
    NonNullable<ViewProps['onAccessibilityAction']>
  >((event) => {
    const current = latestRef.current;
    if (current.disabled || current.value == null) return;
    const index = current.order.indexOf(current.value);
    if (index === -1) return;
    if (
      event.nativeEvent.actionName === 'increment' &&
      index < current.order.length - 1
    ) {
      current.selectValue(current.order[index + 1]!);
    } else if (event.nativeEvent.actionName === 'decrement' && index > 0) {
      current.selectValue(current.order[index - 1]!);
    }
  }, []);

  return (
    // The gesture-catching layer is a separate inner View from this one --
    // same split as Carousel.Viewport/Track. An element carrying
    // PanResponder's onStartShouldSetResponder/onMoveShouldSetResponder
    // reports "wouldn't claim the touch right now" to testing tools (and,
    // on Android, to the native responder system) whenever the drag gate
    // isn't currently satisfied, which would otherwise also suppress this
    // element's own unrelated accessibilityAction.
    <View
      accessibilityRole="radiogroup"
      accessibilityState={{ disabled: context.disabled }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={handleAccessibilityAction}
      style={style}
      {...viewProps}
    >
      <View {...panResponder.panHandlers} style={styles.list}>
        {children}
      </View>
    </View>
  );
}
List.displayName = 'SegmentedControl.List';

export type SegmentedControlItemRenderProps = {
  selected: boolean;
  disabled: boolean;
};

export interface SegmentedControlItemProps extends Omit<
  PressableProps,
  'children' | 'onPress' | 'disabled'
> {
  value: string;
  disabled?: boolean;
  children:
    | React.ReactNode
    | ((state: SegmentedControlItemRenderProps) => React.ReactNode);
}

function Item({
  value,
  disabled: itemDisabled = false,
  onLayout,
  children,
  ...pressableProps
}: SegmentedControlItemProps) {
  const {
    value: activeValue,
    disabled: groupDisabled,
    selectValue,
    registerValue,
    unregisterValue,
    registerSegment,
    unregisterSegment,
  } = useSegmentedControlContext('Item');
  const selected = activeValue === value;
  const disabled = itemDisabled || groupDisabled;

  useEffect(() => {
    registerValue(value);
    return () => unregisterValue(value);
  }, [registerValue, unregisterValue, value]);

  useEffect(() => () => unregisterSegment(value), [unregisterSegment, value]);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { x, width } = event.nativeEvent.layout;
      registerSegment(value, { x, width });
      onLayout?.(event);
    },
    [registerSegment, value, onLayout]
  );

  const handlePress = useCallback(() => {
    if (disabled) return;
    selectValue(value);
  }, [disabled, selectValue, value]);

  return (
    <Pressable
      onLayout={handleLayout}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={handlePress}
      {...pressableProps}
    >
      {typeof children === 'function'
        ? children({ selected, disabled })
        : children}
    </Pressable>
  );
}
Item.displayName = 'SegmentedControl.Item';

export type SegmentedControlIndicatorProps = Omit<ViewProps, 'children'>;

function Indicator({ style, ...viewProps }: SegmentedControlIndicatorProps) {
  const { value, segments } = useSegmentedControlContext('Indicator');
  const layout = value != null ? segments[value] : undefined;

  const translateX = useRef(new Animated.Value(layout?.x ?? 0)).current;
  const width = useRef(new Animated.Value(layout?.width ?? 0)).current;
  const isFirstLayoutRef = useRef(true);

  useEffect(() => {
    if (!layout) return;
    if (isFirstLayoutRef.current) {
      isFirstLayoutRef.current = false;
      translateX.setValue(layout.x);
      width.setValue(layout.width);
      return;
    }
    // Width can't be driven by the native thread, so this whole animation
    // runs on the JS thread -- an acceptable cost for a small, infrequent
    // UI transition like this one.
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: layout.x,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(width, {
        toValue: layout.width,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [layout, translateX, width]);

  return (
    <Animated.View
      pointerEvents="none"
      // Purely decorative -- the selected Item's own accessibilityState
      // already carries the "selected" information.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.indicator, { transform: [{ translateX }], width }, style]}
      {...viewProps}
    />
  );
}
Indicator.displayName = 'SegmentedControl.Indicator';

const styles = {
  list: { flexDirection: 'row' as const, position: 'relative' as const },
  indicator: { position: 'absolute' as const, top: 0, bottom: 0, left: 0 },
};

export const SegmentedControl = {
  Root,
  List,
  Item,
  Indicator,
};
