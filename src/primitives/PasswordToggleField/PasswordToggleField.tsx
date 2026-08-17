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
  TextInput,
  type PressableProps,
  type TextInputProps,
} from 'react-native';
import {
  controlledChangeMessage,
  useWarnOnceWhen,
} from '../../internal/devWarnings';

interface PasswordToggleFieldContextValue {
  visible: boolean;
  disabled: boolean;
  toggleVisible: () => void;
}

const PasswordToggleFieldContext =
  createContext<PasswordToggleFieldContextValue | null>(null);

function usePasswordToggleFieldContext(
  component: string
): PasswordToggleFieldContextValue {
  const context = useContext(PasswordToggleFieldContext);
  if (!context) {
    throw new Error(
      `PasswordToggleField.${component} must be used within a PasswordToggleField.Root`
    );
  }
  return context;
}

export interface PasswordToggleFieldRootProps {
  visible?: boolean;
  defaultVisible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  /** Disables the toggle button, regardless of its own `disabled` prop. */
  disabled?: boolean;
  children: React.ReactNode;
}

export interface PasswordToggleFieldHandle {
  toggle: () => void;
  setVisible: (visible: boolean) => void;
  getVisible: () => boolean;
}

const Root = forwardRef<
  PasswordToggleFieldHandle,
  PasswordToggleFieldRootProps
>(function PasswordToggleFieldRoot(
  {
    visible,
    defaultVisible = false,
    onVisibleChange,
    disabled = false,
    children,
  },
  ref
) {
  const isControlled = visible !== undefined;
  const initialIsControlled = useRef(isControlled).current;

  useWarnOnceWhen(isControlled !== initialIsControlled, () =>
    controlledChangeMessage(
      'PasswordToggleField.Root',
      initialIsControlled,
      isControlled,
      'visible'
    )
  );

  const [uncontrolledVisible, setUncontrolledVisible] =
    useState(defaultVisible);
  const currentVisible = isControlled
    ? (visible ?? false)
    : uncontrolledVisible;

  const setVisible = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setUncontrolledVisible(next);
      }
      onVisibleChange?.(next);
    },
    [isControlled, onVisibleChange]
  );

  const toggleVisible = useCallback(
    () => setVisible(!currentVisible),
    [setVisible, currentVisible]
  );

  useImperativeHandle(
    ref,
    () => ({
      toggle: toggleVisible,
      setVisible,
      getVisible: () => currentVisible,
    }),
    [toggleVisible, setVisible, currentVisible]
  );

  const contextValue = useMemo(
    () => ({ visible: currentVisible, disabled, toggleVisible }),
    [currentVisible, disabled, toggleVisible]
  );

  return (
    <PasswordToggleFieldContext.Provider value={contextValue}>
      {children}
    </PasswordToggleFieldContext.Provider>
  );
});
Root.displayName = 'PasswordToggleField.Root';

export type PasswordToggleFieldInputProps = Omit<
  TextInputProps,
  'secureTextEntry'
>;

type TextInputRef = React.ComponentRef<typeof TextInput>;

const Input = forwardRef<TextInputRef, PasswordToggleFieldInputProps>(
  function PasswordToggleFieldInput(props, ref) {
    const { visible } = usePasswordToggleFieldContext('Input');
    return <TextInput ref={ref} secureTextEntry={!visible} {...props} />;
  }
);
Input.displayName = 'PasswordToggleField.Input';

export type PasswordToggleFieldToggleRenderProps = {
  visible: boolean;
  disabled: boolean;
};

export interface PasswordToggleFieldToggleProps extends Omit<
  PressableProps,
  'children' | 'onPress' | 'disabled'
> {
  disabled?: boolean;
  children:
    | React.ReactNode
    | ((state: PasswordToggleFieldToggleRenderProps) => React.ReactNode);
}

function Toggle({
  disabled: toggleDisabled = false,
  accessibilityLabel,
  children,
  ...pressableProps
}: PasswordToggleFieldToggleProps) {
  const {
    visible,
    disabled: groupDisabled,
    toggleVisible,
  } = usePasswordToggleFieldContext('Toggle');
  const disabled = toggleDisabled || groupDisabled;

  const handlePress = useCallback(() => {
    if (disabled) return;
    toggleVisible();
  }, [disabled, toggleVisible]);

  return (
    <Pressable
      accessibilityRole="togglebutton"
      accessibilityLabel={
        accessibilityLabel ?? (visible ? 'Hide password' : 'Show password')
      }
      accessibilityState={{ selected: visible, disabled }}
      disabled={disabled}
      onPress={handlePress}
      {...pressableProps}
    >
      {typeof children === 'function'
        ? children({ visible, disabled })
        : children}
    </Pressable>
  );
}
Toggle.displayName = 'PasswordToggleField.Toggle';

export interface PasswordToggleFieldIconProps {
  /** Rendered while the password is visible (e.g. an "eye-off" icon). */
  visible: React.ReactNode;
  /** Rendered while the password is hidden (e.g. an "eye" icon). */
  hidden: React.ReactNode;
}

function Icon({
  visible: visibleIcon,
  hidden: hiddenIcon,
}: PasswordToggleFieldIconProps) {
  const { visible } = usePasswordToggleFieldContext('Icon');
  return <>{visible ? visibleIcon : hiddenIcon}</>;
}
Icon.displayName = 'PasswordToggleField.Icon';

export const PasswordToggleField = {
  Root,
  Input,
  Toggle,
  Icon,
};
