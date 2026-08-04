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
  typeChangeMessage,
  useWarnOnceWhen,
} from '../../internal/devWarnings';
import {
  useRegisteredValue,
  useValueRegistry,
} from '../../internal/useValueRegistry';

interface ToggleGroupContextValue {
  type: 'single' | 'multiple';
  values: string[];
  disabled: boolean;
  toggleValue: (value: string) => void;
  registerValue: (value: string) => void;
  unregisterValue: (value: string) => void;
}

const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(null);

function useToggleGroupContext(component: string): ToggleGroupContextValue {
  const context = useContext(ToggleGroupContext);
  if (!context) {
    throw new Error(
      `ToggleGroup.${component} must be used within a ToggleGroup.Root`
    );
  }
  return context;
}

interface ToggleGroupBaseRootProps extends Omit<ViewProps, 'children'> {
  /** Disables every item in the group, regardless of each item's own `disabled` prop. */
  disabled?: boolean;
  children: React.ReactNode;
}

interface ToggleGroupSingleRootProps extends ToggleGroupBaseRootProps {
  type: 'single';
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
}

interface ToggleGroupMultipleRootProps extends ToggleGroupBaseRootProps {
  type: 'multiple';
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

export type ToggleGroupRootProps =
  ToggleGroupSingleRootProps | ToggleGroupMultipleRootProps;

export interface ToggleGroupHandle {
  select: (value: string) => void;
  deselect: (value: string) => void;
  toggle: (value: string) => void;
  getValue: () => string[];
}

function normalizeValues(
  props: ToggleGroupRootProps,
  source: 'value' | 'defaultValue'
): string[] {
  if (props.type === 'single') {
    const raw = props[source];
    return raw ? [raw] : [];
  }
  return props[source] ?? [];
}

const Root = forwardRef<ToggleGroupHandle, ToggleGroupRootProps>(
  function ToggleGroupRoot(props, ref) {
    const { type, children, disabled = false, ...viewProps } = props;
    const isControlled = props.value !== undefined;

    const initialType = useRef(type).current;
    const initialIsControlled = useRef(isControlled).current;

    useWarnOnceWhen(type !== initialType, () =>
      typeChangeMessage('ToggleGroup.Root', initialType, type)
    );
    useWarnOnceWhen(isControlled !== initialIsControlled, () =>
      controlledChangeMessage(
        'ToggleGroup.Root',
        initialIsControlled,
        isControlled
      )
    );

    const [uncontrolledValues, setUncontrolledValues] = useState<string[]>(() =>
      normalizeValues(props, 'defaultValue')
    );

    const values = isControlled
      ? normalizeValues(props, 'value')
      : uncontrolledValues;

    const commitValues = useCallback(
      (nextValues: string[]) => {
        if (!isControlled) {
          setUncontrolledValues(nextValues);
        }
        if (type === 'single') {
          (props as ToggleGroupSingleRootProps).onValueChange?.(
            nextValues[0] ?? null
          );
        } else {
          (props as ToggleGroupMultipleRootProps).onValueChange?.(nextValues);
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [type, isControlled, props.type]
    );

    const toggleValue = useCallback(
      (itemValue: string) => {
        const isOn = values.includes(itemValue);
        const nextValues =
          type === 'single'
            ? isOn
              ? []
              : [itemValue]
            : isOn
              ? values.filter((v) => v !== itemValue)
              : [...values, itemValue];

        commitValues(nextValues);
      },
      [type, values, commitValues]
    );

    const { register: registerValue, unregister: unregisterValue } =
      useValueRegistry('ToggleGroup');

    useImperativeHandle(
      ref,
      () => ({
        select: (itemValue: string) => {
          if (values.includes(itemValue)) return;
          commitValues(
            type === 'single' ? [itemValue] : [...values, itemValue]
          );
        },
        deselect: (itemValue: string) => {
          if (!values.includes(itemValue)) return;
          commitValues(values.filter((v) => v !== itemValue));
        },
        toggle: toggleValue,
        getValue: () => values,
      }),
      [values, type, commitValues, toggleValue]
    );

    const contextValue = useMemo(
      () => ({
        type,
        values,
        disabled,
        toggleValue,
        registerValue,
        unregisterValue,
      }),
      [type, values, disabled, toggleValue, registerValue, unregisterValue]
    );

    return (
      <ToggleGroupContext.Provider value={contextValue}>
        <View
          accessibilityRole={type === 'single' ? 'radiogroup' : undefined}
          accessibilityState={{ disabled }}
          {...viewProps}
        >
          {children}
        </View>
      </ToggleGroupContext.Provider>
    );
  }
);
Root.displayName = 'ToggleGroup.Root';

export type ToggleGroupItemRenderProps = {
  selected: boolean;
  disabled: boolean;
};

export interface ToggleGroupItemProps extends Omit<
  PressableProps,
  'children' | 'onPress' | 'disabled'
> {
  value: string;
  disabled?: boolean;
  children:
    React.ReactNode | ((state: ToggleGroupItemRenderProps) => React.ReactNode);
}

function Item({
  value,
  disabled: itemDisabled = false,
  children,
  ...pressableProps
}: ToggleGroupItemProps) {
  const {
    type,
    values,
    disabled: groupDisabled,
    toggleValue,
    registerValue,
    unregisterValue,
  } = useToggleGroupContext('Item');
  const selected = values.includes(value);
  const disabled = itemDisabled || groupDisabled;

  useRegisteredValue(registerValue, unregisterValue, value);

  const handlePress = useCallback(() => {
    if (disabled) return;
    toggleValue(value);
  }, [disabled, toggleValue, value]);

  return (
    <Pressable
      accessibilityRole={type === 'single' ? 'radio' : 'checkbox'}
      accessibilityState={{ checked: selected, disabled }}
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
Item.displayName = 'ToggleGroup.Item';

export const ToggleGroup = {
  Root,
  Item,
};
