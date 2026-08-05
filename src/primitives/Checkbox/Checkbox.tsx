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

export type CheckedState = boolean | 'indeterminate';

function isIndeterminate(checked: CheckedState): checked is 'indeterminate' {
  return checked === 'indeterminate';
}

interface CheckboxContextValue {
  checked: CheckedState;
}

const CheckboxContext = createContext<CheckboxContextValue | null>(null);

function useCheckboxContext(component: string): CheckboxContextValue {
  const context = useContext(CheckboxContext);
  if (!context) {
    throw new Error(
      `Checkbox.${component} must be used within a Checkbox.Root`
    );
  }
  return context;
}

export interface CheckboxRootProps extends Omit<
  PressableProps,
  'children' | 'onPress' | 'disabled'
> {
  checked?: CheckedState;
  defaultChecked?: CheckedState;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  children: React.ReactNode | ((state: CheckboxRenderProps) => React.ReactNode);
}

export type CheckboxRenderProps = {
  checked: CheckedState;
  disabled: boolean;
};

export interface CheckboxHandle {
  toggle: () => void;
  setChecked: (checked: CheckedState) => void;
  getChecked: () => CheckedState;
}

const Root = forwardRef<CheckboxHandle, CheckboxRootProps>(
  function CheckboxRoot(
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
        'Checkbox.Root',
        initialIsControlled,
        isControlled,
        'checked'
      )
    );

    const [uncontrolledChecked, setUncontrolledChecked] =
      useState<CheckedState>(defaultChecked);
    const currentChecked = isControlled
      ? (checked ?? false)
      : uncontrolledChecked;

    const setChecked = useCallback(
      (next: CheckedState) => {
        if (!isControlled) {
          setUncontrolledChecked(next);
        }
        onCheckedChange?.(next === true);
      },
      [isControlled, onCheckedChange]
    );

    const toggle = useCallback(() => {
      setChecked(isIndeterminate(currentChecked) ? true : !currentChecked);
    }, [setChecked, currentChecked]);

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
      <CheckboxContext.Provider value={{ checked: currentChecked }}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{
            checked: isIndeterminate(currentChecked) ? 'mixed' : currentChecked,
            disabled,
          }}
          disabled={disabled}
          onPress={handlePress}
          {...pressableProps}
        >
          {typeof children === 'function'
            ? children({ checked: currentChecked, disabled })
            : children}
        </Pressable>
      </CheckboxContext.Provider>
    );
  }
);
Root.displayName = 'Checkbox.Root';

export type CheckboxIndicatorRenderProps = {
  checked: CheckedState;
};

export interface CheckboxIndicatorProps extends Omit<ViewProps, 'children'> {
  /** Keep the indicator mounted even when unchecked, e.g. to drive an exit animation yourself. */
  forceMount?: boolean;
  children:
    | React.ReactNode
    | ((state: CheckboxIndicatorRenderProps) => React.ReactNode);
}

function Indicator({
  forceMount = false,
  children,
  ...viewProps
}: CheckboxIndicatorProps) {
  const { checked } = useCheckboxContext('Indicator');

  if (checked === false && !forceMount) {
    return null;
  }

  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      {...viewProps}
    >
      {typeof children === 'function' ? children({ checked }) : children}
    </View>
  );
}
Indicator.displayName = 'Checkbox.Indicator';

export const Checkbox = {
  Root,
  Indicator,
};
