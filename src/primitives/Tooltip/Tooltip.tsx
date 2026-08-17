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
  AccessibilityInfo,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
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
  type FloatingAlign,
  type FloatingSide,
  type Rect,
  type Size,
} from '../../internal/positioning';

type ViewRef = React.ComponentRef<typeof View>;

interface TooltipContextValue {
  open: boolean;
  disabled: boolean;
  delayDuration: number;
  triggerRef: React.RefObject<ViewRef | null>;
  openTooltip: () => void;
  closeTooltip: () => void;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

function useTooltipContext(component: string): TooltipContextValue {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error(`Tooltip.${component} must be used within a Tooltip.Root`);
  }
  return context;
}

export interface TooltipRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Disables the trigger, regardless of its own `disabled` prop. */
  disabled?: boolean;
  /**
   * Delay (ms) before the tooltip opens on mouse hover (web/desktop
   * pointers). Long-press and keyboard focus open it immediately, since
   * there's no equivalent "resting" state to debounce on touch. Defaults
   * to 700.
   */
  delayDuration?: number;
  children: React.ReactNode;
}

export interface TooltipHandle {
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
}

const Root = forwardRef<TooltipHandle, TooltipRootProps>(function TooltipRoot(
  {
    open,
    defaultOpen = false,
    onOpenChange,
    disabled = false,
    delayDuration = 700,
    children,
  },
  ref
) {
  const isControlled = open !== undefined;
  const initialIsControlled = useRef(isControlled).current;

  useWarnOnceWhen(isControlled !== initialIsControlled, () =>
    controlledChangeMessage(
      'Tooltip.Root',
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

  const openTooltip = useCallback(() => setOpen(true), [setOpen]);
  const closeTooltip = useCallback(() => setOpen(false), [setOpen]);

  const triggerRef = useRef<ViewRef>(null);

  useImperativeHandle(
    ref,
    () => ({
      open: openTooltip,
      close: closeTooltip,
      isOpen: () => isOpen,
    }),
    [openTooltip, closeTooltip, isOpen]
  );

  const contextValue = useMemo(
    () => ({
      open: isOpen,
      disabled,
      delayDuration,
      triggerRef,
      openTooltip,
      closeTooltip,
    }),
    [isOpen, disabled, delayDuration, openTooltip, closeTooltip]
  );

  return (
    <TooltipContext.Provider value={contextValue}>
      {children}
    </TooltipContext.Provider>
  );
});
Root.displayName = 'Tooltip.Root';

export type TooltipTriggerRenderProps = {
  open: boolean;
  disabled: boolean;
};

export interface TooltipTriggerProps extends Omit<
  PressableProps,
  'children' | 'disabled'
> {
  disabled?: boolean;
  children:
    React.ReactNode | ((state: TooltipTriggerRenderProps) => React.ReactNode);
}

function Trigger({
  disabled: triggerDisabled = false,
  onLongPress,
  onPressOut,
  onHoverIn,
  onHoverOut,
  onFocus,
  onBlur,
  children,
  ...pressableProps
}: TooltipTriggerProps) {
  const {
    open,
    disabled: groupDisabled,
    delayDuration,
    triggerRef,
    openTooltip,
    closeTooltip,
  } = useTooltipContext('Trigger');
  const disabled = triggerDisabled || groupDisabled;

  // Tracks whether the current open state was triggered by a long-press, so
  // lifting the finger (onPressOut) closes it again -- mirroring how
  // press-and-hold tooltips behave on Android, since touch has no "hover".
  const openedByLongPressRef = useRef(false);

  const handleLongPress = useCallback<
    NonNullable<PressableProps['onLongPress']>
  >(
    (event) => {
      if (!disabled) {
        openedByLongPressRef.current = true;
        openTooltip();
      }
      onLongPress?.(event);
    },
    [disabled, openTooltip, onLongPress]
  );

  const handlePressOut = useCallback<NonNullable<PressableProps['onPressOut']>>(
    (event) => {
      if (openedByLongPressRef.current) {
        openedByLongPressRef.current = false;
        closeTooltip();
      }
      onPressOut?.(event);
    },
    [closeTooltip, onPressOut]
  );

  // A just-opened tooltip can end up rendered under the cursor (e.g. a small
  // trigger with a tightly-offset side), which makes the browser immediately
  // re-fire hover-out/hover-in as the content mounts and the hit-test target
  // changes underneath a stationary pointer. Debouncing the close -- and
  // cancelling it if hover-in fires again first -- absorbs that thrash
  // without adding any noticeable delay to a real hover-away.
  const hoverOutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (hoverOutTimeoutRef.current) clearTimeout(hoverOutTimeoutRef.current);
    },
    []
  );

  const handleHoverIn = useCallback<NonNullable<PressableProps['onHoverIn']>>(
    (event) => {
      if (hoverOutTimeoutRef.current) {
        clearTimeout(hoverOutTimeoutRef.current);
        hoverOutTimeoutRef.current = null;
      }
      if (!disabled) openTooltip();
      onHoverIn?.(event);
    },
    [disabled, openTooltip, onHoverIn]
  );

  const handleHoverOut = useCallback<NonNullable<PressableProps['onHoverOut']>>(
    (event) => {
      hoverOutTimeoutRef.current = setTimeout(() => {
        hoverOutTimeoutRef.current = null;
        closeTooltip();
      }, 100);
      onHoverOut?.(event);
    },
    [closeTooltip, onHoverOut]
  );

  const handleFocus = useCallback<NonNullable<PressableProps['onFocus']>>(
    (event) => {
      if (!disabled) openTooltip();
      onFocus?.(event);
    },
    [disabled, openTooltip, onFocus]
  );

  const handleBlur = useCallback<NonNullable<PressableProps['onBlur']>>(
    (event) => {
      closeTooltip();
      onBlur?.(event);
    },
    [closeTooltip, onBlur]
  );

  return (
    <Pressable
      ref={triggerRef}
      disabled={disabled}
      delayHoverIn={delayDuration}
      onLongPress={handleLongPress}
      onPressOut={handlePressOut}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      onFocus={handleFocus}
      onBlur={handleBlur}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      {...pressableProps}
    >
      {typeof children === 'function' ? children({ open, disabled }) : children}
    </Pressable>
  );
}
Trigger.displayName = 'Tooltip.Trigger';

