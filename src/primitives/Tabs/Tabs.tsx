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

interface TabsContextValue {
  value: string | null;
  disabled: boolean;
  selectValue: (value: string) => void;
  registerValue: (value: string) => void;
  unregisterValue: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(component: string): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error(`Tabs.${component} must be used within a Tabs.Root`);
  }
  return context;
}

export interface TabsRootProps extends Omit<ViewProps, 'children'> {
  value?: string;
  /**
   * Initial active tab for uncontrolled usage. If omitted (and `value` isn't
   * passed either), no tab starts selected until the consumer picks one.
   */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Disables every trigger in the group, regardless of each trigger's own `disabled` prop. */
  disabled?: boolean;
  children: React.ReactNode;
}

export interface TabsHandle {
  select: (value: string) => void;
  getValue: () => string | null;
}

const Root = forwardRef<TabsHandle, TabsRootProps>(function TabsRoot(
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
    controlledChangeMessage('Tabs.Root', initialIsControlled, isControlled)
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

  const { register: registerValue, unregister: unregisterValue } =
    useValueRegistry('Tabs');

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
      selectValue,
      registerValue,
      unregisterValue,
    }),
    [activeValue, disabled, selectValue, registerValue, unregisterValue]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <View accessibilityState={{ disabled }} {...viewProps}>
        {children}
      </View>
    </TabsContext.Provider>
  );
});
Root.displayName = 'Tabs.Root';

export type TabsListProps = ViewProps;

function List({ children, ...viewProps }: TabsListProps) {
  return (
    <View accessibilityRole="tablist" {...viewProps}>
      {children}
    </View>
  );
}
List.displayName = 'Tabs.List';

export type TabsTriggerRenderProps = {
  selected: boolean;
  disabled: boolean;
};

export interface TabsTriggerProps extends Omit<
  PressableProps,
  'children' | 'onPress' | 'disabled'
> {
  value: string;
  disabled?: boolean;
  children:
    React.ReactNode | ((state: TabsTriggerRenderProps) => React.ReactNode);
}

function Trigger({
  value,
  disabled: triggerDisabled = false,
  children,
  ...pressableProps
}: TabsTriggerProps) {
  const {
    value: activeValue,
    disabled: groupDisabled,
    selectValue,
    registerValue,
    unregisterValue,
  } = useTabsContext('Trigger');
  const selected = activeValue === value;
  const disabled = triggerDisabled || groupDisabled;

  useRegisteredValue(registerValue, unregisterValue, value);

  const handlePress = useCallback(() => {
    if (disabled) return;
    selectValue(value);
  }, [disabled, selectValue, value]);

  return (
    <Pressable
      accessibilityRole="tab"
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
Trigger.displayName = 'Tabs.Trigger';

export type TabsContentRenderProps = {
  selected: boolean;
};

export interface TabsContentProps extends Omit<ViewProps, 'children'> {
  value: string;
  children:
    React.ReactNode | ((state: TabsContentRenderProps) => React.ReactNode);
  /**
   * Keep the content mounted even when its tab isn't selected. Useful when
   * animating transitions between tabs yourself.
   */
  forceMount?: boolean;
}

function Content({
  value,
  forceMount = false,
  children,
  ...viewProps
}: TabsContentProps) {
  const { value: activeValue } = useTabsContext('Content');
  const selected = activeValue === value;

  if (!selected && !forceMount) {
    return null;
  }

  return (
    <View
      accessibilityElementsHidden={!selected}
      importantForAccessibility={selected ? 'auto' : 'no-hide-descendants'}
      {...viewProps}
    >
      {typeof children === 'function' ? children({ selected }) : children}
    </View>
  );
}
Content.displayName = 'Tabs.Content';

export const Tabs = {
  Root,
  List,
  Trigger,
  Content,
};
