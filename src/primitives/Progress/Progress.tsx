import React, { createContext, useContext, useMemo } from 'react';
import { View, type ViewProps } from 'react-native';
import { useWarnOnceWhen } from '../../internal/devWarnings';

interface ProgressContextValue {
  value: number | null;
  max: number;
  percentage: number | null;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

function useProgressContext(component: string): ProgressContextValue {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error(
      `Progress.${component} must be used within a Progress.Root`
    );
  }
  return context;
}

function defaultGetValueLabel(value: number, max: number): string {
  return `${Math.round((value / max) * 100)}%`;
}

export interface ProgressRootProps extends Omit<ViewProps, 'children'> {
  /** The current progress, or `null` for an indeterminate (loading, unknown duration) progress bar. */
  value: number | null;
  /** The value that represents 100%. Defaults to 100. */
  max?: number;
  /** Builds the accessibility value text announced by screen readers. Defaults to a rounded percentage. */
  getValueLabel?: (value: number, max: number) => string;
  children?:
    | React.ReactNode
    | ((state: ProgressIndicatorRenderProps) => React.ReactNode);
}

const Root = function ProgressRoot({
  value,
  max = 100,
  getValueLabel = defaultGetValueLabel,
  children,
  ...viewProps
}: ProgressRootProps) {
  useWarnOnceWhen(
    max <= 0,
    () => `Progress.Root: \`max\` must be greater than 0, received ${max}.`
  );
  useWarnOnceWhen(
    value !== null && (value < 0 || value > max),
    () =>
      `Progress.Root: \`value\` (${value}) is outside the valid range of 0 to \`max\` (${max}).`
  );

  const percentage =
    value === null ? null : Math.min(100, Math.max(0, (value / max) * 100));

  const contextValue = useMemo(
    () => ({ value, max, percentage }),
    [value, max, percentage]
  );

  return (
    <ProgressContext.Provider value={contextValue}>
      <View
        accessibilityRole="progressbar"
        accessibilityValue={
          value === null
            ? { min: 0, max }
            : { min: 0, max, now: value, text: getValueLabel(value, max) }
        }
        accessibilityState={{ busy: value === null }}
        {...viewProps}
      >
        {typeof children === 'function'
          ? children({ value, max, percentage, complete: value === max })
          : children}
      </View>
    </ProgressContext.Provider>
  );
};
Root.displayName = 'Progress.Root';

export type ProgressIndicatorRenderProps = {
  value: number | null;
  max: number;
  /** `value` expressed as 0-100, or `null` while indeterminate. */
  percentage: number | null;
  complete: boolean;
};

export interface ProgressIndicatorProps extends Omit<ViewProps, 'children'> {
  children?:
    | React.ReactNode
    | ((state: ProgressIndicatorRenderProps) => React.ReactNode);
}

function Indicator({ children, ...viewProps }: ProgressIndicatorProps) {
  const { value, max, percentage } = useProgressContext('Indicator');

  return (
    <View {...viewProps}>
      {typeof children === 'function'
        ? children({ value, max, percentage, complete: value === max })
        : children}
    </View>
  );
}
Indicator.displayName = 'Progress.Indicator';

export const Progress = {
  Root,
  Indicator,
};
