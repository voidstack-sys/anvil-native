import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type PressableProps,
  type TextProps,
  type ViewProps,
} from 'react-native';
import {
  controlledChangeMessage,
  useWarnOnceWhen,
} from '../../internal/devWarnings';
import {
  computePosition,
  type FloatingAlign,
  type FloatingSide,
  type Rect,
  type Size,
} from '../../internal/positioning';
import {
  useRegisteredValue,
  useValueRegistry,
} from '../../internal/useValueRegistry';

type ViewRef = React.ComponentRef<typeof View>;

interface SelectContextValue {
  open: boolean;
  disabled: boolean;
  value: string | null;
  selectedLabel: string | null;
  triggerRef: React.RefObject<ViewRef | null>;
  openSelect: () => void;
  closeSelect: () => void;
  toggleSelect: () => void;
  selectValue: (value: string) => void;
  registerValue: (value: string) => void;
  unregisterValue: (value: string) => void;
  registerItemLabel: (value: string, label: string) => void;
}

const SelectContext = createContext<SelectContextValue | null>(null);

function useSelectContext(component: string): SelectContextValue {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error(`Select.${component} must be used within a Select.Root`);
  }
  return context;
}

interface SelectItemContextValue {
  value: string;
  selected: boolean;
  disabled: boolean;
}

const SelectItemContext = createContext<SelectItemContextValue | null>(null);

function useSelectItemContext(component: string): SelectItemContextValue {
  const context = useContext(SelectItemContext);
  if (!context) {
    throw new Error(`Select.${component} must be used within a Select.Item`);
  }
  return context;
}

export interface SelectRootProps {
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Disables the trigger and every item, regardless of each item's own `disabled` prop. */
  disabled?: boolean;
  children: React.ReactNode;
}

export interface SelectHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
  getValue: () => string | null;
  setValue: (value: string | null) => void;
}

const Root = forwardRef<SelectHandle, SelectRootProps>(function SelectRoot(
  {
    value,
    defaultValue = null,
    onValueChange,
    open,
    defaultOpen = false,
    onOpenChange,
    disabled = false,
    children,
  },
  ref
) {
  const isValueControlled = value !== undefined;
  const initialIsValueControlled = useRef(isValueControlled).current;
  const isOpenControlled = open !== undefined;
  const initialIsOpenControlled = useRef(isOpenControlled).current;

  useWarnOnceWhen(isValueControlled !== initialIsValueControlled, () =>
    controlledChangeMessage(
      'Select.Root',
      initialIsValueControlled,
      isValueControlled,
      'value'
    )
  );
  useWarnOnceWhen(isOpenControlled !== initialIsOpenControlled, () =>
    controlledChangeMessage(
      'Select.Root',
      initialIsOpenControlled,
      isOpenControlled,
      'open'
    )
  );

  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const currentValue = isValueControlled ? (value ?? null) : uncontrolledValue;

  const setValue = useCallback(
    (next: string | null) => {
      if (!isValueControlled) {
        setUncontrolledValue(next);
      }
      onValueChange?.(next);
    },
    [isValueControlled, onValueChange]
  );

  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = isOpenControlled ? (open ?? false) : uncontrolledOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isOpenControlled) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
    },
    [isOpenControlled, onOpenChange]
  );

  const openSelect = useCallback(() => setOpen(true), [setOpen]);
  const closeSelect = useCallback(() => setOpen(false), [setOpen]);
  const toggleSelect = useCallback(() => setOpen(!isOpen), [setOpen, isOpen]);
  const selectValue = useCallback((next: string) => setValue(next), [setValue]);

  const triggerRef = useRef<ViewRef>(null);

  const { register: registerValue, unregister: unregisterValue } =
    useValueRegistry('Select');

  // Labels are kept once seen and never removed on unmount: Select.Content
  // unmounts its items while closed, but Select.Value still needs to show
  // the label of whatever value is currently selected.
  const [labels, setLabels] = useState<Record<string, string>>({});
  const registerItemLabel = useCallback((itemValue: string, label: string) => {
    setLabels((prev) =>
      prev[itemValue] === label ? prev : { ...prev, [itemValue]: label }
    );
  }, []);
  const selectedLabel =
    currentValue !== null ? (labels[currentValue] ?? null) : null;

  useImperativeHandle(
    ref,
    () => ({
      open: openSelect,
      close: closeSelect,
      toggle: toggleSelect,
      isOpen: () => isOpen,
      getValue: () => currentValue,
      setValue,
    }),
    [openSelect, closeSelect, toggleSelect, isOpen, currentValue, setValue]
  );

  const contextValue = useMemo(
    () => ({
      open: isOpen,
      disabled,
      value: currentValue,
      selectedLabel,
      triggerRef,
      openSelect,
      closeSelect,
      toggleSelect,
      selectValue,
      registerValue,
      unregisterValue,
      registerItemLabel,
    }),
    [
      isOpen,
      disabled,
      currentValue,
      selectedLabel,
      openSelect,
      closeSelect,
      toggleSelect,
      selectValue,
      registerValue,
      unregisterValue,
      registerItemLabel,
    ]
  );

  return (
    <SelectContext.Provider value={contextValue}>
      {children}
    </SelectContext.Provider>
  );
});
Root.displayName = 'Select.Root';

