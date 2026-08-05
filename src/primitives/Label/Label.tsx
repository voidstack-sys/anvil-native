import React, { forwardRef, useId } from 'react';
import { Text, type TextProps } from 'react-native';

type TextRef = React.ComponentRef<typeof Text>;

export type LabelRenderProps = {
  /** The `nativeID` this label was given (your own, or a generated one) — pass it to your control's `accessibilityLabelledBy`. */
  id: string;
};

export interface LabelProps extends Omit<TextProps, 'children'> {
  children: React.ReactNode | ((state: LabelRenderProps) => React.ReactNode);
}

/**
 * React Native has no `<label for>` equivalent that links a label to a
 * control purely by markup — the OS-level connection (`accessibilityLabelledBy`)
 * has to be set on the control itself. `Label` gives you a stable id to pass
 * there, plus a pressable `Text` you can wire an `onPress` onto (e.g.
 * `() => controlRef.current?.toggle()`) for a bigger, more forgiving tap
 * target than the control alone — the same job `Dialog.Title` already does
 * internally, made reusable for your own compositions.
 */
const Label = forwardRef<TextRef, LabelProps>(function LabelImpl(
  { children, nativeID, ...textProps },
  ref
) {
  const generatedId = useId();
  const id = nativeID ?? generatedId;

  return (
    <Text ref={ref} nativeID={id} {...textProps}>
      {typeof children === 'function' ? children({ id }) : children}
    </Text>
  );
});
Label.displayName = 'Label';

export { Label };
