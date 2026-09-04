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
  typeChangeMessage,
  useWarnOnceWhen,
} from '../../internal/devWarnings';

export type DrawerSide = 'left' | 'right';

interface DrawerContextValue {
  open: boolean;
  disabled: boolean;
  side: DrawerSide;
  /** How far (px), in the closing direction, the panel is currently dragged. Always >= 0. */
  dragOffset: number;
  dismissThreshold: number;
  titleId: string | undefined;
  descriptionId: string | undefined;
  setTitleId: (id: string | undefined) => void;
  setDescriptionId: (id: string | undefined) => void;
  setDragOffset: (offset: number) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

function useDrawerContext(component: string): DrawerContextValue {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error(`Drawer.${component} must be used within a Drawer.Root`);
  }
  return context;
}

export interface DrawerRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Disables the trigger, regardless of its own `disabled` prop. */
  disabled?: boolean;
  /** Which screen edge the panel slides in from. Defaults to `'left'`. */
  side?: DrawerSide;
  /**
   * Drag distance (px), in the closing direction, past which releasing
   * `Drawer.Handle` dismisses the drawer instead of snapping back open. A
   * fast enough flick in that direction dismisses regardless of distance.
   * Defaults to 100.
   */
  dismissThreshold?: number;
  children: React.ReactNode;
}

export interface DrawerHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
}

const Root = forwardRef<DrawerHandle, DrawerRootProps>(function DrawerRoot(
  {
    open,
    defaultOpen = false,
    onOpenChange,
    disabled = false,
    side = 'left',
    dismissThreshold = 100,
    children,
  },
  ref
) {
  const isControlled = open !== undefined;
  const initialIsControlled = useRef(isControlled).current;
  const initialSide = useRef(side).current;

  useWarnOnceWhen(isControlled !== initialIsControlled, () =>
    controlledChangeMessage(
      'Drawer.Root',
      initialIsControlled,
      isControlled,
      'open'
    )
  );
  useWarnOnceWhen(side !== initialSide, () =>
    typeChangeMessage('Drawer.Root', initialSide, side, 'side')
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

  const openDrawer = useCallback(() => setOpen(true), [setOpen]);
  const closeDrawer = useCallback(() => setOpen(false), [setOpen]);
  const toggleDrawer = useCallback(() => setOpen(!isOpen), [setOpen, isOpen]);

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
      open: openDrawer,
      close: closeDrawer,
      toggle: toggleDrawer,
      isOpen: () => isOpen,
    }),
    [openDrawer, closeDrawer, toggleDrawer, isOpen]
  );

  const contextValue = useMemo(
    () => ({
      open: isOpen,
      disabled,
      side,
      dragOffset,
      dismissThreshold,
      titleId,
      descriptionId,
      setTitleId,
      setDescriptionId,
      setDragOffset,
      openDrawer,
      closeDrawer,
      toggleDrawer,
    }),
    [
      isOpen,
      disabled,
      side,
      dragOffset,
      dismissThreshold,
      titleId,
      descriptionId,
      openDrawer,
      closeDrawer,
      toggleDrawer,
    ]
  );

  return (
    <DrawerContext.Provider value={contextValue}>
      {children}
    </DrawerContext.Provider>
  );
});
Root.displayName = 'Drawer.Root';

export type DrawerTriggerRenderProps = {
  open: boolean;
  disabled: boolean;
};

export interface DrawerTriggerProps extends Omit<
  PressableProps,
  'children' | 'onPress' | 'disabled'
> {
  disabled?: boolean;
  children:
    React.ReactNode | ((state: DrawerTriggerRenderProps) => React.ReactNode);
}

function Trigger({
  disabled: triggerDisabled = false,
  children,
  ...pressableProps
}: DrawerTriggerProps) {
  const {
    open,
    disabled: groupDisabled,
    openDrawer,
  } = useDrawerContext('Trigger');
  const disabled = triggerDisabled || groupDisabled;

  const handlePress = useCallback(() => {
    if (disabled) return;
    openDrawer();
  }, [disabled, openDrawer]);

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
Trigger.displayName = 'Drawer.Trigger';

export interface DrawerContentProps extends Omit<
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
}: DrawerContentProps) {
  const { open, side, titleId, descriptionId, closeDrawer } =
    useDrawerContext('Content');

  if (!open && !forceMount) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={open}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={closeDrawer}
      {...modalProps}
    >
      <View
        testID="anvil-drawer-content"
        accessibilityViewIsModal
        accessibilityLabelledBy={titleId}
        aria-describedby={descriptionId}
        style={
          side === 'left'
            ? styles.contentWrapperLeft
            : styles.contentWrapperRight
        }
      >
        {children}
      </View>
    </Modal>
  );
}
Content.displayName = 'Drawer.Content';