export type SelectTriggerRenderProps = {
  open: boolean;
  disabled: boolean;
};

export interface SelectTriggerProps extends Omit<
  PressableProps,
  'children' | 'onPress' | 'disabled'
> {
  disabled?: boolean;
  children:
    React.ReactNode | ((state: SelectTriggerRenderProps) => React.ReactNode);
}

function Trigger({
  disabled: triggerDisabled = false,
  children,
  ...pressableProps
}: SelectTriggerProps) {
  const {
    open,
    disabled: groupDisabled,
    triggerRef,
    toggleSelect,
  } = useSelectContext('Trigger');
  const disabled = triggerDisabled || groupDisabled;

  const handlePress = useCallback(() => {
    if (disabled) return;
    toggleSelect();
  }, [disabled, toggleSelect]);

  return (
    <Pressable
      ref={triggerRef}
      accessibilityRole="combobox"
      accessibilityState={{ expanded: open, disabled }}
      disabled={disabled}
      onPress={handlePress}
      {...pressableProps}
    >
      {typeof children === 'function' ? children({ open, disabled }) : children}
    </Pressable>
  );
}
Trigger.displayName = 'Select.Trigger';

export interface SelectValueProps extends Omit<TextProps, 'children'> {
  placeholder?: string;
}

function Value({ placeholder, ...textProps }: SelectValueProps) {
  const { selectedLabel } = useSelectContext('Value');
  return <Text {...textProps}>{selectedLabel ?? placeholder ?? ''}</Text>;
}
Value.displayName = 'Select.Value';

export type SelectContentRenderProps = {
  /** The side the content actually ended up on (may differ from the requested `side` if it got flipped). */
  side: FloatingSide;
};

export interface SelectContentProps extends Omit<ViewProps, 'children'> {
  side?: FloatingSide;
  align?: FloatingAlign;
  sideOffset?: number;
  alignOffset?: number;
  /** Flip to the opposite side, and clamp cross-axis position, so content stays on-screen. Defaults to true. */
  avoidCollisions?: boolean;
  /** Close when the backdrop (outside the content) is pressed. Defaults to true. */
  closeOnOutsidePress?: boolean;
  /** Keep the content mounted (invisible) even when closed. Content won't reposition itself while closed. */
  forceMount?: boolean;
  children:
    React.ReactNode | ((state: SelectContentRenderProps) => React.ReactNode);
}

function Content({
  side = 'bottom',
  align = 'start',
  sideOffset = 4,
  alignOffset = 0,
  avoidCollisions = true,
  closeOnOutsidePress = true,
  forceMount = false,
  children,
  style,
  ...viewProps
}: SelectContentProps) {
  const { open, triggerRef, closeSelect } = useSelectContext('Content');
  const windowSize = useWindowDimensions();

  const [anchorRect, setAnchorRect] = useState<Rect | null>(null);
  const [contentSize, setContentSize] = useState<Size | null>(null);

  useEffect(() => {
    if (!open) {
      setAnchorRect(null);
      setContentSize(null);
      return;
    }

    const node = triggerRef.current;
    if (node && typeof node.measureInWindow === 'function') {
      node.measureInWindow((x, y, width, height) => {
        setAnchorRect({ x, y, width, height });
      });
    } else {
      setAnchorRect({ x: 0, y: 0, width: 0, height: 0 });
    }
  }, [open, triggerRef]);

  if (!open && !forceMount) {
    return null;
  }

  const position =
    anchorRect && contentSize
      ? computePosition({
          anchorRect,
          contentSize,
          windowSize,
          side,
          align,
          sideOffset,
          alignOffset,
          avoidCollisions,
        })
      : null;

  return (
    <Modal
      transparent
      visible={open}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={closeSelect}
    >
      <Pressable
        testID="anvil-select-backdrop"
        style={StyleSheet.absoluteFill}
        onPress={closeOnOutsidePress ? closeSelect : undefined}
        accessibilityRole={closeOnOutsidePress ? 'button' : undefined}
        accessibilityLabel={closeOnOutsidePress ? 'Close select' : undefined}
        accessibilityElementsHidden={!closeOnOutsidePress}
        importantForAccessibility={
          closeOnOutsidePress ? 'auto' : 'no-hide-descendants'
        }
      />
      <View
        accessibilityRole="list"
        accessibilityViewIsModal
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setContentSize({ width, height });
        }}
        style={[
          styles.content,
          position
            ? [{ top: position.top, left: position.left }, styles.positioned]
            : styles.measuring,
          style,
        ]}
        {...viewProps}
      >
        {typeof children === 'function'
          ? children({ side: position?.side ?? side })
          : children}
      </View>
    </Modal>
  );
}
Content.displayName = 'Select.Content';

