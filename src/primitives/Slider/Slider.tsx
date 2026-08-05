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
  type PanResponderGestureState,
  type ViewProps,
} from 'react-native';
import {
  controlledChangeMessage,
  useWarnOnceWhen,
} from '../../internal/devWarnings';
import {
  clampAgainstNeighbors,
  pixelDeltaToValue,
  valueToPercentage,
} from '../../internal/sliderMath';

interface SliderContextValue {
  values: number[];
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  trackWidth: number;
  setTrackWidth: (width: number) => void;
  setValueAtIndex: (index: number, value: number) => void;
  commitValues: () => void;
}

const SliderContext = createContext<SliderContextValue | null>(null);

function useSliderContext(component: string): SliderContextValue {
  const context = useContext(SliderContext);
  if (!context) {
    throw new Error(`Slider.${component} must be used within a Slider.Root`);
  }
  return context;
}

export interface SliderRootProps extends Omit<ViewProps, 'children'> {
  /** One entry per thumb. A plain single-value slider is `[value]`. */
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  /** Fires once, when a drag (or accessibility increment/decrement) ends — handy for expensive side effects. */
  onValueCommit?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  children: React.ReactNode;
}

export interface SliderHandle {
  getValue: () => number[];
  setValue: (value: number[]) => void;
}

const Root = forwardRef<SliderHandle, SliderRootProps>(function SliderRoot(
  {
    value,
    defaultValue = [0],
    onValueChange,
    onValueCommit,
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    children,
    ...viewProps
  },
  ref
) {
  const isControlled = value !== undefined;
  const initialIsControlled = useRef(isControlled).current;

  useWarnOnceWhen(isControlled !== initialIsControlled, () =>
    controlledChangeMessage('Slider.Root', initialIsControlled, isControlled)
  );
  useWarnOnceWhen(
    min >= max,
    () => `Slider.Root: \`min\` (${min}) must be less than \`max\` (${max}).`
  );
  useWarnOnceWhen(
    step <= 0,
    () => `Slider.Root: \`step\` must be greater than 0, received ${step}.`
  );

  const [uncontrolledValues, setUncontrolledValues] = useState(defaultValue);
  const values = isControlled ? (value ?? defaultValue) : uncontrolledValues;

  useWarnOnceWhen(
    values.some((v, i) => i > 0 && v < values[i - 1]!),
    () =>
      'Slider.Root: `value`/`defaultValue` entries must be in ascending order (each thumb ' +
      'is clamped against its neighbors assuming this).'
  );

  const [trackWidth, setTrackWidth] = useState(0);

  // Refs mirroring the latest render's data/callbacks so the PanResponder
  // handlers created (once) inside Slider.Thumb never read stale closures.
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const isControlledRef = useRef(isControlled);
  isControlledRef.current = isControlled;
  const onValueChangeRef = useRef(onValueChange);
  onValueChangeRef.current = onValueChange;
  const onValueCommitRef = useRef(onValueCommit);
  onValueCommitRef.current = onValueCommit;

  const setValueAtIndex = useCallback((index: number, newValue: number) => {
    const current = valuesRef.current;
    if (current[index] === newValue) return;
    const next = current.slice();
    next[index] = newValue;
    if (!isControlledRef.current) {
      setUncontrolledValues(next);
    }
    valuesRef.current = next;
    onValueChangeRef.current?.(next);
  }, []);

  const commitValues = useCallback(() => {
    onValueCommitRef.current?.(valuesRef.current);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      getValue: () => valuesRef.current,
      setValue: (next: number[]) => {
        if (!isControlledRef.current) {
          setUncontrolledValues(next);
        }
        valuesRef.current = next;
        onValueChangeRef.current?.(next);
      },
    }),
    []
  );

  const contextValue = useMemo(
    () => ({
      values,
      min,
      max,
      step,
      disabled,
      trackWidth,
      setTrackWidth,
      setValueAtIndex,
      commitValues,
    }),
    [
      values,
      min,
      max,
      step,
      disabled,
      trackWidth,
      setValueAtIndex,
      commitValues,
    ]
  );

  return (
    <SliderContext.Provider value={contextValue}>
      <View accessibilityState={{ disabled }} {...viewProps}>
        {children}
      </View>
    </SliderContext.Provider>
  );
});
Root.displayName = 'Slider.Root';

export type SliderTrackProps = ViewProps;

