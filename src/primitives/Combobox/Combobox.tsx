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
  TextInput,
  View,
  useWindowDimensions,
  type PressableProps,
  type TextInputProps,
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

type TextInputRef = React.ComponentRef<typeof TextInput>;

interface ComboboxContextValue {
  open: boolean;
  disabled: boolean;
  value: string | null;
  query: string;
  inputRef: React.RefObject<TextInputRef | null>;
  /**
   * Closing the popover's `Modal` returns focus to `Input` (standard modal
   * a11y behavior), which would otherwise immediately re-fire `onFocus` and
   * reopen it. Item sets this before closing on selection so Input's next
   * focus event is swallowed instead of reopening.
   */
  suppressReopenRef: React.RefObject<boolean>;
  openCombobox: () => void;
  closeCombobox: () => void;
  toggleCombobox: () => void;
  setQuery: (query: string) => void;
  selectValue: (value: string) => void;
  registerValue: (value: string) => void;
  unregisterValue: (value: string) => void;
  registerItemLabel: (value: string, label: string) => void;
}

const ComboboxContext = createContext<ComboboxContextValue | null>(null);

function useComboboxContext(component: string): ComboboxContextValue {
  const context = useContext(ComboboxContext);
  if (!context) {
    throw new Error(
      `Combobox.${component} must be used within a Combobox.Root`
    );
  }
  return context;
}

interface ComboboxItemContextValue {
  value: string;
  selected: boolean;
  disabled: boolean;
}

const ComboboxItemContext = createContext<ComboboxItemContextValue | null>(
  null
);

function useComboboxItemContext(component: string): ComboboxItemContextValue {
  const context = useContext(ComboboxItemContext);
  if (!context) {
    throw new Error(
      `Combobox.${component} must be used within a Combobox.Item`
    );
  }
  return context;
}

export interface ComboboxRootProps {
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Disables the input and every item, regardless of each item's own `disabled` prop. */
  disabled?: boolean;
  children: React.ReactNode;
}

export interface ComboboxHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
  getValue: () => string | null;
  setValue: (value: string | null) => void;
  getQuery: () => string;
  setQuery: (query: string) => void;
}

