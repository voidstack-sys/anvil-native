import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  Pressable,
  View,
  type PressableProps,
  type ViewProps,
} from 'react-native';

interface ToggleGroupContextValue {
  type: 'single' | 'multiple';
  values: string[];
  toggleValue: (value: string) => void;
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

interface ToggleGroupSingleRootProps {
  type: 'single';
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  children: React.ReactNode;
}

interface ToggleGroupMultipleRootProps {
  type: 'multiple';
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  children: React.ReactNode;
}

export type ToggleGroupRootProps = (
  ToggleGroupSingleRootProps | ToggleGroupMultipleRootProps
) &
  Omit<ViewProps, 'children'>;

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

function Root(props: ToggleGroupRootProps) {
  const { type, children, ...viewProps } = props;
  const isControlled = props.value !== undefined;

  const [uncontrolledValues, setUncontrolledValues] = useState<string[]>(() =>
    normalizeValues(props, 'defaultValue')
  );

  const values = isControlled
    ? normalizeValues(props, 'value')
    : uncontrolledValues;

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
    [type, values, isControlled, props.type]
  );

  const contextValue = useMemo(
    () => ({ type, values, toggleValue }),
    [type, values, toggleValue]
  );

  return (
    <ToggleGroupContext.Provider value={contextValue}>
      <View
        accessibilityRole={type === 'single' ? 'radiogroup' : undefined}
        {...viewProps}
      >
        {children}
      </View>
    </ToggleGroupContext.Provider>
  );
}

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
  disabled = false,
  children,
  ...pressableProps
}: ToggleGroupItemProps) {
  const { type, values, toggleValue } = useToggleGroupContext('Item');
  const selected = values.includes(value);

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

export const ToggleGroup = {
  Root,
  Item,
};
