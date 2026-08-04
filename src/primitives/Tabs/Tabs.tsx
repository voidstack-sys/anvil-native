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

interface TabsContextValue {
  value: string | null;
  selectValue: (value: string) => void;
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
  children: React.ReactNode;
}

function Root({
  value,
  defaultValue,
  onValueChange,
  children,
  ...viewProps
}: TabsRootProps) {
  const isControlled = value !== undefined;

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

  const contextValue = useMemo(
    () => ({ value: activeValue, selectValue }),
    [activeValue, selectValue]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <View {...viewProps}>{children}</View>
    </TabsContext.Provider>
  );
}

export type TabsListProps = ViewProps;

function List({ children, ...viewProps }: TabsListProps) {
  return (
    <View accessibilityRole="tablist" {...viewProps}>
      {children}
    </View>
  );
}

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
  disabled = false,
  children,
  ...pressableProps
}: TabsTriggerProps) {
  const { value: activeValue, selectValue } = useTabsContext('Trigger');
  const selected = activeValue === value;

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

export const Tabs = {
  Root,
  List,
  Trigger,
  Content,
};
