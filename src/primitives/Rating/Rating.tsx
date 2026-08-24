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
  View,
  type GestureResponderEvent,
  type ViewProps,
} from 'react-native';
import {
  controlledChangeMessage,
  useWarnOnceWhen,
} from '../../internal/devWarnings';
import {
  clampRatingValue,
  valueFromLocationX,
} from '../../internal/ratingMath';

interface RatingContextValue {
  value: number;
  max: number;
  disabled: boolean;
}

const RatingContext = createContext<RatingContextValue | null>(null);

function useRatingContext(component: string): RatingContextValue {
  const context = useContext(RatingContext);
  if (!context) {
    throw new Error(`Rating.${component} must be used within a Rating.Root`);
  }
  return context;
}

export interface RatingRootProps extends Omit<ViewProps, 'children'> {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Number of items (e.g. stars). Defaults to 5. */
  max?: number;
  disabled?: boolean;
  children: React.ReactNode;
}

export interface RatingHandle {
  getValue: () => number;
  setValue: (value: number) => void;
}

const Root = forwardRef<RatingHandle, RatingRootProps>(function RatingRoot(
  {
    value,
    defaultValue = 0,
    onValueChange,
    max = 5,
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
      'Rating.Root',
      initialIsControlled,
      isControlled,
      'value'
    )
  );
  useWarnOnceWhen(
    max <= 0,
    () => `Rating.Root: \`max\` must be greater than 0, received ${max}.`
  );

  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    clampRatingValue(defaultValue, max)
  );
  const currentValue = isControlled
    ? clampRatingValue(value ?? defaultValue, max)
    : uncontrolledValue;

  const setValue = useCallback(
    (next: number) => {
      const clamped = clampRatingValue(next, max);
      if (!isControlled) {
        setUncontrolledValue(clamped);
      }
      onValueChange?.(clamped);
    },
    [isControlled, max, onValueChange]
  );

  useImperativeHandle(
    ref,
    () => ({
      getValue: () => currentValue,
      setValue,
    }),
    [currentValue, setValue]
  );

  const [rowWidth, setRowWidth] = useState(0);

  // Keeps the PanResponder's handlers (created once) reading fresh
  // rowWidth/max/disabled/setValue without recreating them every render --
  // same technique Slider.Thumb uses.
  const latestRef = useRef({ rowWidth, max, disabled, setValue });
  latestRef.current = { rowWidth, max, disabled, setValue };

  const handleTouch = useCallback((locationX: number) => {
    const current = latestRef.current;
    if (current.disabled) return;
    current.setValue(
      valueFromLocationX(locationX, current.rowWidth, current.max)
    );
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !latestRef.current.disabled,
      onMoveShouldSetPanResponder: () => !latestRef.current.disabled,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event: GestureResponderEvent) =>
        handleTouch(event.nativeEvent.locationX),
      onPanResponderMove: (event: GestureResponderEvent) =>
        handleTouch(event.nativeEvent.locationX),
    })
  ).current;

  const contextValue = useMemo(
    () => ({ value: currentValue, max, disabled }),
    [currentValue, max, disabled]
  );

  const handleAccessibilityAction = useCallback<
    NonNullable<ViewProps['onAccessibilityAction']>
  >(
    (event) => {
      if (disabled) return;
      if (event.nativeEvent.actionName === 'increment') {
        setValue(currentValue + 1);
      } else if (event.nativeEvent.actionName === 'decrement') {
        setValue(currentValue - 1);
      }
    },
    [disabled, setValue, currentValue]
  );

  return (
    <RatingContext.Provider value={contextValue}>
      <View
        {...panResponder.panHandlers}
        onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}
        accessibilityRole="adjustable"
        accessibilityValue={{ min: 0, max, now: currentValue }}
        accessibilityState={{ disabled }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={handleAccessibilityAction}
        {...viewProps}
      >
        {children}
      </View>
    </RatingContext.Provider>
  );
});
Root.displayName = 'Rating.Root';

export type RatingItemRenderProps = {
  /** Whether this item is filled at the current value (item `index` is filled when `index < value`). */
  filled: boolean;
  index: number;
};

export interface RatingItemProps extends Omit<ViewProps, 'children'> {
  index: number;
  children:
    React.ReactNode | ((state: RatingItemRenderProps) => React.ReactNode);
}

function Item({ index, children, ...viewProps }: RatingItemProps) {
  const { value } = useRatingContext('Item');
  const filled = index < value;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      {...viewProps}
    >
      {typeof children === 'function' ? children({ filled, index }) : children}
    </View>
  );
}
Item.displayName = 'Rating.Item';

export const Rating = {
  Root,
  Item,
};