export interface DrawerOverlayProps extends Omit<PressableProps, 'onPress'> {
  /** Close when the overlay (outside the panel) is pressed. Defaults to true. */
  closeOnPress?: boolean;
}

function Overlay({
  closeOnPress = true,
  style,
  ...pressableProps
}: DrawerOverlayProps) {
  const { closeDrawer } = useDrawerContext('Overlay');

  return (
    <Pressable
      onPress={closeOnPress ? closeDrawer : undefined}
      accessibilityRole={closeOnPress ? 'button' : undefined}
      accessibilityLabel={closeOnPress ? 'Close drawer' : undefined}
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
Overlay.displayName = 'Drawer.Overlay';

export type DrawerPanelRenderProps = {
  /** How far (px) the panel is currently dragged toward its closing edge. 0 at rest. */
  dragOffset: number;
};

export interface DrawerPanelProps extends Omit<ViewProps, 'children'> {
  children:
    React.ReactNode | ((state: DrawerPanelRenderProps) => React.ReactNode);
}

function Panel({ style, children, ...viewProps }: DrawerPanelProps) {
  const { side, dragOffset } = useDrawerContext('Panel');
  // A left drawer dismisses by dragging left (negative translateX); a right
  // drawer dismisses by dragging right (positive translateX). `dragOffset`
  // itself is always tracked as a non-negative magnitude (see Handle).
  // `|| 0` avoids `-0` at rest (`-dragOffset` when `dragOffset` is `0`),
  // which would otherwise leak into the style and fail strict equality
  // checks (`Object.is(-0, 0)` is `false`).
  const translateX = side === 'left' ? -dragOffset || 0 : dragOffset;

  return (
    <View style={[{ transform: [{ translateX }] }, style]} {...viewProps}>
      {typeof children === 'function' ? children({ dragOffset }) : children}
    </View>
  );
}
Panel.displayName = 'Drawer.Panel';

export type DrawerHandleProps = ViewProps;

function Handle({ style, ...viewProps }: DrawerHandleProps) {
  const context = useDrawerContext('Handle');

  // Keeps the PanResponder's handlers (created once) reading fresh
  // side/disabled/dismissThreshold/closeDrawer without recreating them every
  // render -- same technique BottomSheet.Handle and Slider.Thumb use.
  const latestRef = useRef(context);
  latestRef.current = context;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !latestRef.current.disabled,
      onMoveShouldSetPanResponder: (
        _event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => !latestRef.current.disabled && Math.abs(gestureState.dx) > 2,
      // Once the drag starts, don't let anything else (a parent ScrollView,
      // another gesture) steal the responder mid-gesture.
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (
        _event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        const { side } = latestRef.current;
        // Only the dx component that moves toward the closing edge counts;
        // dragging the other way (deeper into the screen) has no effect.
        const closingDx = side === 'left' ? -gestureState.dx : gestureState.dx;
        latestRef.current.setDragOffset(Math.max(0, closingDx));
      },
      onPanResponderRelease: (
        _event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        const { side, dismissThreshold } = latestRef.current;
        const closingDx = side === 'left' ? -gestureState.dx : gestureState.dx;
        const closingVx = side === 'left' ? -gestureState.vx : gestureState.vx;
        const shouldDismiss = closingDx > dismissThreshold || closingVx > 1.5;
        if (shouldDismiss) {
          latestRef.current.closeDrawer();
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
Handle.displayName = 'Drawer.Handle';

export type DrawerTitleProps = TextProps;

function Title({ children, ...textProps }: DrawerTitleProps) {
  const { setTitleId } = useDrawerContext('Title');
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
Title.displayName = 'Drawer.Title';

export type DrawerDescriptionProps = TextProps;

function Description({ children, ...textProps }: DrawerDescriptionProps) {
  const { setDescriptionId } = useDrawerContext('Description');
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
Description.displayName = 'Drawer.Description';

export type DrawerCloseProps = PressableProps;

function Close({ onPress, ...pressableProps }: DrawerCloseProps) {
  const { closeDrawer } = useDrawerContext('Close');

  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      closeDrawer();
      onPress?.(event);
    },
    [closeDrawer, onPress]
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      {...pressableProps}
    />
  );
}
Close.displayName = 'Drawer.Close';

const styles = {
  contentWrapperLeft: {
    flex: 1,
    flexDirection: 'row' as const,
    justifyContent: 'flex-start' as const,
  },
  contentWrapperRight: {
    flex: 1,
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
  },
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
};

export const Drawer = {
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
