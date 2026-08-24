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
  Pressable,
  Text,
  View,
  type PressableProps,
  type TextProps,
  type ViewProps,
} from 'react-native';
import {
  controlledChangeMessage,
  useWarnOnceWhen,
} from '../../internal/devWarnings';
import { clampSliderValue } from '../../internal/sliderMath';

interface StepperContextValue {
  value: number;
  min: number;
  max: number;
  disabled: boolean;
  increment: () => void;
  decrement: () => void;
}

const StepperContext = createContext<StepperContextValue | null>(null);

function useStepperContext(component: string): StepperContextValue {
  const context = useContext(StepperContext);
  if (!context) {
    throw new Error(`Stepper.${component} must be used within a Stepper.Root`);
  }
  return context;
}

export interface StepperRootProps extends Omit<ViewProps, 'children'> {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  children: React.ReactNode;
}

export interface StepperHandle {
  getValue: () => number;
  setValue: (value: number) => void;
  increment: () => void;
  decrement: () => void;
}

const Root = forwardRef<StepperHandle, StepperRootProps>(function StepperRoot(
  {
    value,
    defaultValue = 0,
    onValueChange,
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
    controlledChangeMessage(
      'Stepper.Root',
      initialIsControlled,
      isControlled,
      'value'
    )
  );
  useWarnOnceWhen(
    min >= max,
    () => `Stepper.Root: \`min\` (${min}) must be less than \`max\` (${max}).`
  );
  useWarnOnceWhen(
    step <= 0,
    () => `Stepper.Root: \`step\` must be greater than 0, received ${step}.`
  );

  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    clampSliderValue(defaultValue, min, max, step)
  );
  const currentValue = isControlled
    ? clampSliderValue(value ?? defaultValue, min, max, step)
    : uncontrolledValue;

  const setValue = useCallback(
    (next: number) => {
      const clamped = clampSliderValue(next, min, max, step);
      if (!isControlled) {
        setUncontrolledValue(clamped);
      }
      onValueChange?.(clamped);
    },
    [isControlled, min, max, step, onValueChange]
  );

  const increment = useCallback(
    () => setValue(currentValue + step),
    [setValue, currentValue, step]
  );
  const decrement = useCallback(
    () => setValue(currentValue - step),
    [setValue, currentValue, step]
  );

  useImperativeHandle(
    ref,
    () => ({
      getValue: () => currentValue,
      setValue,
      increment,
      decrement,
    }),
    [currentValue, setValue, increment, decrement]
  );

  const contextValue = useMemo(
    () => ({ value: currentValue, min, max, disabled, increment, decrement }),
    [currentValue, min, max, disabled, increment, decrement]
  );

  const handleAccessibilityAction = useCallback<
    NonNullable<ViewProps['onAccessibilityAction']>
  >(
    (event) => {
      if (disabled) return;
      if (event.nativeEvent.actionName === 'increment') increment();
      else if (event.nativeEvent.actionName === 'decrement') decrement();
    },
    [disabled, increment, decrement]
  );

  return (
    <StepperContext.Provider value={contextValue}>
      <View
        accessibilityRole="adjustable"
        accessibilityValue={{ min, max, now: currentValue }}
        accessibilityState={{ disabled }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={handleAccessibilityAction}
        {...viewProps}
      >
        {children}
      </View>
    </StepperContext.Provider>
  );
});
Root.displayName = 'Stepper.Root';

export type StepperButtonRenderProps = { disabled: boolean };

export interface StepperButtonProps extends Omit<
  PressableProps,
  'children' | 'disabled'
> {
  disabled?: boolean;
  children:
    React.ReactNode | ((state: StepperButtonRenderProps) => React.ReactNode);
}

function DecrementButton({
  disabled: buttonDisabled = false,
  accessibilityLabel,
  onPress,
  children,
  ...pressableProps
}: StepperButtonProps) {
  const {
    value,
    min,
    disabled: groupDisabled,
    decrement,
  } = useStepperContext('DecrementButton');
  const disabled = buttonDisabled || groupDisabled || value <= min;

  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      if (disabled) return;
      decrement();
      onPress?.(event);
    },
    [disabled, decrement, onPress]
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? 'Decrease'}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
      {...pressableProps}
    >
      {typeof children === 'function' ? children({ disabled }) : children}
    </Pressable>
  );
}
DecrementButton.displayName = 'Stepper.DecrementButton';

function IncrementButton({
  disabled: buttonDisabled = false,
  accessibilityLabel,
  onPress,
  children,
  ...pressableProps
}: StepperButtonProps) {
  const {
    value,
    max,
    disabled: groupDisabled,
    increment,
  } = useStepperContext('IncrementButton');
  const disabled = buttonDisabled || groupDisabled || value >= max;

  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      if (disabled) return;
      increment();
      onPress?.(event);
    },
    [disabled, increment, onPress]
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? 'Increase'}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
      {...pressableProps}
    >
      {typeof children === 'function' ? children({ disabled }) : children}
    </Pressable>
  );
}
IncrementButton.displayName = 'Stepper.IncrementButton';

export type StepperValueRenderProps = { value: number };

export interface StepperValueProps extends Omit<TextProps, 'children'> {
  children?:
    React.ReactNode | ((state: StepperValueRenderProps) => React.ReactNode);
}

function Value({ children, ...textProps }: StepperValueProps) {
  const { value } = useStepperContext('Value');
  return (
    <Text {...textProps}>
      {typeof children === 'function'
        ? children({ value })
        : (children ?? String(value))}
    </Text>
  );
}
Value.displayName = 'Stepper.Value';

export const Stepper = {
  Root,
  DecrementButton,
  IncrementButton,
  Value,
};
