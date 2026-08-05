import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
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

interface SwitchContextValue {
  checked: boolean;
}

const SwitchContext = createContext<SwitchContextValue | null>(null);

function useSwitchContext(component: string): SwitchContextValue {
  const context = useContext(SwitchContext);
  if (!context) {
    throw new Error(`Switch.${component} must be used within a Switch.Root`);
  }
  return context;
}

export type SwitchRenderProps = {
  checked: boolean;
  disabled: boolean;
};

export interface SwitchRootProps extends Omit<
  PressableProps,
  'children' | 'onPress' | 'disabled'
> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  children: React.ReactNode | ((state: SwitchRenderProps) => React.ReactNode);
}

export interface SwitchHandle {
  toggle: () => void;
  setChecked: (checked: boolean) => void;
  getChecked: () => boolean;
}

const Root = forwardRef<SwitchHandle, SwitchRootProps>(function SwitchRoot(
  {
    checked,
    defaultChecked = false,
    onCheckedChange,
    disabled = false,
    children,
    ...pressableProps
  },
  ref
) {
  const isControlled = checked !== undefined;
  const initialIsControlled = useRef(isControlled).current;

  useWarnOnceWhen(isControlled !== initialIsControlled, () =>
    controlledChangeMessage(
      'Switch.Root',
      initialIsControlled,
      isControlled,
      'checked'
    )
  );

  const [uncontrolledChecked, setUncontrolledChecked] =
    useState(defaultChecked);
  const currentChecked = isControlled
    ? (checked ?? false)
    : uncontrolledChecked;

  const setChecked = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setUncontrolledChecked(next);
      }
      onCheckedChange?.(next);
    },
    [isControlled, onCheckedChange]
  );

  const toggle = useCallback(
    () => setChecked(!currentChecked),
    [setChecked, currentChecked]
  );

  useImperativeHandle(
    ref,
    () => ({
      toggle,
      setChecked,
      getChecked: () => currentChecked,
    }),
    [toggle, setChecked, currentChecked]
  );

  const handlePress = useCallback(() => {
    if (disabled) return;
    toggle();
  }, [disabled, toggle]);

  return (
    <SwitchContext.Provider value={{ checked: currentChecked }}>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: currentChecked, disabled }}
        disabled={disabled}
        onPress={handlePress}
        {...pressableProps}
      >
        {typeof children === 'function'
          ? children({ checked: currentChecked, disabled })
          : children}
      </Pressable>
    </SwitchContext.Provider>
  );
});
Root.displayName = 'Switch.Root';

export type SwitchThumbRenderProps = {
  checked: boolean;
};

export interface SwitchThumbProps extends Omit<ViewProps, 'children'> {
  children?:
    React.ReactNode | ((state: SwitchThumbRenderProps) => React.ReactNode);
}

function Thumb({ children, ...viewProps }: SwitchThumbProps) {
  const { checked } = useSwitchContext('Thumb');

  return (
    <View {...viewProps}>
      {typeof children === 'function' ? children({ checked }) : children}
    </View>
  );
}
Thumb.displayName = 'Switch.Thumb';

export const Switch = {
  Root,
  Thumb,
};
