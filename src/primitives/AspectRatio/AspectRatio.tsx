import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useWarnOnceWhen } from '../../internal/devWarnings';

export interface AspectRatioProps extends Omit<ViewProps, 'children'> {
  /** width / height. Defaults to 1 (a square). */
  ratio?: number;
  children: React.ReactNode;
}

function AspectRatio({
  ratio = 1,
  style,
  children,
  ...viewProps
}: AspectRatioProps) {
  useWarnOnceWhen(
    ratio <= 0,
    () => `AspectRatio: \`ratio\` must be greater than 0, received ${ratio}.`
  );

  return (
    <View style={[{ aspectRatio: ratio }, style]} {...viewProps}>
      {children}
    </View>
  );
}
AspectRatio.displayName = 'AspectRatio';

export { AspectRatio };