export type TooltipContentRenderProps = {
  /** The side the content actually ended up on (may differ from the requested `side` if it got flipped). */
  side: FloatingSide;
};

export interface TooltipContentProps extends Omit<ViewProps, 'children'> {
  side?: FloatingSide;
  align?: FloatingAlign;
  sideOffset?: number;
  alignOffset?: number;
  /** Flip to the opposite side, and clamp cross-axis position, so content stays on-screen. Defaults to true. */
  avoidCollisions?: boolean;
  children:
    React.ReactNode | ((state: TooltipContentRenderProps) => React.ReactNode);
}

function Content({
  side = 'top',
  align = 'center',
  sideOffset = 6,
  alignOffset = 0,
  avoidCollisions = true,
  pointerEvents = 'none',
  children,
  style,
  ...viewProps
}: TooltipContentProps) {
  const { open, triggerRef, closeTooltip } = useTooltipContext('Content');
  const windowSize = useWindowDimensions();

  const [anchorRect, setAnchorRect] = useState<Rect | null>(null);
  const [contentSize, setContentSize] = useState<Size | null>(null);
  const announcedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setAnchorRect(null);
      setContentSize(null);
      announcedRef.current = false;
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

  // Only plain string content can be announced reliably -- render-prop or
  // nested-element content is skipped rather than guessed at.
  const announcementText = typeof children === 'string' ? children : null;

  useEffect(() => {
    if (!open || Platform.OS !== 'ios' || announcedRef.current) return;
    if (announcementText) {
      AccessibilityInfo.announceForAccessibility(announcementText);
      announcedRef.current = true;
    }
  }, [open, announcementText]);

  if (!open) {
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
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeTooltip}
    >
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setContentSize({ width, height });
          }}
          accessibilityRole="text"
          accessibilityLiveRegion={
            Platform.OS === 'android' ? 'polite' : undefined
          }
          pointerEvents={pointerEvents}
          style={[
            styles.content,
            position
              ? [{ top: position.top, left: position.left }, styles.positioned]
              : styles.measuring,
            style,
          ]}
          {...viewProps}
        >
          {typeof children === 'function' ? (
            children({ side: position?.side ?? side })
          ) : typeof children === 'string' ? (
            <Text>{children}</Text>
          ) : (
            children
          )}
        </View>
      </View>
    </Modal>
  );
}
Content.displayName = 'Tooltip.Content';

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

export const Tooltip = {
  Root,
  Trigger,
  Content,
};
