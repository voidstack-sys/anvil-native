import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Modal,
  Pressable,
  Text,
  View,
  type ModalProps,
  type PressableProps,
  type TextProps,
} from 'react-native';
import {
  controlledChangeMessage,
  useWarnOnceWhen,
} from '../../internal/devWarnings';

interface ActionSheetContextValue {
  open: boolean;
  disabled: boolean;
  titleId: string | undefined;
  descriptionId: string | undefined;
  setTitleId: (id: string | undefined) => void;
  setDescriptionId: (id: string | undefined) => void;
  openSheet: () => void;
  closeSheet: () => void;
  toggleSheet: () => void;
}

const ActionSheetContext = createContext<ActionSheetContextValue | null>(null);

function useActionSheetContext(component: string): ActionSheetContextValue {
  const context = useContext(ActionSheetContext);
  if (!context) {
    throw new Error(
      `ActionSheet.${component} must be used within an ActionSheet.Root`
    );
  }
  return context;
}

export interface ActionSheetRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Disables the trigger, regardless of its own `disabled` prop. */
  disabled?: boolean;
  children: React.ReactNode;
}

export interface ActionSheetHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
}

const Root = forwardRef<ActionSheetHandle, ActionSheetRootProps>(
  function ActionSheetRoot(
    { open, defaultOpen = false, onOpenChange, disabled = false, children },
    ref
  ) {
    const isControlled = open !== undefined;
    const initialIsControlled = useRef(isControlled).current;

    useWarnOnceWhen(isControlled !== initialIsControlled, () =>
      controlledChangeMessage(
        'ActionSheet.Root',
        initialIsControlled,
        isControlled,
        'open'
      )
    );

    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const isOpen = isControlled ? (open ?? false) : uncontrolledOpen;

    const setOpen = useCallback(
      (next: boolean) => {
        if (!isControlled) {
          setUncontrolledOpen(next);
        }
        onOpenChange?.(next);
      },
      [isControlled, onOpenChange]
    );

    const openSheet = useCallback(() => setOpen(true), [setOpen]);
    const closeSheet = useCallback(() => setOpen(false), [setOpen]);
    const toggleSheet = useCallback(() => setOpen(!isOpen), [setOpen, isOpen]);

    const [titleId, setTitleId] = useState<string | undefined>(undefined);
    const [descriptionId, setDescriptionId] = useState<string | undefined>(
      undefined
    );

    useImperativeHandle(
      ref,
      () => ({
        open: openSheet,
        close: closeSheet,
        toggle: toggleSheet,
        isOpen: () => isOpen,
      }),
      [openSheet, closeSheet, toggleSheet, isOpen]
    );

    const contextValue = useMemo(
      () => ({
        open: isOpen,
        disabled,
        titleId,
        descriptionId,
        setTitleId,
        setDescriptionId,
        openSheet,
        closeSheet,
        toggleSheet,
      }),
      [
        isOpen,
        disabled,
        titleId,
        descriptionId,
        openSheet,
        closeSheet,
        toggleSheet,
      ]
    );

    return (
      <ActionSheetContext.Provider value={contextValue}>
        {children}
      </ActionSheetContext.Provider>
    );
  }
);
Root.displayName = 'ActionSheet.Root';

export type ActionSheetTriggerRenderProps = {
  open: boolean;
  disabled: boolean;
};

export interface ActionSheetTriggerProps extends Omit<
  PressableProps,
  'children' | 'onPress' | 'disabled'
> {
  disabled?: boolean;
  children:
    | React.ReactNode
    | ((state: ActionSheetTriggerRenderProps) => React.ReactNode);
}

function Trigger({
  disabled: triggerDisabled = false,
  children,
  ...pressableProps
}: ActionSheetTriggerProps) {
  const {
    open,
    disabled: groupDisabled,
    openSheet,
  } = useActionSheetContext('Trigger');
  const disabled = triggerDisabled || groupDisabled;

  const handlePress = useCallback(() => {
    if (disabled) return;
    openSheet();
  }, [disabled, openSheet]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open, disabled }}
      disabled={disabled}
      onPress={handlePress}
      {...pressableProps}
    >
      {typeof children === 'function' ? children({ open, disabled }) : children}
    </Pressable>
  );
}
Trigger.displayName = 'ActionSheet.Trigger';

