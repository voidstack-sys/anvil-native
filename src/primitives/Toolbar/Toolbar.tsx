import React, { createContext, useCallback, useContext } from 'react';
import {
  Pressable,
  View,
  type PressableProps,
  type ViewProps,
} from 'react-native';

interface ToolbarContextValue {
  disabled: boolean;
}

const ToolbarContext = createContext<ToolbarContextValue | null>(null);

function useToolbarContext(component: string): ToolbarContextValue {
  const context = useContext(ToolbarContext);
  if (!context) {
    throw new Error(`Toolbar.${component} must be used within a Toolbar.Root`);
  }
  return context;
}

export interface ToolbarRootProps extends Omit<ViewProps, 'children'> {
  /** Disables every `Toolbar.Button` inside, regardless of each one's own `disabled` prop. */
  disabled?: boolean;
  children: React.ReactNode;
}

function Root({ disabled = false, children, ...viewProps }: ToolbarRootProps) {
  return (
    <ToolbarContext.Provider value={{ disabled }}>
      <View
        accessibilityRole="toolbar"
        accessibilityState={{ disabled }}
        {...viewProps}
      >
        {children}
      </View>
    </ToolbarContext.Provider>
  );
}
Root.displayName = 'Toolbar.Root';

export type ToolbarButtonRenderProps = {
  disabled: boolean;
};

export interface ToolbarButtonProps extends Omit<
  PressableProps,
  'children' | 'disabled'
> {
  disabled?: boolean;
  children:
    React.ReactNode | ((state: ToolbarButtonRenderProps) => React.ReactNode);
}

function Button({
  disabled: buttonDisabled = false,
  onPress,
  children,
  ...pressableProps
}: ToolbarButtonProps) {
  const { disabled: groupDisabled } = useToolbarContext('Button');
  const disabled = buttonDisabled || groupDisabled;

  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      if (disabled) return;
      onPress?.(event);
    },
    [disabled, onPress]
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
      {...pressableProps}
    >
      {typeof children === 'function' ? children({ disabled }) : children}
    </Pressable>
  );
}
Button.displayName = 'Toolbar.Button';

export const Toolbar = {
  Root,
  Button,
};
