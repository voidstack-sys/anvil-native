import React from 'react';
import { Text, View, type ViewProps } from 'react-native';

export type BadgeRenderProps = {
  count: number | undefined;
  /** `count` formatted for display (e.g. `"99+"` past `max`), or `null` in dot mode (`count` omitted). */
  displayValue: string | null;
};

export interface BadgeProps extends Omit<ViewProps, 'children'> {
  /** Numeric count to display. Omit for a plain, unlabeled "dot" badge (e.g. an unread indicator). */
  count?: number;
  /** Counts above this render as `` `${max}+` ``. Defaults to 99. */
  max?: number;
  /** Render even when `count` is exactly 0. Defaults to `false` (hidden). */
  showZero?: boolean;
  children?: React.ReactNode | ((state: BadgeRenderProps) => React.ReactNode);
}

function Badge({
  count,
  max = 99,
  showZero = false,
  children,
  ...viewProps
}: BadgeProps) {
  const shouldRender = count === undefined || count > 0 || showZero;
  if (!shouldRender) {
    return null;
  }

  const displayValue =
    count === undefined ? null : count > max ? `${max}+` : String(count);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      {...viewProps}
    >
      {typeof children === 'function'
        ? children({ count, displayValue })
        : (children ?? (displayValue !== null && <Text>{displayValue}</Text>))}
    </View>
  );
}
Badge.displayName = 'Badge';

export { Badge };
