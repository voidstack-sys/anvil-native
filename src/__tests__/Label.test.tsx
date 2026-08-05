import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Label } from '../primitives/Label';

describe('Label', () => {
  it('generates a stable nativeID when none is given', async () => {
    await render(<Label testID="label">Email</Label>);

    const label = screen.getByTestId('label');
    expect(typeof label.props.nativeID).toBe('string');
    expect(label.props.nativeID.length).toBeGreaterThan(0);
  });

  it('uses a caller-provided nativeID instead of generating one', async () => {
    await render(
      <Label testID="label" nativeID="email-label">
        Email
      </Label>
    );

    expect(screen.getByTestId('label').props.nativeID).toBe('email-label');
  });

  it('exposes its id to a render-prop children function', async () => {
    let receivedId: string | undefined;
    await render(
      <Label nativeID="email-label">
        {({ id }) => {
          receivedId = id;
          return null;
        }}
      </Label>
    );

    expect(receivedId).toBe('email-label');
  });

  it('forwards onPress, so the label can activate a control with a bigger tap target', async () => {
    const onPress = jest.fn();
    await render(
      <Label testID="label" onPress={onPress}>
        Email
      </Label>
    );

    await fireEvent.press(screen.getByTestId('label'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('forwards a ref to the underlying Text', async () => {
    const ref = React.createRef<React.ComponentRef<typeof Text>>();
    await render(
      <Label ref={ref} testID="label">
        Email
      </Label>
    );

    expect(ref.current).toBeTruthy();
  });
});