export interface ActionSheetContentProps extends Omit<
  ModalProps,
  'visible' | 'transparent' | 'onRequestClose'
> {
  /** Keep the Modal mounted (but not visible) even when closed. */
  forceMount?: boolean;
  children: React.ReactNode;
}

function Content({
  forceMount = false,
  children,
  ...modalProps
}: ActionSheetContentProps) {
  const { open, titleId, descriptionId, closeSheet } =
    useActionSheetContext('Content');

  if (!open && !forceMount) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={open}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={closeSheet}
      {...modalProps}
    >
      <View
        testID="anvil-action-sheet-content"
        accessibilityViewIsModal
        accessibilityRole="menu"
        accessibilityLabelledBy={titleId}
        aria-describedby={descriptionId}
        style={styles.contentWrapper}
      >
        {children}
      </View>
    </Modal>
  );
}
Content.displayName = 'ActionSheet.Content';

export interface ActionSheetOverlayProps extends Omit<
  PressableProps,
  'onPress'
> {
  /** Close when the overlay (outside the sheet) is pressed. Defaults to true. */
  closeOnPress?: boolean;
}

function Overlay({
  closeOnPress = true,
  style,
  ...pressableProps
}: ActionSheetOverlayProps) {
  const { closeSheet } = useActionSheetContext('Overlay');

  return (
    <Pressable
      onPress={closeOnPress ? closeSheet : undefined}
      accessibilityRole={closeOnPress ? 'button' : undefined}
      accessibilityLabel={closeOnPress ? 'Close menu' : undefined}
      accessibilityElementsHidden={!closeOnPress}
      importantForAccessibility={closeOnPress ? 'auto' : 'no-hide-descendants'}
      style={(state) => [
        styles.overlay,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...pressableProps}
    />
  );
}
Overlay.displayName = 'ActionSheet.Overlay';

export type ActionSheetTitleProps = TextProps;

function Title({ children, ...textProps }: ActionSheetTitleProps) {
  const { setTitleId } = useActionSheetContext('Title');
  const id = useId();

  useEffect(() => {
    setTitleId(id);
    return () => setTitleId(undefined);
  }, [id, setTitleId]);

  return (
    <Text nativeID={id} {...textProps}>
      {children}
    </Text>
  );
}
Title.displayName = 'ActionSheet.Title';

export type ActionSheetDescriptionProps = TextProps;

function Description({ children, ...textProps }: ActionSheetDescriptionProps) {
  const { setDescriptionId } = useActionSheetContext('Description');
  const id = useId();

  useEffect(() => {
    setDescriptionId(id);
    return () => setDescriptionId(undefined);
  }, [id, setDescriptionId]);

  return (
    <Text nativeID={id} {...textProps}>
      {children}
    </Text>
  );
}
Description.displayName = 'ActionSheet.Description';

export interface ActionSheetActionProps extends Omit<
  PressableProps,
  'disabled'
> {
  disabled?: boolean;
  /** Close the sheet after this action is pressed. Defaults to true. */
  closeOnPress?: boolean;
}

function Action({
  onPress,
  disabled = false,
  closeOnPress = true,
  ...pressableProps
}: ActionSheetActionProps) {
  const { closeSheet } = useActionSheetContext('Action');

  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      if (disabled) return;
      onPress?.(event);
      if (closeOnPress) closeSheet();
    },
    [disabled, onPress, closeOnPress, closeSheet]
  );

  return (
    <Pressable
      accessibilityRole="menuitem"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
      {...pressableProps}
    />
  );
}
Action.displayName = 'ActionSheet.Action';

export type ActionSheetCancelProps = PressableProps;

function Cancel({ onPress, ...pressableProps }: ActionSheetCancelProps) {
  const { closeSheet } = useActionSheetContext('Cancel');

  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      onPress?.(event);
      closeSheet();
    },
    [onPress, closeSheet]
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      {...pressableProps}
    />
  );
}
Cancel.displayName = 'ActionSheet.Cancel';

const styles = {
  contentWrapper: { flex: 1, justifyContent: 'flex-end' as const },
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
};

export const ActionSheet = {
  Root,
  Trigger,
  Content,
  Overlay,
  Title,
  Description,
  Action,
  Cancel,
};
