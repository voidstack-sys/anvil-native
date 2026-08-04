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

interface AccordionContextValue {
  values: string[];
  disabled: boolean;
  toggleValue: (value: string) => void;
  registerValue: (value: string) => void;
  unregisterValue: (value: string) => void;
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

interface AccordionBaseRootProps extends Omit<ViewProps, 'children'> {
  /** Disables every item in the group, regardless of each item's own `disabled` prop. */
  disabled?: boolean;
  children: React.ReactNode;
}

interface AccordionSingleRootProps extends AccordionBaseRootProps {
  type: 'single';
  /** Whether the open item can be closed by pressing it again. Defaults to true. */
  collapsible?: boolean;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
}

interface AccordionMultipleRootProps extends AccordionBaseRootProps {
  type: 'multiple';
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

export type AccordionRootProps =
  AccordionSingleRootProps | AccordionMultipleRootProps;

export interface AccordionHandle {
  /** Opens `value`. In `type="single"` mode this closes whatever else was open. */
  open: (value: string) => void;
  close: (value: string) => void;
  toggle: (value: string) => void;
  getValue: () => string[];
}

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

const Root = forwardRef<AccordionHandle, AccordionRootProps>(
  function AccordionRoot(props, ref) {
    const { type, children, disabled = false, ...viewProps } = props;
    const isControlled = props.value !== undefined;

    const initialType = useRef(type).current;
    const initialIsControlled = useRef(isControlled).current;

    useWarnOnceWhen(type !== initialType, () =>
      typeChangeMessage('Accordion.Root', initialType, type)
    );
    useWarnOnceWhen(isControlled !== initialIsControlled, () =>
      controlledChangeMessage(
        'Accordion.Root',
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
          (props as AccordionSingleRootProps).onValueChange?.(
            nextValues[0] ?? null
          );
        } else {
          (props as AccordionMultipleRootProps).onValueChange?.(nextValues);
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [type, isControlled, props.type]
    );

    const toggleValue = useCallback(
      (itemValue: string) => {
        const isOpen = values.includes(itemValue);
        const collapsible =
          type === 'single'
            ? ((props as AccordionSingleRootProps).collapsible ?? true)
            : true;
        const nextValues =
          type === 'single'
            ? isOpen
              ? collapsible
                ? []
                : [itemValue]
              : [itemValue]
            : isOpen
              ? values.filter((v) => v !== itemValue)
              : [...values, itemValue];

        commitValues(nextValues);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [type, values, commitValues, props.type]
    );

    const { register: registerValue, unregister: unregisterValue } =
      useValueRegistry('Accordion');

    useImperativeHandle(
      ref,
      () => ({
        open: (itemValue: string) => {
          if (values.includes(itemValue)) return;
          commitValues(
            type === 'single' ? [itemValue] : [...values, itemValue]
          );
        },
        close: (itemValue: string) => {
          if (!values.includes(itemValue)) return;
          commitValues(values.filter((v) => v !== itemValue));
        },
        toggle: toggleValue,
        getValue: () => values,
      }),
      [values, type, commitValues, toggleValue]
    );

    const contextValue = useMemo(
      () => ({ values, disabled, toggleValue, registerValue, unregisterValue }),
      [values, disabled, toggleValue, registerValue, unregisterValue]
    );

    return (
      <AccordionContext.Provider value={contextValue}>
        <View accessibilityState={{ disabled }} {...viewProps}>
          {children}
        </View>
      </AccordionContext.Provider>
    );
  }
);
Root.displayName = 'Accordion.Root';

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
  const {
    values,
    disabled: groupDisabled,
    registerValue,
    unregisterValue,
  } = useAccordionContext('Item');
  const expanded = values.includes(value);
  const effectiveDisabled = disabled || groupDisabled;

  useRegisteredValue(registerValue, unregisterValue, value);

  const itemContextValue = useMemo(
    () => ({ value, expanded, disabled: effectiveDisabled }),
    [value, expanded, effectiveDisabled]
  );

  return (
    <AccordionItemContext.Provider value={itemContextValue}>
      <View {...viewProps}>{children}</View>
    </AccordionItemContext.Provider>
  );
}
Item.displayName = 'Accordion.Item';

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
Trigger.displayName = 'Accordion.Trigger';

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
Content.displayName = 'Accordion.Content';

export const Accordion = {
  Root,
  Item,
  Trigger,
  Content,
};
