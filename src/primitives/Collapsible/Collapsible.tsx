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

interface CollapsibleContextValue {
  open: boolean;
  disabled: boolean;
  toggleCollapsible: () => void;
}

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null);

function useCollapsibleContext(component: string): CollapsibleContextValue {
  const context = useContext(CollapsibleContext);
  if (!context) {
    throw new Error(
      `Collapsible.${component} must be used within a Collapsible.Root`
    );
  }
  return context;
}

export interface CollapsibleRootProps extends Omit<ViewProps, 'children'> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export interface CollapsibleHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
}

const Root = forwardRef<CollapsibleHandle, CollapsibleRootProps>(
  function CollapsibleRoot(
    {
      open,
      defaultOpen = false,
      onOpenChange,
      disabled = false,
      children,
      ...viewProps
    },
    ref
  ) {
    const isControlled = open !== undefined;
    const initialIsControlled = useRef(isControlled).current;

    useWarnOnceWhen(isControlled !== initialIsControlled, () =>
      controlledChangeMessage(
        'Collapsible.Root',
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

    const openCollapsible = useCallback(() => setOpen(true), [setOpen]);
    const closeCollapsible = useCallback(() => setOpen(false), [setOpen]);
    const toggleCollapsible = useCallback(
      () => setOpen(!isOpen),
      [setOpen, isOpen]
    );

    useImperativeHandle(
      ref,
      () => ({
        open: openCollapsible,
        close: closeCollapsible,
        toggle: toggleCollapsible,
        isOpen: () => isOpen,
      }),
      [openCollapsible, closeCollapsible, toggleCollapsible, isOpen]
    );

    const contextValue = useMemo(
      () => ({ open: isOpen, disabled, toggleCollapsible }),
      [isOpen, disabled, toggleCollapsible]
    );

    return (
      <CollapsibleContext.Provider value={contextValue}>
        <View accessibilityState={{ disabled }} {...viewProps}>
          {children}
        </View>
      </CollapsibleContext.Provider>
    );
  }
);
Root.displayName = 'Collapsible.Root';

export type CollapsibleTriggerRenderProps = {
  open: boolean;
  disabled: boolean;
};

export interface CollapsibleTriggerProps extends Omit<
  PressableProps,
  'children' | 'onPress' | 'disabled'
> {
  disabled?: boolean;
  children:
    | React.ReactNode
    | ((state: CollapsibleTriggerRenderProps) => React.ReactNode);
}

function Trigger({
  disabled: triggerDisabled = false,
  children,
  ...pressableProps
}: CollapsibleTriggerProps) {
  const {
    open,
    disabled: rootDisabled,
    toggleCollapsible,
  } = useCollapsibleContext('Trigger');
  const disabled = triggerDisabled || rootDisabled;

  const handlePress = useCallback(() => {
    if (disabled) return;
    toggleCollapsible();
  }, [disabled, toggleCollapsible]);

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
Trigger.displayName = 'Collapsible.Trigger';

export type CollapsibleContentRenderProps = {
  open: boolean;
};

export interface CollapsibleContentProps extends Omit<ViewProps, 'children'> {
  children:
    | React.ReactNode
    | ((state: CollapsibleContentRenderProps) => React.ReactNode);
  /**
   * Keep the content mounted (but hidden from accessibility, layout left to
   * your own styling) even when closed. Useful when animating height with
   * something like `react-native-reanimated`.
   */
  forceMount?: boolean;
}

function Content({
  children,
  forceMount = false,
  ...viewProps
}: CollapsibleContentProps) {
  const { open } = useCollapsibleContext('Content');

  if (!open && !forceMount) {
    return null;
  }

  return (
    <View
      accessibilityElementsHidden={!open}
      importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
      {...viewProps}
    >
      {typeof children === 'function' ? children({ open }) : children}
    </View>
  );
}
Content.displayName = 'Collapsible.Content';

export const Collapsible = {
  Root,
  Trigger,
  Content,
};
