import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
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

interface AlertDialogContextValue {
  open: boolean;
  disabled: boolean;
  titleId: string | undefined;
  descriptionId: string | undefined;
  setTitleId: (id: string | undefined) => void;
  setDescriptionId: (id: string | undefined) => void;
  openAlertDialog: () => void;
  closeAlertDialog: () => void;
  toggleAlertDialog: () => void;
}

const AlertDialogContext = createContext<AlertDialogContextValue | null>(null);

function useAlertDialogContext(component: string): AlertDialogContextValue {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error(
      `AlertDialog.${component} must be used within an AlertDialog.Root`
    );
  }
  return context;
}

export interface AlertDialogRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Disables the trigger, regardless of its own `disabled` prop. */
  disabled?: boolean;
  children: React.ReactNode;
}

export interface AlertDialogHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
}

const Root = forwardRef<AlertDialogHandle, AlertDialogRootProps>(
  function AlertDialogRoot(
    { open, defaultOpen = false, onOpenChange, disabled = false, children },
    ref
  ) {
    const isControlled = open !== undefined;
    const initialIsControlled = useRef(isControlled).current;

    useWarnOnceWhen(isControlled !== initialIsControlled, () =>
      controlledChangeMessage(
        'AlertDialog.Root',
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

    const openAlertDialog = useCallback(() => setOpen(true), [setOpen]);
    const closeAlertDialog = useCallback(() => setOpen(false), [setOpen]);
    const toggleAlertDialog = useCallback(
      () => setOpen(!isOpen),
      [setOpen, isOpen]
    );

    const [titleId, setTitleId] = useState<string | undefined>(undefined);
    const [descriptionId, setDescriptionId] = useState<string | undefined>(
      undefined
    );

    useImperativeHandle(
      ref,
      () => ({
        open: openAlertDialog,
        close: closeAlertDialog,
        toggle: toggleAlertDialog,
        isOpen: () => isOpen,
      }),
      [openAlertDialog, closeAlertDialog, toggleAlertDialog, isOpen]
    );

    const contextValue = useMemo(
      () => ({
        open: isOpen,
        disabled,
        titleId,
        descriptionId,
        setTitleId,
        setDescriptionId,
        openAlertDialog,
        closeAlertDialog,
        toggleAlertDialog,
      }),
      [
        isOpen,
        disabled,
        titleId,
        descriptionId,
        openAlertDialog,
        closeAlertDialog,
        toggleAlertDialog,
      ]
    );

    return (
      <AlertDialogContext.Provider value={contextValue}>
        {children}
      </AlertDialogContext.Provider>
    );
  }
);
Root.displayName = 'AlertDialog.Root';

export type AlertDialogTriggerRenderProps = {
  open: boolean;
  disabled: boolean;
};

export interface AlertDialogTriggerProps extends Omit<
  PressableProps,
  'children' | 'onPress' | 'disabled'
> {
  disabled?: boolean;
  children:
    | React.ReactNode
    | ((state: AlertDialogTriggerRenderProps) => React.ReactNode);
}

function Trigger({
  disabled: triggerDisabled = false,
  children,
  ...pressableProps
}: AlertDialogTriggerProps) {
  const {
    open,
    disabled: groupDisabled,
    openAlertDialog,
  } = useAlertDialogContext('Trigger');
  const disabled = triggerDisabled || groupDisabled;

  const handlePress = useCallback(() => {
    if (disabled) return;
    openAlertDialog();
  }, [disabled, openAlertDialog]);

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
Trigger.displayName = 'AlertDialog.Trigger';

export interface AlertDialogContentProps extends Omit<
  ModalProps,
  'visible' | 'transparent' | 'onRequestClose'
> {
  /** Keep the Modal mounted (but not visible) even when closed. */
  forceMount?: boolean;
  /**
   * Close when the Android hardware back button is pressed. Defaults to
   * `false` — unlike `Dialog`, an alert dialog is meant to require an
   * explicit choice (`Action`/`Cancel`), not be dismissible by accident.
   */
  closeOnRequestClose?: boolean;
  children: React.ReactNode;
}

function Content({
  forceMount = false,
  closeOnRequestClose = false,
  children,
  ...modalProps
}: AlertDialogContentProps) {
  const { open, titleId, descriptionId, closeAlertDialog } =
    useAlertDialogContext('Content');

  if (!open && !forceMount) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={open}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={closeOnRequestClose ? closeAlertDialog : noop}
      {...modalProps}
    >
      <View
        testID="anvil-alert-dialog-content"
        accessibilityViewIsModal
        accessibilityLabelledBy={titleId}
        aria-describedby={descriptionId}
        style={StyleFillAbsolute}
      >
        {children}
      </View>
    </Modal>
  );
}
Content.displayName = 'AlertDialog.Content';

function noop() {}

const StyleFillAbsolute = { flex: 1 };

export interface AlertDialogOverlayProps extends Omit<
  PressableProps,
  'onPress'
> {
  /**
   * Close when the overlay (outside the alert panel) is pressed. Defaults to
   * `false` — unlike `Dialog.Overlay`, so a destructive confirmation can't be
   * dismissed by an accidental tap outside it.
   */
  closeOnPress?: boolean;
}

function Overlay({
  closeOnPress = false,
  style,
  ...pressableProps
}: AlertDialogOverlayProps) {
  const { closeAlertDialog } = useAlertDialogContext('Overlay');

  return (
    <Pressable
      onPress={closeOnPress ? closeAlertDialog : undefined}
      accessibilityRole={closeOnPress ? 'button' : undefined}
      accessibilityLabel={closeOnPress ? 'Close dialog' : undefined}
      accessibilityElementsHidden={!closeOnPress}
      importantForAccessibility={closeOnPress ? 'auto' : 'no-hide-descendants'}
      style={(state) => [
        StyleAbsoluteFill,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...pressableProps}
    />
  );
}
Overlay.displayName = 'AlertDialog.Overlay';

const StyleAbsoluteFill = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

export type AlertDialogTitleProps = TextProps;

function Title({ children, ...textProps }: AlertDialogTitleProps) {
  const { setTitleId } = useAlertDialogContext('Title');
  const id = useId();

  React.useEffect(() => {
    setTitleId(id);
    return () => setTitleId(undefined);
  }, [id, setTitleId]);

  return (
    <Text nativeID={id} {...textProps}>
      {children}
    </Text>
  );
}
Title.displayName = 'AlertDialog.Title';

export type AlertDialogDescriptionProps = TextProps;

function Description({ children, ...textProps }: AlertDialogDescriptionProps) {
  const { setDescriptionId } = useAlertDialogContext('Description');
  const id = useId();

  React.useEffect(() => {
    setDescriptionId(id);
    return () => setDescriptionId(undefined);
  }, [id, setDescriptionId]);

  return (
    <Text nativeID={id} {...textProps}>
      {children}
    </Text>
  );
}
Description.displayName = 'AlertDialog.Description';

export interface AlertDialogCancelProps extends PressableProps {
  /** Close the alert dialog after this is pressed. Defaults to true. */
  closeOnPress?: boolean;
}

function Cancel({
  closeOnPress = true,
  onPress,
  ...pressableProps
}: AlertDialogCancelProps) {
  const { closeAlertDialog } = useAlertDialogContext('Cancel');

  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      if (closeOnPress) closeAlertDialog();
      onPress?.(event);
    },
    [closeOnPress, closeAlertDialog, onPress]
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      {...pressableProps}
    />
  );
}
Cancel.displayName = 'AlertDialog.Cancel';

export interface AlertDialogActionProps extends PressableProps {
  /**
   * Close the alert dialog after this is pressed. Defaults to true — set to
   * `false` for actions that do async work (e.g. an API call) and should
   * keep the dialog open (perhaps with a loading state) until it resolves,
   * closing it yourself via an imperative `AlertDialogHandle.close()`.
   */
  closeOnPress?: boolean;
}

function Action({
  closeOnPress = true,
  onPress,
  ...pressableProps
}: AlertDialogActionProps) {
  const { closeAlertDialog } = useAlertDialogContext('Action');

  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      if (closeOnPress) closeAlertDialog();
      onPress?.(event);
    },
    [closeOnPress, closeAlertDialog, onPress]
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      {...pressableProps}
    />
  );
}
Action.displayName = 'AlertDialog.Action';

export const AlertDialog = {
  Root,
  Trigger,
  Content,
  Overlay,
  Title,
  Description,
  Cancel,
  Action,
};
