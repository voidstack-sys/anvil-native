import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Toolbar } from '../primitives/Toolbar';

describe('Toolbar', () => {
  it('exposes the toolbar accessibility role', async () => {
    await render(
      <Toolbar.Root testID="toolbar">
        <Toolbar.Button>
          <Text>Bold</Text>
        </Toolbar.Button>
      </Toolbar.Root>
    );

    expect(screen.getByTestId('toolbar').props.accessibilityRole).toBe(
      'toolbar'
    );
  });

  it('calls onPress on a button press', async () => {
    const onPress = jest.fn();
    await render(
      <Toolbar.Root>
        <Toolbar.Button testID="bold" onPress={onPress}>
          <Text>Bold</Text>
        </Toolbar.Button>
      </Toolbar.Root>
    );

    await fireEvent.press(screen.getByTestId('bold'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when the button itself is disabled', async () => {
    const onPress = jest.fn();
    await render(
      <Toolbar.Root>
        <Toolbar.Button testID="bold" disabled onPress={onPress}>
          <Text>Bold</Text>
        </Toolbar.Button>
      </Toolbar.Root>
    );

    await fireEvent.press(screen.getByTestId('bold'));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByTestId('bold').props.accessibilityState.disabled).toBe(
      true
    );
  });

  it('root disabled disables every button regardless of its own disabled prop', async () => {
    const onPress = jest.fn();
    await render(
      <Toolbar.Root testID="toolbar" disabled>
        <Toolbar.Button testID="bold" onPress={onPress}>
          <Text>Bold</Text>
        </Toolbar.Button>
      </Toolbar.Root>
    );

    expect(
      screen.getByTestId('toolbar').props.accessibilityState.disabled
    ).toBe(true);
    expect(screen.getByTestId('bold').props.accessibilityState.disabled).toBe(
      true
    );

    await fireEvent.press(screen.getByTestId('bold'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('supports a render-prop children function receiving disabled state', async () => {
    await render(
      <Toolbar.Root disabled>
        <Toolbar.Button testID="bold">
          {({ disabled }) => <Text>{disabled ? 'Bold (off)' : 'Bold'}</Text>}
        </Toolbar.Button>
      </Toolbar.Root>
    );

    expect(screen.getByText('Bold (off)')).toBeTruthy();
  });
});
