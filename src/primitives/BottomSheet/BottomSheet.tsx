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
  PanResponder,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
  type ModalProps,
  type PanResponderGestureState,
  type PressableProps,
  type TextProps,
  type ViewProps,
} from 'react-native';
import {
  controlledChangeMessage,
  useWarnOnceWhen,
} from '../../internal/devWarnings';

interface BottomSheetContextValue {
  open: boolean;
  disabled: boolean;
  dragOffset: number;
  dismissThreshold: number;
  titleId: string | undefined;
  descriptionId: string | undefined;
  setTitleId: (id: string | undefined) => void;
  setDescriptionId: (id: string | undefined) => void;
  setDragOffset: (offset: number) => void;
  openSheet: () => void;
  closeSheet: () => void;
  toggleSheet: () => void;
}

const BottomSheetContext = createContext<BottomSheetContextValue | null>(null);

function useBottomSheetContext(component: string): BottomSheetContextValue {
  const context = useContext(BottomSheetContext);
  if (!context) {
    throw new Error(
      `BottomSheet.${component} must be used within a BottomSheet.Root`
    );
  }
  return context;
}

export interface BottomSheetRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Disables the trigger, regardless of its own `disabled` prop. */
  disabled?: boolean;
  /**
   * Downward drag distance (px), past which releasing `BottomSheet.Handle`
   * dismisses the sheet instead of snapping back open. A fast enough
   * downward flick dismisses regardless of distance. Defaults to 120.
   */
  dismissThreshold?: number;
  children: React.ReactNode;
}

export interface BottomSheetHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
}

const Root = forwardRef<BottomSheetHandle, BottomSheetRootProps>(
  function BottomSheetRoot(
    {
      open,
      defaultOpen = false,
      onOpenChange,
      disabled = false,
      dismissThreshold = 120,
      children,
    },
    ref
  ) {
    const isControlled = open !== undefined;
    const initialIsControlled = useRef(isControlled).current;

    useWarnOnceWhen(isControlled !== initialIsControlled, () =>
      controlledChangeMessage(
        'BottomSheet.Root',
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

    const [dragOffset, setDragOffset] = useState(0);

    // A fresh open should never inherit the previous close's drag offset.
    useEffect(() => {
      if (!isOpen) setDragOffset(0);
    }, [isOpen]);

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
        dragOffset,
        dismissThreshold,
        titleId,
        descriptionId,
        setTitleId,
        setDescriptionId,
        setDragOffset,
        openSheet,
        closeSheet,
        toggleSheet,
      }),
      [
        isOpen,
        disabled,
        dragOffset,
        dismissThreshold,
        titleId,
        descriptionId,
        openSheet,
        closeSheet,
        toggleSheet,
      ]
    );

    return (
      <BottomSheetContext.Provider value={contextValue}>
        {children}
      </BottomSheetContext.Provider>
    );
  }
);
Root.displayName = 'BottomSheet.Root';

export type BottomSheetTriggerRenderProps = {
  open: boolean;
  disabled: boolean;
};

export interface BottomSheetTriggerProps extends Omit<
  PressableProps,
  'children' | 'onPress' | 'disabled'
> {
  disabled?: boolean;
  children:
    | React.ReactNode
    | ((state: BottomSheetTriggerRenderProps) => React.ReactNode);
}

function Trigger({
  disabled: triggerDisabled = false,
  children,
  ...pressableProps
}: BottomSheetTriggerProps) {
  const {
    open,
    disabled: groupDisabled,
    openSheet,
  } = useBottomSheetContext('Trigger');
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
Trigger.displayName = 'BottomSheet.Trigger';

export interface BottomSheetContentProps extends Omit<
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
}: BottomSheetContentProps) {
  const { open, titleId, descriptionId, closeSheet } =
    useBottomSheetContext('Content');

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
        testID="anvil-bottom-sheet-content"
        accessibilityViewIsModal
        accessibilityLabelledBy={titleId}
        aria-describedby={descriptionId}
        style={styles.contentWrapper}
      >
        {children}
      </View>
    </Modal>
  );
}
Content.displayName = 'BottomSheet.Content';

