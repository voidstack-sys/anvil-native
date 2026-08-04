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
  View,
  useWindowDimensions,
  type PressableProps,
  type ViewProps,
} from 'react-native';
import {
  controlledChangeMessage,
  useWarnOnceWhen,
} from '../../internal/devWarnings';
import {
  computePosition,
  type PopoverAlign,
  type PopoverSide,
  type Rect,
  type Size,
} from './positioning';

type ViewRef = React.ComponentRef<typeof View>;

interface PopoverContextValue {
  open: boolean;
  disabled: boolean;
  triggerRef: React.RefObject<ViewRef | null>;
  anchorRef: React.RefObject<ViewRef | null>;
  openPopover: () => void;
  closePopover: () => void;
  togglePopover: () => void;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext(component: string): PopoverContextValue {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error(`Popover.${component} must be used within a Popover.Root`);
  }
  return context;
}

export interface PopoverRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Disables the trigger, regardless of its own `disabled` prop. */
  disabled?: boolean;
  children: React.ReactNode;
}

export interface PopoverHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
}

const Root = forwardRef<PopoverHandle, PopoverRootProps>(function PopoverRoot(
  { open, defaultOpen = false, onOpenChange, disabled = false, children },
  ref
) {
  const isControlled = open !== undefined;
  const initialIsControlled = useRef(isControlled).current;

  useWarnOnceWhen(isControlled !== initialIsControlled, () =>
    controlledChangeMessage(
      'Popover.Root',
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

  const openPopover = useCallback(() => setOpen(true), [setOpen]);
  const closePopover = useCallback(() => setOpen(false), [setOpen]);
  const togglePopover = useCallback(() => setOpen(!isOpen), [setOpen, isOpen]);

  const triggerRef = useRef<ViewRef>(null);
  const anchorRef = useRef<ViewRef>(null);

  useImperativeHandle(
    ref,
    () => ({
      open: openPopover,
      close: closePopover,
      toggle: togglePopover,
      isOpen: () => isOpen,
    }),
    [openPopover, closePopover, togglePopover, isOpen]
  );

  const contextValue = useMemo(
    () => ({
      open: isOpen,
      disabled,
      triggerRef,
      anchorRef,
      openPopover,
      closePopover,
      togglePopover,
    }),
    [isOpen, disabled, openPopover, closePopover, togglePopover]
  );

  return (
    <PopoverContext.Provider value={contextValue}>
      {children}
    </PopoverContext.Provider>
  );
});
Root.displayName = 'Popover.Root';

/**
 * Optional: anchors the floating Content to a different element than
 * `Popover.Trigger` (which still handles opening/closing). Use one or the
 * other as the positioning reference, not both.
 */
export type PopoverAnchorProps = ViewProps;

function Anchor({ children, ...viewProps }: PopoverAnchorProps) {
  const { anchorRef } = usePopoverContext('Anchor');
  return (
    <View ref={anchorRef} {...viewProps}>
      {children}
    </View>
  );
}
Anchor.displayName = 'Popover.Anchor';

export type PopoverTriggerRenderProps = {
  open: boolean;
  disabled: boolean;
};

export interface PopoverTriggerProps extends Omit<
  PressableProps,
  'children' | 'onPress' | 'disabled'
> {
  disabled?: boolean;
  children:
    React.ReactNode | ((state: PopoverTriggerRenderProps) => React.ReactNode);
}

function Trigger({
  disabled: triggerDisabled = false,
  children,
  ...pressableProps
}: PopoverTriggerProps) {
  const {
    open,
    disabled: groupDisabled,
    triggerRef,
    togglePopover,
  } = usePopoverContext('Trigger');
  const disabled = triggerDisabled || groupDisabled;

  const handlePress = useCallback(() => {
    if (disabled) return;
    togglePopover();
  }, [disabled, togglePopover]);

  return (
    <Pressable
      ref={triggerRef}
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
Trigger.displayName = 'Popover.Trigger';

export type PopoverContentRenderProps = {
  /** The side the content actually ended up on (may differ from the requested `side` if it got flipped). */
  side: PopoverSide;
};

export interface PopoverContentProps extends Omit<ViewProps, 'children'> {
  side?: PopoverSide;
  align?: PopoverAlign;
  sideOffset?: number;
  alignOffset?: number;
  /** Flip to the opposite side, and clamp cross-axis position, so content stays on-screen. Defaults to true. */
  avoidCollisions?: boolean;
  /** Close when the backdrop (outside the content) is pressed. Defaults to true. */
  closeOnOutsidePress?: boolean;
  /** Keep the content mounted (invisible) even when closed. Content won't reposition itself while closed. */
  forceMount?: boolean;
  children:
    React.ReactNode | ((state: PopoverContentRenderProps) => React.ReactNode);
}

function Content({
  side = 'bottom',
  align = 'center',
  sideOffset = 8,
  alignOffset = 0,
  avoidCollisions = true,
  closeOnOutsidePress = true,
  forceMount = false,
  children,
  style,
  ...viewProps
}: PopoverContentProps) {
  const { open, anchorRef, triggerRef, closePopover } =
    usePopoverContext('Content');
  const windowSize = useWindowDimensions();

  const [anchorRect, setAnchorRect] = useState<Rect | null>(null);
  const [contentSize, setContentSize] = useState<Size | null>(null);

  useEffect(() => {
    if (!open) {
      setAnchorRect(null);
      setContentSize(null);
      return;
    }

    const node = anchorRef.current ?? triggerRef.current;
    if (node && typeof node.measureInWindow === 'function') {
      node.measureInWindow((x, y, width, height) => {
        setAnchorRect({ x, y, width, height });
      });
    } else {
      setAnchorRect({ x: 0, y: 0, width: 0, height: 0 });
    }
  }, [open, anchorRef, triggerRef]);

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
      onRequestClose={closePopover}
    >
      <Pressable
        testID="anvil-popover-backdrop"
        style={StyleSheet.absoluteFill}
        onPress={closeOnOutsidePress ? closePopover : undefined}
        accessibilityRole={closeOnOutsidePress ? 'button' : undefined}
        accessibilityLabel={closeOnOutsidePress ? 'Close popover' : undefined}
        accessibilityElementsHidden={!closeOnOutsidePress}
        importantForAccessibility={
          closeOnOutsidePress ? 'auto' : 'no-hide-descendants'
        }
      />
      <View
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setContentSize({ width, height });
        }}
        accessibilityViewIsModal
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
Content.displayName = 'Popover.Content';

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

export type PopoverCloseProps = PressableProps;

function Close({ onPress, ...pressableProps }: PopoverCloseProps) {
  const { closePopover } = usePopoverContext('Close');

  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      closePopover();
      onPress?.(event);
    },
    [closePopover, onPress]
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      {...pressableProps}
    />
  );
}
Close.displayName = 'Popover.Close';

export const Popover = {
  Root,
  Anchor,
  Trigger,
  Content,
  Close,
};
