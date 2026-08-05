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
  View,
  type PressableProps,
  type ViewProps,
} from 'react-native';
import {
  controlledChangeMessage,
  useWarnOnceWhen,
} from '../../internal/devWarnings';
import {
  useRegisteredValue,
  useValueRegistry,
} from '../../internal/useValueRegistry';

interface RadioGroupContextValue {
  value: string | null;
  disabled: boolean;
  selectValue: (value: string) => void;
  registerValue: (value: string) => void;
  unregisterValue: (value: string) => void;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

function useRadioGroupContext(component: string): RadioGroupContextValue {
  const context = useContext(RadioGroupContext);
  if (!context) {
    throw new Error(
      `RadioGroup.${component} must be used within a RadioGroup.Root`
    );
  }
  return context;
}

interface RadioGroupItemContextValue {
  selected: boolean;
}

const RadioGroupItemContext = createContext<RadioGroupItemContextValue | null>(
  null
);

function useRadioGroupItemContext(
  component: string
): RadioGroupItemContextValue {
  const context = useContext(RadioGroupItemContext);
  if (!context) {
    throw new Error(
      `RadioGroup.${component} must be used within a RadioGroup.Item`
    );
  }
  return context;
}

export interface RadioGroupRootProps extends Omit<ViewProps, 'children'> {
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  /** Disables every item in the group, regardless of each item's own `disabled` prop. */
  disabled?: boolean;
  children: React.ReactNode;
}

export interface RadioGroupHandle {
  select: (value: string) => void;
  /** Programmatically clears the selection. Not reachable through the UI: pressing the selected item is a no-op, matching native radio buttons. */
  clear: () => void;
  getValue: () => string | null;
}

const Root = forwardRef<RadioGroupHandle, RadioGroupRootProps>(
  function RadioGroupRoot(
    {
      value,
      defaultValue = null,
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
        'RadioGroup.Root',
        initialIsControlled,
        isControlled
      )
    );

    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
    const currentValue = isControlled ? (value ?? null) : uncontrolledValue;

    const setValue = useCallback(
      (next: string | null) => {
        if (!isControlled) {
          setUncontrolledValue(next);
        }
        onValueChange?.(next);
      },
      [isControlled, onValueChange]
    );

    const selectValue = useCallback(
      (itemValue: string) => setValue(itemValue),
      [setValue]
    );

    const { register: registerValue, unregister: unregisterValue } =
      useValueRegistry('RadioGroup');

    useImperativeHandle(
      ref,
      () => ({
        select: selectValue,
        clear: () => setValue(null),
        getValue: () => currentValue,
      }),
      [selectValue, setValue, currentValue]
    );

    const contextValue = useMemo(
      () => ({
        value: currentValue,
        disabled,
        selectValue,
        registerValue,
        unregisterValue,
      }),
      [currentValue, disabled, selectValue, registerValue, unregisterValue]
    );

    return (
      <RadioGroupContext.Provider value={contextValue}>
        <View
          accessibilityRole="radiogroup"
          accessibilityState={{ disabled }}
          {...viewProps}
        >
          {children}
        </View>
      </RadioGroupContext.Provider>
    );
  }
);
Root.displayName = 'RadioGroup.Root';

export type RadioGroupItemRenderProps = {
  selected: boolean;
  disabled: boolean;
};

export interface RadioGroupItemProps extends Omit<
  PressableProps,
  'children' | 'onPress' | 'disabled'
> {
  value: string;
  disabled?: boolean;
  children:
    React.ReactNode | ((state: RadioGroupItemRenderProps) => React.ReactNode);
}

function Item({
  value,
  disabled: itemDisabled = false,
  children,
  ...pressableProps
}: RadioGroupItemProps) {
  const {
    value: selectedValue,
    disabled: groupDisabled,
    selectValue,
    registerValue,
    unregisterValue,
  } = useRadioGroupContext('Item');
  const selected = selectedValue === value;
  const disabled = itemDisabled || groupDisabled;

  useRegisteredValue(registerValue, unregisterValue, value);

  const handlePress = useCallback(() => {
    // Matches native radio buttons: pressing the already-selected item is a
    // no-op. Use the imperative `clear()` on RadioGroupHandle to reset
    // programmatically instead.
    if (disabled || selected) return;
    selectValue(value);
  }, [disabled, selected, selectValue, value]);

  const itemContextValue = useMemo(() => ({ selected }), [selected]);

  return (
    <RadioGroupItemContext.Provider value={itemContextValue}>
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ checked: selected, disabled }}
        disabled={disabled}
        onPress={handlePress}
        {...pressableProps}
      >
        {typeof children === 'function'
          ? children({ selected, disabled })
          : children}
      </Pressable>
    </RadioGroupItemContext.Provider>
  );
}
Item.displayName = 'RadioGroup.Item';

export type RadioGroupIndicatorRenderProps = {
  selected: boolean;
};

export interface RadioGroupIndicatorProps extends Omit<ViewProps, 'children'> {
  /** Keep the indicator mounted even when unselected, e.g. to drive an exit animation yourself. */
  forceMount?: boolean;
  children:
    | React.ReactNode
    | ((state: RadioGroupIndicatorRenderProps) => React.ReactNode);
}

function Indicator({
  forceMount = false,
  children,
  ...viewProps
}: RadioGroupIndicatorProps) {
  const { selected } = useRadioGroupItemContext('Indicator');

  if (!selected && !forceMount) {
    return null;
  }

  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      {...viewProps}
    >
      {typeof children === 'function' ? children({ selected }) : children}
    </View>
  );
}
Indicator.displayName = 'RadioGroup.Indicator';

export const RadioGroup = {
  Root,
  Item,
  Indicator,
};
