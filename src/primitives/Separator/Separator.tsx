import { View, type ViewProps } from 'react-native';

export interface SeparatorProps extends ViewProps {
  /**
   * Purely visual, with no semantic meaning for assistive technology
   * (the common case: a line between sections). Set to `false` if the
   * separator carries real meaning that should be announced. Defaults to
   * `true`.
   */
  decorative?: boolean;
}

function Separator({ decorative = true, ...viewProps }: SeparatorProps) {
  return (
    <View
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
      {...viewProps}
    />
  );
}
Separator.displayName = 'Separator';

export { Separator };
