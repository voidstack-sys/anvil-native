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

interface AccordionContextValue {
  values: string[];
  toggleValue: (value: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext(component: string): AccordionContextValue {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error(
      `Accordion.${component} must be used within an Accordion.Root`
    );
  }
  return context;
}

interface AccordionItemContextValue {
  value: string;
  expanded: boolean;
  disabled: boolean;
}

const AccordionItemContext = createContext<AccordionItemContextValue | null>(
  null
);

function useAccordionItemContext(component: string): AccordionItemContextValue {
  const context = useContext(AccordionItemContext);
  if (!context) {
    throw new Error(
      `Accordion.${component} must be used within an Accordion.Item`
    );
  }
  return context;
}

interface AccordionSingleRootProps {
  type: 'single';
  /** Whether the open item can be closed by pressing it again. Defaults to true. */
  collapsible?: boolean;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  children: React.ReactNode;
}

interface AccordionMultipleRootProps {
  type: 'multiple';
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  children: React.ReactNode;
}

export type AccordionRootProps = (
  AccordionSingleRootProps | AccordionMultipleRootProps
) &
  Omit<ViewProps, 'children'>;

function normalizeValues(
  props: AccordionRootProps,
  source: 'value' | 'defaultValue'
): string[] {
  if (props.type === 'single') {
    const raw = props[source];
    return raw ? [raw] : [];
  }
  return props[source] ?? [];
}

function Root(props: AccordionRootProps) {
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
      const isOpen = values.includes(itemValue);
      let nextValues: string[];

      if (type === 'single') {
        const collapsible =
          (props as AccordionSingleRootProps).collapsible ?? true;
        nextValues = isOpen ? (collapsible ? [] : [itemValue]) : [itemValue];
      } else {
        nextValues = isOpen
          ? values.filter((v) => v !== itemValue)
          : [...values, itemValue];
      }

      if (!isControlled) {
        setUncontrolledValues(nextValues);
      }

      if (type === 'single') {
        (props as AccordionSingleRootProps).onValueChange?.(
          nextValues[0] ?? null
        );
      } else {
        (props as AccordionMultipleRootProps).onValueChange?.(nextValues);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [type, values, isControlled, props.type]
  );

  const contextValue = useMemo(
    () => ({ values, toggleValue }),
    [values, toggleValue]
  );

  return (
    <AccordionContext.Provider value={contextValue}>
      <View {...viewProps}>{children}</View>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps extends Omit<ViewProps, 'children'> {
  value: string;
  disabled?: boolean;
  children: React.ReactNode;
}

function Item({
  value,
  disabled = false,
  children,
  ...viewProps
}: AccordionItemProps) {
  const { values } = useAccordionContext('Item');
  const expanded = values.includes(value);

  const itemContextValue = useMemo(
    () => ({ value, expanded, disabled }),
    [value, expanded, disabled]
  );

  return (
    <AccordionItemContext.Provider value={itemContextValue}>
      <View {...viewProps}>{children}</View>
    </AccordionItemContext.Provider>
  );
}

export type AccordionTriggerRenderProps = {
  expanded: boolean;
  disabled: boolean;
};

export interface AccordionTriggerProps extends Omit<
  PressableProps,
  'children' | 'onPress' | 'disabled'
> {
  children:
    React.ReactNode | ((state: AccordionTriggerRenderProps) => React.ReactNode);
}

function Trigger({ children, ...pressableProps }: AccordionTriggerProps) {
  const { toggleValue } = useAccordionContext('Trigger');
  const { value, expanded, disabled } = useAccordionItemContext('Trigger');

  const handlePress = useCallback(() => {
    if (disabled) return;
    toggleValue(value);
  }, [disabled, toggleValue, value]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded, disabled }}
      disabled={disabled}
      onPress={handlePress}
      {...pressableProps}
    >
      {typeof children === 'function'
        ? children({ expanded, disabled })
        : children}
    </Pressable>
  );
}

export type AccordionContentRenderProps = {
  expanded: boolean;
};

export interface AccordionContentProps extends Omit<ViewProps, 'children'> {
  children:
    React.ReactNode | ((state: AccordionContentRenderProps) => React.ReactNode);
  /**
   * Keep the content mounted (but hidden from accessibility and layout-collapsed
   * via the caller's own styling) even when closed. Useful when animating
   * height with something like `react-native-reanimated`.
   */
  forceMount?: boolean;
}

function Content({
  children,
  forceMount = false,
  ...viewProps
}: AccordionContentProps) {
  const { expanded } = useAccordionItemContext('Content');

  if (!expanded && !forceMount) {
    return null;
  }

  return (
    <View
      accessibilityElementsHidden={!expanded}
      importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}
      {...viewProps}
    >
      {typeof children === 'function' ? children({ expanded }) : children}
    </View>
  );
}

export const Accordion = {
  Root,
  Item,
  Trigger,
  Content,
};