export interface BottomSheetOverlayProps extends Omit<
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
}: BottomSheetOverlayProps) {
  const { closeSheet } = useBottomSheetContext('Overlay');

  return (
    <Pressable
      onPress={closeOnPress ? closeSheet : undefined}
      accessibilityRole={closeOnPress ? 'button' : undefined}
      accessibilityLabel={closeOnPress ? 'Close sheet' : undefined}
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
Overlay.displayName = 'BottomSheet.Overlay';

export type BottomSheetPanelRenderProps = {
  /** How far (px) the panel is currently dragged down. 0 at rest. */
  dragOffset: number;
};

export interface BottomSheetPanelProps extends Omit<ViewProps, 'children'> {
  children:
    React.ReactNode | ((state: BottomSheetPanelRenderProps) => React.ReactNode);
}

function Panel({ style, children, ...viewProps }: BottomSheetPanelProps) {
  const { dragOffset } = useBottomSheetContext('Panel');

  return (
    <View
      style={[{ transform: [{ translateY: dragOffset }] }, style]}
      {...viewProps}
    >
      {typeof children === 'function' ? children({ dragOffset }) : children}
    </View>
  );
}
Panel.displayName = 'BottomSheet.Panel';

export type BottomSheetHandleProps = ViewProps;

function Handle({ style, ...viewProps }: BottomSheetHandleProps) {
  const context = useBottomSheetContext('Handle');

  // Keeps the PanResponder's handlers (created once) reading fresh
  // disabled/dismissThreshold/closeSheet without recreating them every
  // render -- same technique Slider.Thumb uses.
  const latestRef = useRef(context);
  latestRef.current = context;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !latestRef.current.disabled,
      onMoveShouldSetPanResponder: (
        _event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => !latestRef.current.disabled && Math.abs(gestureState.dy) > 2,
      // Once the drag starts, don't let anything else (a parent ScrollView,
      // another gesture) steal the responder mid-gesture -- it would strand
      // the sheet at whatever offset it had reached, with no pointer-up ever
      // arriving to resolve open vs. dismiss.
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (
        _event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        latestRef.current.setDragOffset(Math.max(0, gestureState.dy));
      },
      onPanResponderRelease: (
        _event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        const shouldDismiss =
          gestureState.dy > latestRef.current.dismissThreshold ||
          gestureState.vy > 1.5;
        if (shouldDismiss) {
          latestRef.current.closeSheet();
        } else {
          latestRef.current.setDragOffset(0);
        }
      },
      onPanResponderTerminate: () => {
        latestRef.current.setDragOffset(0);
      },
    })
  ).current;

  return <View {...panResponder.panHandlers} style={style} {...viewProps} />;
}
Handle.displayName = 'BottomSheet.Handle';

export type BottomSheetTitleProps = TextProps;

function Title({ children, ...textProps }: BottomSheetTitleProps) {
  const { setTitleId } = useBottomSheetContext('Title');
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
Title.displayName = 'BottomSheet.Title';

export type BottomSheetDescriptionProps = TextProps;

function Description({ children, ...textProps }: BottomSheetDescriptionProps) {
  const { setDescriptionId } = useBottomSheetContext('Description');
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
Description.displayName = 'BottomSheet.Description';

export type BottomSheetCloseProps = PressableProps;

function Close({ onPress, ...pressableProps }: BottomSheetCloseProps) {
  const { closeSheet } = useBottomSheetContext('Close');

  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      closeSheet();
      onPress?.(event);
    },
    [closeSheet, onPress]
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      {...pressableProps}
    />
  );
}
Close.displayName = 'BottomSheet.Close';

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

export const BottomSheet = {
  Root,
  Trigger,
  Content,
  Overlay,
  Panel,
  Handle,
  Title,
  Description,
  Close,
};
