import { StyleSheet, View, type ViewProps } from 'react-native';

export type VisuallyHiddenProps = ViewProps;

/**
 * Renders `children` off-screen and zero-size instead of not rendering them
 * at all — unlike `display: none`, assistive technology still reads them.
 * The classic use case: an icon-only button that needs a real text label
 * for screen reader users, without one showing up visually next to the icon.
 */
function VisuallyHidden({ style, ...viewProps }: VisuallyHiddenProps) {
  return (
    <View pointerEvents="none" style={[styles.hidden, style]} {...viewProps} />
  );
}
VisuallyHidden.displayName = 'VisuallyHidden';

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    opacity: 0,
  },
});

export { VisuallyHidden };
