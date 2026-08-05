import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Pressable, type PressableProps } from 'react-native';
import {
  controlledChangeMessage,
  useWarnOnceWhen,
} from '../../internal/devWarnings';

export type ToggleRenderProps = {
  pressed: boolean;
  disabled: boolean;
};

export interface ToggleRootProps extends Omit<
  PressableProps,
  'children' | 'onPress' | 'disabled'
> {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  disabled?: boolean;
  children: React.ReactNode | ((state: ToggleRenderProps) => React.ReactNode);
}

export interface ToggleHandle {
  toggle: () => void;
  setPressed: (pressed: boolean) => void;
  getPressed: () => boolean;
}

const Root = forwardRef<ToggleHandle, ToggleRootProps>(function ToggleRoot(
  {
    pressed,
    defaultPressed = false,
    onPressedChange,
    disabled = false,
    children,
    ...pressableProps
  },
  ref
) {
  const isControlled = pressed !== undefined;
  const initialIsControlled = useRef(isControlled).current;

  useWarnOnceWhen(isControlled !== initialIsControlled, () =>
    controlledChangeMessage(
      'Toggle.Root',
      initialIsControlled,
      isControlled,
      'pressed'
    )
  );

  const [uncontrolledPressed, setUncontrolledPressed] =
    useState(defaultPressed);
  const currentPressed = isControlled
    ? (pressed ?? false)
    : uncontrolledPressed;

  const setPressed = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setUncontrolledPressed(next);
      }
      onPressedChange?.(next);
    },
    [isControlled, onPressedChange]
  );

  const toggle = useCallback(
    () => setPressed(!currentPressed),
    [setPressed, currentPressed]
  );

  useImperativeHandle(
    ref,
    () => ({
      toggle,
      setPressed,
      getPressed: () => currentPressed,
    }),
    [toggle, setPressed, currentPressed]
  );

  const handlePress = useCallback(() => {
    if (disabled) return;
    toggle();
  }, [disabled, toggle]);

  return (
    <Pressable
      accessibilityRole="togglebutton"
      accessibilityState={{ selected: currentPressed, disabled }}
      disabled={disabled}
      onPress={handlePress}
      {...pressableProps}
    >
      {typeof children === 'function'
        ? children({ pressed: currentPressed, disabled })
        : children}
    </Pressable>
  );
});
Root.displayName = 'Toggle.Root';

export const Toggle = {
  Root,
};
