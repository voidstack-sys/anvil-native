import { useEffect, useRef } from 'react';
import { Animated, type ViewProps } from 'react-native';

export interface SkeletonProps extends Omit<ViewProps, 'children'> {
  /**
   * Pulses the opacity in a loop to signal "loading". Set to `false` for a
   * static placeholder instead -- e.g. if you check a reduced-motion
   * preference yourself. Defaults to `true`.
   */
  animate?: boolean;
}

function Skeleton({ animate = true, style, ...viewProps }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!animate) {
      opacity.setValue(0.3);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();

    return () => loop.stop();
  }, [animate, opacity]);

  return (
    <Animated.View
      // A loading placeholder carries no meaningful information for
      // assistive technology -- same rationale as Badge.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ opacity }, style]}
      {...viewProps}
    />
  );
}
Skeleton.displayName = 'Skeleton';

export { Skeleton };
