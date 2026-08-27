import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Pressable,
  View,
  type PressableProps,
  type ViewProps,
} from 'react-native';
import {
  controlledChangeMessage,
  useWarnOnceWhen,
} from '../../internal/devWarnings';

interface SpeedDialContextValue {
  open: boolean;
  disabled: boolean;
  openDial: () => void;
  closeDial: () => void;
  toggleDial: () => void;
}

const SpeedDialContext = createContext<SpeedDialContextValue | null>(null);

function useSpeedDialContext(component: string): SpeedDialContextValue {
  const context = useContext(SpeedDialContext);
  if (!context) {
    throw new Error(
      `SpeedDial.${component} must be used within a SpeedDial.Root`
    );
  }
  return context;
}

export interface SpeedDialRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Disables the trigger, regardless of its own `disabled` prop. */
  disabled?: boolean;
  children: React.ReactNode;
}

export interface SpeedDialHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
}

const Root = forwardRef<SpeedDialHandle, SpeedDialRootProps>(
  function SpeedDialRoot(
    { open, defaultOpen = false, onOpenChange, disabled = false, children },
    ref
  ) {
    const isControlled = open !== undefined;
    const initialIsControlled = useRef(isControlled).current;

    useWarnOnceWhen(isControlled !== initialIsControlled, () =>
      controlledChangeMessage(
        'SpeedDial.Root',
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

    const openDial = useCallback(() => setOpen(true), [setOpen]);
    const closeDial = useCallback(() => setOpen(false), [setOpen]);
    const toggleDial = useCallback(() => setOpen(!isOpen), [setOpen, isOpen]);

    useImperativeHandle(
      ref,
      () => ({
        open: openDial,
        close: closeDial,
        toggle: toggleDial,
        isOpen: () => isOpen,
      }),
      [openDial, closeDial, toggleDial, isOpen]
    );

    const contextValue = useMemo(
      () => ({ open: isOpen, disabled, openDial, closeDial, toggleDial }),
      [isOpen, disabled, openDial, closeDial, toggleDial]
    );

    return (
      <SpeedDialContext.Provider value={contextValue}>
        {children}
      </SpeedDialContext.Provider>
    );
  }
);
Root.displayName = 'SpeedDial.Root';

export type SpeedDialTriggerRenderProps = {
  open: boolean;
  disabled: boolean;
};

export interface SpeedDialTriggerProps extends Omit<
  PressableProps,
  'children' | 'onPress' | 'disabled'
> {
  disabled?: boolean;
  children:
    React.ReactNode | ((state: SpeedDialTriggerRenderProps) => React.ReactNode);
}

function Trigger({
  disabled: triggerDisabled = false,
  children,
  ...pressableProps
}: SpeedDialTriggerProps) {
  const {
    open,
    disabled: groupDisabled,
    toggleDial,
  } = useSpeedDialContext('Trigger');
  const disabled = triggerDisabled || groupDisabled;

  const handlePress = useCallback(() => {
    if (disabled) return;
    toggleDial();
  }, [disabled, toggleDial]);

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
Trigger.displayName = 'SpeedDial.Trigger';

export interface SpeedDialActionsProps extends Omit<ViewProps, 'children'> {
  /** Keep the actions mounted (but you decide how they look) even when closed. */
  forceMount?: boolean;
  children: React.ReactNode;
}

function Actions({
  forceMount = false,
  children,
  ...viewProps
}: SpeedDialActionsProps) {
  const { open } = useSpeedDialContext('Actions');

  if (!open && !forceMount) {
    return null;
  }

  return (
    <View accessibilityRole="menu" {...viewProps}>
      {children}
    </View>
  );
}
Actions.displayName = 'SpeedDial.Actions';

export interface SpeedDialActionProps extends PressableProps {
  /** Closes the dial after this action is pressed. Defaults to true. */
  closeOnPress?: boolean;
}

function Action({
  onPress,
  closeOnPress = true,
  ...pressableProps
}: SpeedDialActionProps) {
  const { closeDial } = useSpeedDialContext('Action');

  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      onPress?.(event);
      if (closeOnPress) closeDial();
    },
    [onPress, closeOnPress, closeDial]
  );

  return (
    <Pressable
      accessibilityRole="menuitem"
      onPress={handlePress}
      {...pressableProps}
    />
  );
}
Action.displayName = 'SpeedDial.Action';

export interface SpeedDialBackdropProps extends Omit<
  PressableProps,
  'onPress'
> {
  /** Close when the backdrop is pressed. Defaults to true. */
  closeOnPress?: boolean;
}

function Backdrop({
  closeOnPress = true,
  ...pressableProps
}: SpeedDialBackdropProps) {
  const { open, closeDial } = useSpeedDialContext('Backdrop');

  if (!open) {
    return null;
  }

  return (
    <Pressable
      onPress={closeOnPress ? closeDial : undefined}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      {...pressableProps}
    />
  );
}
Backdrop.displayName = 'SpeedDial.Backdrop';

export const SpeedDial = {
  Root,
  Trigger,
  Actions,
  Action,
  Backdrop,
};
