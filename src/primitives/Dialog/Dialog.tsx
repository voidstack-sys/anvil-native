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

interface DialogContextValue {
  open: boolean;
  disabled: boolean;
  titleId: string | undefined;
  descriptionId: string | undefined;
  setTitleId: (id: string | undefined) => void;
  setDescriptionId: (id: string | undefined) => void;
  openDialog: () => void;
  closeDialog: () => void;
  toggleDialog: () => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext(component: string): DialogContextValue {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error(`Dialog.${component} must be used within a Dialog.Root`);
  }
  return context;
}

export interface DialogRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Disables the trigger, regardless of its own `disabled` prop. */
  disabled?: boolean;
  children: React.ReactNode;
}

export interface DialogHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
}

const Root = forwardRef<DialogHandle, DialogRootProps>(function DialogRoot(
  { open, defaultOpen = false, onOpenChange, disabled = false, children },
  ref
) {
  const isControlled = open !== undefined;
  const initialIsControlled = useRef(isControlled).current;

  useWarnOnceWhen(isControlled !== initialIsControlled, () =>
    controlledChangeMessage(
      'Dialog.Root',
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

  const openDialog = useCallback(() => setOpen(true), [setOpen]);
  const closeDialog = useCallback(() => setOpen(false), [setOpen]);
  const toggleDialog = useCallback(() => setOpen(!isOpen), [setOpen, isOpen]);

  const [titleId, setTitleId] = useState<string | undefined>(undefined);
  const [descriptionId, setDescriptionId] = useState<string | undefined>(
    undefined
  );

  useImperativeHandle(
    ref,
    () => ({
      open: openDialog,
      close: closeDialog,
      toggle: toggleDialog,
      isOpen: () => isOpen,
    }),
    [openDialog, closeDialog, toggleDialog, isOpen]
  );

  const contextValue = useMemo(
    () => ({
      open: isOpen,
      disabled,
      titleId,
      descriptionId,
      setTitleId,
      setDescriptionId,
      openDialog,
      closeDialog,
      toggleDialog,
    }),
    [
      isOpen,
      disabled,
      titleId,
      descriptionId,
      openDialog,
      closeDialog,
      toggleDialog,
    ]
  );

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
    </DialogContext.Provider>
  );
});
Root.displayName = 'Dialog.Root';

export type DialogTriggerRenderProps = {
  open: boolean;
  disabled: boolean;
};

export interface DialogTriggerProps extends Omit<
  PressableProps,
  'children' | 'onPress' | 'disabled'
> {
  disabled?: boolean;
  children:
    React.ReactNode | ((state: DialogTriggerRenderProps) => React.ReactNode);
}

function Trigger({
  disabled: triggerDisabled = false,
  children,
  ...pressableProps
}: DialogTriggerProps) {
  const {
    open,
    disabled: groupDisabled,
    openDialog,
  } = useDialogContext('Trigger');
  const disabled = triggerDisabled || groupDisabled;

  const handlePress = useCallback(() => {
    if (disabled) return;
    openDialog();
  }, [disabled, openDialog]);

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
Trigger.displayName = 'Dialog.Trigger';

export interface DialogContentProps extends Omit<
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
}: DialogContentProps) {
  const { open, titleId, descriptionId, closeDialog } =
    useDialogContext('Content');

  if (!open && !forceMount) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={open}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={closeDialog}
      {...modalProps}
    >
      <View
        testID="anvil-dialog-content"
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
Content.displayName = 'Dialog.Content';

const StyleFillAbsolute = { flex: 1 };

export interface DialogOverlayProps extends Omit<PressableProps, 'onPress'> {
  /** Close when the overlay (outside the dialog panel) is pressed. Defaults to true. */
  closeOnPress?: boolean;
}

function Overlay({
  closeOnPress = true,
  style,
  ...pressableProps
}: DialogOverlayProps) {
  const { closeDialog } = useDialogContext('Overlay');

  return (
    <Pressable
      onPress={closeOnPress ? closeDialog : undefined}
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
Overlay.displayName = 'Dialog.Overlay';

const StyleAbsoluteFill = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

export type DialogTitleProps = TextProps;

function Title({ children, ...textProps }: DialogTitleProps) {
  const { setTitleId } = useDialogContext('Title');
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
Title.displayName = 'Dialog.Title';

export type DialogDescriptionProps = TextProps;

function Description({ children, ...textProps }: DialogDescriptionProps) {
  const { setDescriptionId } = useDialogContext('Description');
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
Description.displayName = 'Dialog.Description';

export type DialogCloseProps = PressableProps;

function Close({ onPress, ...pressableProps }: DialogCloseProps) {
  const { closeDialog } = useDialogContext('Close');

  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      closeDialog();
      onPress?.(event);
    },
    [closeDialog, onPress]
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      {...pressableProps}
    />
  );
}
Close.displayName = 'Dialog.Close';

export const Dialog = {
  Root,
  Trigger,
  Content,
  Overlay,
  Title,
  Description,
  Close,
};