const styles = StyleSheet.create({
  content: {
    position: 'absolute',
  },
  positioned: {
    opacity: 1,
  },
  measuring: {
    top: 0,
    left: 0,
    opacity: 0,
  },
});

export type SelectItemRenderProps = {
  selected: boolean;
  disabled: boolean;
};

export interface SelectItemProps extends Omit<
  PressableProps,
  'children' | 'onPress' | 'disabled'
> {
  value: string;
  disabled?: boolean;
  /** Close the select after this item is pressed. Defaults to true. */
  closeOnSelect?: boolean;
  children:
    React.ReactNode | ((state: SelectItemRenderProps) => React.ReactNode);
}

function Item({
  value,
  disabled: itemDisabled = false,
  closeOnSelect = true,
  children,
  ...pressableProps
}: SelectItemProps) {
  const {
    value: selectedValue,
    disabled: groupDisabled,
    selectValue,
    closeSelect,
    registerValue,
    unregisterValue,
  } = useSelectContext('Item');
  const selected = selectedValue === value;
  const disabled = itemDisabled || groupDisabled;

  useRegisteredValue(registerValue, unregisterValue, value);

  const handlePress = useCallback(() => {
    if (disabled) return;
    selectValue(value);
    if (closeOnSelect) closeSelect();
  }, [disabled, selectValue, value, closeOnSelect, closeSelect]);

  const itemContextValue = useMemo(
    () => ({ value, selected, disabled }),
    [value, selected, disabled]
  );

  return (
    <SelectItemContext.Provider value={itemContextValue}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected, disabled }}
        disabled={disabled}
        onPress={handlePress}
        {...pressableProps}
      >
        {typeof children === 'function'
          ? children({ selected, disabled })
          : children}
      </Pressable>
    </SelectItemContext.Provider>
  );
}
Item.displayName = 'Select.Item';

export type SelectItemTextProps = TextProps;

function ItemText({ children, ...textProps }: SelectItemTextProps) {
  const { registerItemLabel } = useSelectContext('ItemText');
  const { value } = useSelectItemContext('ItemText');
  const label = typeof children === 'string' ? children : undefined;

  useWarnOnceWhen(
    label === undefined,
    () =>
      `Select.ItemText: expected a plain string child so Select.Value can display it, but got ` +
      `${typeof children}. Pass the option's label as a plain string.`
  );

  useEffect(() => {
    if (label === undefined) return;
    registerItemLabel(value, label);
    // Deliberately no cleanup: Select.Content unmounts items while closed,
    // but the label of a previously-seen value must keep being displayable
    // by Select.Value after the menu closes.
  }, [value, label, registerItemLabel]);

  return <Text {...textProps}>{children}</Text>;
}
ItemText.displayName = 'Select.ItemText';

export type SelectSeparatorProps = ViewProps;

function Separator(props: SelectSeparatorProps) {
  return <View importantForAccessibility="no" {...props} />;
}
Separator.displayName = 'Select.Separator';

export type SelectLabelProps = TextProps;

function Label(props: SelectLabelProps) {
  return <Text {...props} />;
}
Label.displayName = 'Select.Label';

export const Select = {
  Root,
  Trigger,
  Value,
  Content,
  Item,
  ItemText,
  Separator,
  Label,
};
