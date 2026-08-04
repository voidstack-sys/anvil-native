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

type ViewRef = React.ComponentRef<typeof View>;

interface MenuContextValue {
  open: boolean;
  disabled: boolean;
  triggerRef: React.RefObject<ViewRef | null>;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
}

const MenuContext = createContext<MenuContextValue | null>(null);

function useMenuContext(component: string): MenuContextValue {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error(`Menu.${component} must be used within a Menu.Root`);
  }
  return context;
}

export interface MenuRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Disables the trigger, regardless of its own `disabled` prop. */
  disabled?: boolean;
  children: React.ReactNode;
}

export interface MenuHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
}

const Root = forwardRef<MenuHandle, MenuRootProps>(function MenuRoot(
  { open, defaultOpen = false, onOpenChange, disabled = false, children },
  ref
) {
  const isControlled = open !== undefined;
  const initialIsControlled = useRef(isControlled).current;

  useWarnOnceWhen(isControlled !== initialIsControlled, () =>
    controlledChangeMessage(
      'Menu.Root',
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

  const openMenu = useCallback(() => setOpen(true), [setOpen]);
  const closeMenu = useCallback(() => setOpen(false), [setOpen]);
  const toggleMenu = useCallback(() => setOpen(!isOpen), [setOpen, isOpen]);

  const triggerRef = useRef<ViewRef>(null);

  useImperativeHandle(
    ref,
    () => ({
      open: openMenu,
      close: closeMenu,
      toggle: toggleMenu,
      isOpen: () => isOpen,
    }),
    [openMenu, closeMenu, toggleMenu, isOpen]
  );

  const contextValue = useMemo(
    () => ({
      open: isOpen,
      disabled,
      triggerRef,
      openMenu,
      closeMenu,
      toggleMenu,
    }),
    [isOpen, disabled, openMenu, closeMenu, toggleMenu]
  );

  return (
    <MenuContext.Provider value={contextValue}>{children}</MenuContext.Provider>
  );
});
Root.displayName = 'Menu.Root';

export type MenuTriggerRenderProps = {
  open: boolean;
  disabled: boolean;
};

export interface MenuTriggerProps extends Omit<
  PressableProps,
  'children' | 'onPress' | 'disabled'
> {
  disabled?: boolean;
  children:
    React.ReactNode | ((state: MenuTriggerRenderProps) => React.ReactNode);
}

function Trigger({
  disabled: triggerDisabled = false,
  children,
  ...pressableProps
}: MenuTriggerProps) {
  const {
    open,
    disabled: groupDisabled,
    triggerRef,
    toggleMenu,
  } = useMenuContext('Trigger');
  const disabled = triggerDisabled || groupDisabled;

  const handlePress = useCallback(() => {
    if (disabled) return;
    toggleMenu();
  }, [disabled, toggleMenu]);

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
Trigger.displayName = 'Menu.Trigger';

export type MenuContentRenderProps = {
  /** The side the content actually ended up on (may differ from the requested `side` if it got flipped). */
  side: FloatingSide;
};

export interface MenuContentProps extends Omit<ViewProps, 'children'> {
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
    React.ReactNode | ((state: MenuContentRenderProps) => React.ReactNode);
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
}: MenuContentProps) {
  const { open, triggerRef, closeMenu } = useMenuContext('Content');
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
      onRequestClose={closeMenu}
    >
      <Pressable
        testID="anvil-menu-backdrop"
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
Content.displayName = 'Menu.Content';

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

export type MenuItemRenderProps = {
  disabled: boolean;
};

export interface MenuItemProps extends Omit<
  PressableProps,
  'children' | 'onPress' | 'disabled'
> {
  disabled?: boolean;
  /** Close the menu after this item is pressed. Defaults to true. */
  closeOnSelect?: boolean;
  onSelect?: () => void;
  children: React.ReactNode | ((state: MenuItemRenderProps) => React.ReactNode);
}

function Item({
  disabled = false,
  closeOnSelect = true,
  onSelect,
  children,
  ...pressableProps
}: MenuItemProps) {
  const { closeMenu } = useMenuContext('Item');

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
Item.displayName = 'Menu.Item';

export type MenuSeparatorProps = ViewProps;

function Separator(props: MenuSeparatorProps) {
  return <View importantForAccessibility="no" {...props} />;
}
Separator.displayName = 'Menu.Separator';

export type MenuLabelProps = TextProps;

function Label(props: MenuLabelProps) {
  return <Text {...props} />;
}
Label.displayName = 'Menu.Label';

export const Menu = {
  Root,
  Trigger,
  Content,
  Item,
  Separator,
  Label,
};