function Track({ style, ...viewProps }: SliderTrackProps) {
  const { setTrackWidth } = useSliderContext('Track');

  return (
    <View
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      style={[styles.track, style]}
      {...viewProps}
    />
  );
}
Track.displayName = 'Slider.Track';

export type SliderRangeProps = ViewProps;

function Range({ style, ...viewProps }: SliderRangeProps) {
  const { values, min, max } = useSliderContext('Range');

  const lowValue = values.length > 1 ? Math.min(...values) : min;
  const highValue = Math.max(...values);
  const startPercent = valueToPercentage(lowValue, min, max);
  const endPercent = valueToPercentage(highValue, min, max);

  return (
    <View
      style={[
        styles.range,
        { left: `${startPercent}%`, width: `${endPercent - startPercent}%` },
        style,
      ]}
      {...viewProps}
    />
  );
}
Range.displayName = 'Slider.Range';

export type SliderThumbRenderProps = {
  value: number;
  disabled: boolean;
};

export interface SliderThumbProps extends Omit<ViewProps, 'children'> {
  /** Which entry of `value` this thumb controls. Defaults to 0, the common single-thumb case. */
  index?: number;
  children?:
    React.ReactNode | ((state: SliderThumbRenderProps) => React.ReactNode);
}

function Thumb({ index = 0, style, children, ...viewProps }: SliderThumbProps) {
  const context = useSliderContext('Thumb');
  const { values, min, max, disabled } = context;
  const value = values[index] ?? min;
  const percentage = valueToPercentage(value, min, max);

  const [thumbWidth, setThumbWidth] = useState(0);

  // See Slider.Root: keeps the PanResponder's handlers (created once) fresh
  // without recreating them on every render.
  const latestRef = useRef(context);
  latestRef.current = context;
  const valueAtGrantRef = useRef(value);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !latestRef.current.disabled,
      onMoveShouldSetPanResponder: () => !latestRef.current.disabled,
      onPanResponderGrant: () => {
        valueAtGrantRef.current =
          latestRef.current.values[index] ?? latestRef.current.min;
      },
      onPanResponderMove: (
        _event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        const {
          values: currentValues,
          min: currentMin,
          max: currentMax,
          step: currentStep,
          trackWidth,
        } = latestRef.current;
        const raw = pixelDeltaToValue(
          valueAtGrantRef.current,
          gestureState.dx,
          trackWidth,
          currentMin,
          currentMax
        );
        const clamped = clampAgainstNeighbors(
          currentValues,
          index,
          raw,
          currentMin,
          currentMax,
          currentStep
        );
        latestRef.current.setValueAtIndex(index, clamped);
      },
      onPanResponderRelease: () => latestRef.current.commitValues(),
      onPanResponderTerminate: () => latestRef.current.commitValues(),
    })
  ).current;

  const handleAccessibilityAction = useCallback<
    NonNullable<ViewProps['onAccessibilityAction']>
  >(
    (event) => {
      const {
        values: currentValues,
        min: currentMin,
        max: currentMax,
        step: currentStep,
      } = latestRef.current;
      if (latestRef.current.disabled) return;
      const current = currentValues[index] ?? currentMin;
      const delta =
        event.nativeEvent.actionName === 'increment'
          ? currentStep
          : event.nativeEvent.actionName === 'decrement'
            ? -currentStep
            : 0;
      if (delta === 0) return;
      const clamped = clampAgainstNeighbors(
        currentValues,
        index,
        current + delta,
        currentMin,
        currentMax,
        currentStep
      );
      latestRef.current.setValueAtIndex(index, clamped);
      latestRef.current.commitValues();
    },
    [index]
  );

  const left =
    thumbWidth > 0
      ? (percentage / 100) * context.trackWidth - thumbWidth / 2
      : `${percentage}%`;

  return (
    <View
      {...panResponder.panHandlers}
      onLayout={(event) => setThumbWidth(event.nativeEvent.layout.width)}
      accessibilityRole="adjustable"
      accessibilityState={{ disabled }}
      accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={handleAccessibilityAction}
      style={[styles.thumb, { left }, style]}
      {...viewProps}
    >
      {typeof children === 'function'
        ? children({ value, disabled })
        : children}
    </View>
  );
}
Thumb.displayName = 'Slider.Thumb';

const styles = {
  track: { position: 'relative' as const },
  range: { position: 'absolute' as const, top: 0, bottom: 0 },
  thumb: { position: 'absolute' as const, top: 0 },
};

export const Slider = {
  Root,
  Track,
  Range,
  Thumb,
};