const Root = forwardRef<ComboboxHandle, ComboboxRootProps>(
  function ComboboxRoot(
    {
      value,
      defaultValue = null,
      onValueChange,
      query,
      defaultQuery = '',
      onQueryChange,
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
    const isQueryControlled = query !== undefined;
    const initialIsQueryControlled = useRef(isQueryControlled).current;
    const isOpenControlled = open !== undefined;
    const initialIsOpenControlled = useRef(isOpenControlled).current;

    useWarnOnceWhen(isValueControlled !== initialIsValueControlled, () =>
      controlledChangeMessage(
        'Combobox.Root',
        initialIsValueControlled,
        isValueControlled,
        'value'
      )
    );
    useWarnOnceWhen(isQueryControlled !== initialIsQueryControlled, () =>
      controlledChangeMessage(
        'Combobox.Root',
        initialIsQueryControlled,
        isQueryControlled,
        'query'
      )
    );
    useWarnOnceWhen(isOpenControlled !== initialIsOpenControlled, () =>
      controlledChangeMessage(
        'Combobox.Root',
        initialIsOpenControlled,
        isOpenControlled,
        'open'
      )
    );

    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
    const currentValue = isValueControlled
      ? (value ?? null)
      : uncontrolledValue;

    const [uncontrolledQuery, setUncontrolledQuery] = useState(defaultQuery);
    const currentQuery = isQueryControlled ? (query ?? '') : uncontrolledQuery;

    const setQuery = useCallback(
      (next: string) => {
        if (!isQueryControlled) {
          setUncontrolledQuery(next);
        }
        onQueryChange?.(next);
      },
      [isQueryControlled, onQueryChange]
    );

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

    const openCombobox = useCallback(() => setOpen(true), [setOpen]);
    const closeCombobox = useCallback(() => setOpen(false), [setOpen]);
    const toggleCombobox = useCallback(
      () => setOpen(!isOpen),
      [setOpen, isOpen]
    );

    const inputRef = useRef<TextInputRef>(null);
    const suppressReopenRef = useRef(false);

    const { register: registerValue, unregister: unregisterValue } =
      useValueRegistry('Combobox');

    // Labels are kept once seen and never removed on unmount: Combobox.Content
    // unmounts its items while closed, but selecting a value still needs its
    // label to write into the query field.
    const [labels, setLabels] = useState<Record<string, string>>({});
    const registerItemLabel = useCallback(
      (itemValue: string, label: string) => {
        setLabels((prev) =>
          prev[itemValue] === label ? prev : { ...prev, [itemValue]: label }
        );
      },
      []
    );

    const selectValue = useCallback(
      (next: string) => {
        setValue(next);
        setQuery(labels[next] ?? '');
      },
      [setValue, setQuery, labels]
    );

    useImperativeHandle(
      ref,
      () => ({
        open: openCombobox,
        close: closeCombobox,
        toggle: toggleCombobox,
        isOpen: () => isOpen,
        getValue: () => currentValue,
        setValue,
        getQuery: () => currentQuery,
        setQuery,
      }),
      [
        openCombobox,
        closeCombobox,
        toggleCombobox,
        isOpen,
        currentValue,
        setValue,
        currentQuery,
        setQuery,
      ]
    );

    const contextValue = useMemo(
      () => ({
        open: isOpen,
        disabled,
        value: currentValue,
        query: currentQuery,
        inputRef,
        suppressReopenRef,
        openCombobox,
        closeCombobox,
        toggleCombobox,
        setQuery,
        selectValue,
        registerValue,
        unregisterValue,
        registerItemLabel,
      }),
      [
        isOpen,
        disabled,
        currentValue,
        currentQuery,
        openCombobox,
        closeCombobox,
        toggleCombobox,
        setQuery,
        selectValue,
        registerValue,
        unregisterValue,
        registerItemLabel,
      ]
    );

    return (
      <ComboboxContext.Provider value={contextValue}>
        {children}
      </ComboboxContext.Provider>
    );
  }
);
Root.displayName = 'Combobox.Root';

export interface ComboboxInputProps extends Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'editable'
> {}

function Input({ onFocus, ...textInputProps }: ComboboxInputProps) {
  const {
    open,
    disabled,
    query,
    inputRef,
    suppressReopenRef,
    setQuery,
    openCombobox,
  } = useComboboxContext('Input');

  const handleFocus = useCallback<NonNullable<TextInputProps['onFocus']>>(
    (event) => {
      if (suppressReopenRef.current) {
        suppressReopenRef.current = false;
      } else if (!disabled) {
        openCombobox();
      }
      onFocus?.(event);
    },
    [disabled, openCombobox, onFocus, suppressReopenRef]
  );

  return (
    <TextInput
      ref={inputRef}
      value={query}
      onChangeText={setQuery}
      onFocus={handleFocus}
      editable={!disabled}
      accessibilityRole="combobox"
      accessibilityState={{ expanded: open, disabled }}
      {...textInputProps}
    />
  );
}
Input.displayName = 'Combobox.Input';

export type ComboboxContentRenderProps = {
  /** The side the content actually ended up on (may differ from the requested `side` if it got flipped). */
  side: FloatingSide;
};

export interface ComboboxContentProps extends Omit<ViewProps, 'children'> {
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
    React.ReactNode | ((state: ComboboxContentRenderProps) => React.ReactNode);
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
}: ComboboxContentProps) {
  const { open, inputRef, closeCombobox } = useComboboxContext('Content');
  const windowSize = useWindowDimensions();

  const [anchorRect, setAnchorRect] = useState<Rect | null>(null);
  const [contentSize, setContentSize] = useState<Size | null>(null);

  useEffect(() => {
    if (!open) {
      setAnchorRect(null);
      setContentSize(null);
      return;
    }

    const node = inputRef.current;
    if (node && typeof node.measureInWindow === 'function') {
      node.measureInWindow((x, y, width, height) => {
        setAnchorRect({ x, y, width, height });
      });
    } else {
      setAnchorRect({ x: 0, y: 0, width: 0, height: 0 });
    }
  }, [open, inputRef]);

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
      onRequestClose={closeCombobox}
    >
      <Pressable
        testID="anvil-combobox-backdrop"
        style={StyleSheet.absoluteFill}
        onPress={closeOnOutsidePress ? closeCombobox : undefined}
        accessibilityRole={closeOnOutsidePress ? 'button' : undefined}
        accessibilityLabel={closeOnOutsidePress ? 'Close combobox' : undefined}
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
Content.displayName = 'Combobox.Content';

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

export type ComboboxItemRenderProps = {
  selected: boolean;
  disabled: boolean;
};

export interface ComboboxItemProps extends Omit<
  PressableProps,
  'children' | 'onPress' | 'disabled'
> {
  value: string;
  disabled?: boolean;
  /** Close the combobox after this item is pressed. Defaults to true. */
  closeOnSelect?: boolean;
  children:
    React.ReactNode | ((state: ComboboxItemRenderProps) => React.ReactNode);
}

function Item({
  value,
  disabled: itemDisabled = false,
  closeOnSelect = true,
  children,
  ...pressableProps
}: ComboboxItemProps) {
  const {
    value: selectedValue,
    disabled: groupDisabled,
    selectValue,
    closeCombobox,
    suppressReopenRef,
    registerValue,
    unregisterValue,
  } = useComboboxContext('Item');
  const selected = selectedValue === value;
  const disabled = itemDisabled || groupDisabled;

  useRegisteredValue(registerValue, unregisterValue, value);

  const handlePress = useCallback(() => {
    if (disabled) return;
    selectValue(value);
    if (closeOnSelect) {
      // Closing the Modal returns focus to Input, which would otherwise
      // immediately reopen it -- see suppressReopenRef's own comment.
      suppressReopenRef.current = true;
      closeCombobox();
    }
  }, [
    disabled,
    selectValue,
    value,
    closeOnSelect,
    closeCombobox,
    suppressReopenRef,
  ]);

  const itemContextValue = useMemo(
    () => ({ value, selected, disabled }),
    [value, selected, disabled]
  );

  return (
    <ComboboxItemContext.Provider value={itemContextValue}>
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
    </ComboboxItemContext.Provider>
  );
}
Item.displayName = 'Combobox.Item';

export type ComboboxItemTextProps = TextProps;

function ItemText({ children, ...textProps }: ComboboxItemTextProps) {
  const { registerItemLabel } = useComboboxContext('ItemText');
  const { value } = useComboboxItemContext('ItemText');
  const label = typeof children === 'string' ? children : undefined;

  useWarnOnceWhen(
    label === undefined,
    () =>
      `Combobox.ItemText: expected a plain string child so selecting this item can fill the ` +
      `query field with it, but got ${typeof children}. Pass the option's label as a plain string.`
  );

  useEffect(() => {
    if (label === undefined) return;
    registerItemLabel(value, label);
    // Deliberately no cleanup: Combobox.Content unmounts items while closed,
    // but a value selected earlier must still resolve to its label later.
  }, [value, label, registerItemLabel]);

  return <Text {...textProps}>{children}</Text>;
}
ItemText.displayName = 'Combobox.ItemText';

export const Combobox = {
  Root,
  Input,
  Content,
  Item,
  ItemText,
};
