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
  type GestureResponderEvent,
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

export type ContextMenuPoint = { x: number; y: number };

interface ContextMenuContextValue {
  open: boolean;
  disabled: boolean;
  anchorPoint: ContextMenuPoint | null;
  openMenu: (point: ContextMenuPoint) => void;
  closeMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

function useContextMenuContext(component: string): ContextMenuContextValue {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error(
      `ContextMenu.${component} must be used within a ContextMenu.Root`
    );
  }
  return context;
}

export interface ContextMenuRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Disables the trigger, regardless of its own `disabled` prop. */
  disabled?: boolean;
  children: React.ReactNode;
}

export interface ContextMenuHandle {
  /** Opens the menu anchored at `point` (screen coordinates, e.g. from a `GestureResponderEvent`'s `pageX`/`pageY`). */
  open: (point: ContextMenuPoint) => void;
  close: () => void;
  isOpen: () => boolean;
}

const Root = forwardRef<ContextMenuHandle, ContextMenuRootProps>(
  function ContextMenuRoot(
    { open, defaultOpen = false, onOpenChange, disabled = false, children },
    ref
  ) {
    const isControlled = open !== undefined;
    const initialIsControlled = useRef(isControlled).current;

    useWarnOnceWhen(isControlled !== initialIsControlled, () =>
      controlledChangeMessage(
        'ContextMenu.Root',
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

    const [anchorPoint, setAnchorPoint] = useState<ContextMenuPoint | null>(
      null
    );

    const openMenu = useCallback(
      (point: ContextMenuPoint) => {
        setAnchorPoint(point);
        setOpen(true);
      },
      [setOpen]
    );
    const closeMenu = useCallback(() => setOpen(false), [setOpen]);

    useImperativeHandle(
      ref,
      () => ({
        open: openMenu,
        close: closeMenu,
        isOpen: () => isOpen,
      }),
      [openMenu, closeMenu, isOpen]
    );

    const contextValue = useMemo(
      () => ({
        open: isOpen,
        disabled,
        anchorPoint,
        openMenu,
        closeMenu,
      }),
      [isOpen, disabled, anchorPoint, openMenu, closeMenu]
    );

    return (
      <ContextMenuContext.Provider value={contextValue}>
        {children}
      </ContextMenuContext.Provider>
    );
  }
);
Root.displayName = 'ContextMenu.Root';

export type ContextMenuTriggerRenderProps = {
  open: boolean;
  disabled: boolean;
};

export interface ContextMenuTriggerProps extends Omit<
  PressableProps,
  'children' | 'onLongPress' | 'disabled'
> {
  disabled?: boolean;
  children:
    | React.ReactNode
    | ((state: ContextMenuTriggerRenderProps) => React.ReactNode);
}

function Trigger({
  disabled: triggerDisabled = false,
  children,
  ...pressableProps
}: ContextMenuTriggerProps) {
  const {
    open,
    disabled: groupDisabled,
    openMenu,
  } = useContextMenuContext('Trigger');
  const disabled = triggerDisabled || groupDisabled;

  const handleLongPress = useCallback(
    (event: GestureResponderEvent) => {
      if (disabled) return;
      const { pageX, pageY } = event.nativeEvent;
      openMenu({ x: pageX, y: pageY });
    },
    [disabled, openMenu]
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open, disabled }}
      disabled={disabled}
      onLongPress={handleLongPress}
      {...pressableProps}
    >
      {typeof children === 'function' ? children({ open, disabled }) : children}
    </Pressable>
  );
}
Trigger.displayName = 'ContextMenu.Trigger';

export type ContextMenuContentRenderProps = {
  /** The side the content actually ended up on relative to the touch point. */
  side: FloatingSide;
};

export interface ContextMenuContentProps extends Omit<ViewProps, 'children'> {
  side?: FloatingSide;
  align?: FloatingAlign;
  sideOffset?: number;
  alignOffset?: number;
  /** Flip to the opposite side, and clamp cross-axis position, so content stays on-screen. Defaults to true. */
  avoidCollisions?: boolean;
  /** Close when the backdrop (outside the menu) is pressed. Defaults to true. */
  closeOnOutsidePress?: boolean;
  /** Keep the content mounted (invisible) even when closed. Content won't reposition itself while closed. */
  forceMount?: boolean;
  children:
    | React.ReactNode
    | ((state: ContextMenuContentRenderProps) => React.ReactNode);
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
}: ContextMenuContentProps) {
  const { open, anchorPoint, closeMenu } = useContextMenuContext('Content');
  const windowSize = useWindowDimensions();

  const [contentSize, setContentSize] = useState<Size | null>(null);

  useEffect(() => {
    if (!open) {
      setContentSize(null);
    }
  }, [open]);

  if (!open && !forceMount) {
    return null;
  }

  const anchorRect: Rect | null = anchorPoint
    ? { x: anchorPoint.x, y: anchorPoint.y, width: 0, height: 0 }
    : null;

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
      onRequestClose={closeMenu}
    >
      <Pressable
        testID="anvil-context-menu-backdrop"
        style={StyleSheet.absoluteFill}
        onPress={closeOnOutsidePress ? closeMenu : undefined}
        accessibilityRole={closeOnOutsidePress ? 'button' : undefined}
        accessibilityLabel={closeOnOutsidePress ? 'Close menu' : undefined}
        accessibilityElementsHidden={!closeOnOutsidePress}
        importantForAccessibility={
          closeOnOutsidePress ? 'auto' : 'no-hide-descendants'
        }
      />
      <View
        accessibilityRole="menu"
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
Content.displayName = 'ContextMenu.Content';

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

export type ContextMenuItemRenderProps = {
  disabled: boolean;
};

export interface ContextMenuItemProps extends Omit<
  PressableProps,
  'children' | 'onPress' | 'disabled'
> {
  disabled?: boolean;
  /** Close the menu after this item is pressed. Defaults to true. */
  closeOnSelect?: boolean;
  onSelect?: () => void;
  children:
    React.ReactNode | ((state: ContextMenuItemRenderProps) => React.ReactNode);
}

function Item({
  disabled = false,
  closeOnSelect = true,
  onSelect,
  children,
  ...pressableProps
}: ContextMenuItemProps) {
  const { closeMenu } = useContextMenuContext('Item');

  const handlePress = useCallback(() => {
    if (disabled) return;
    onSelect?.();
    if (closeOnSelect) closeMenu();
  }, [disabled, onSelect, closeOnSelect, closeMenu]);

  return (
    <Pressable
      accessibilityRole="menuitem"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
      {...pressableProps}
    >
      {typeof children === 'function' ? children({ disabled }) : children}
    </Pressable>
  );
}
Item.displayName = 'ContextMenu.Item';

export type ContextMenuSeparatorProps = ViewProps;

function Separator(props: ContextMenuSeparatorProps) {
  return <View importantForAccessibility="no" {...props} />;
}
Separator.displayName = 'ContextMenu.Separator';

export type ContextMenuLabelProps = TextProps;

function Label(props: ContextMenuLabelProps) {
  return <Text {...props} />;
}
Label.displayName = 'ContextMenu.Label';

export const ContextMenu = {
  Root,
  Trigger,
  Content,
  Item,
  Separator,
  Label,
};
