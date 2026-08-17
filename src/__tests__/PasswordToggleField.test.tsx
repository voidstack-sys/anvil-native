import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PasswordToggleField } from '../primitives/PasswordToggleField';
import type { PasswordToggleFieldHandle } from '../primitives/PasswordToggleField';

function PasswordToggleFieldExample({
  visible,
  defaultVisible,
  onVisibleChange,
  disabled,
}: {
  visible?: boolean;
  defaultVisible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <PasswordToggleField.Root
      visible={visible}
      defaultVisible={defaultVisible}
      onVisibleChange={onVisibleChange}
      disabled={disabled}
    >
      <PasswordToggleField.Input testID="input" placeholder="Password" />
      <PasswordToggleField.Toggle testID="toggle">
        <PasswordToggleField.Icon
          visible={<Text>Hide</Text>}
          hidden={<Text>Show</Text>}
        />
      </PasswordToggleField.Toggle>
    </PasswordToggleField.Root>
  );
}

describe('PasswordToggleField', () => {
  it('starts with secureTextEntry on (password hidden) by default', async () => {
    await render(<PasswordToggleFieldExample />);

    expect(screen.getByTestId('input').props.secureTextEntry).toBe(true);
    expect(screen.getByText('Show')).toBeTruthy();
  });

  it('respects defaultVisible for uncontrolled usage', async () => {
    await render(<PasswordToggleFieldExample defaultVisible />);

    expect(screen.getByTestId('input').props.secureTextEntry).toBe(false);
    expect(screen.getByText('Hide')).toBeTruthy();
  });

  it('toggles secureTextEntry on Toggle press and calls onVisibleChange', async () => {
    const onVisibleChange = jest.fn();
    await render(
      <PasswordToggleFieldExample onVisibleChange={onVisibleChange} />
    );

    await fireEvent.press(screen.getByTestId('toggle'));
    expect(onVisibleChange).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('input').props.secureTextEntry).toBe(false);

    await fireEvent.press(screen.getByTestId('toggle'));
    expect(onVisibleChange).toHaveBeenCalledWith(false);
  });

  it('does not toggle when disabled', async () => {
    const onVisibleChange = jest.fn();
    await render(
      <PasswordToggleFieldExample disabled onVisibleChange={onVisibleChange} />
    );

    await fireEvent.press(screen.getByTestId('toggle'));
    expect(onVisibleChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('toggle').props.accessibilityState.disabled).toBe(
      true
    );
  });

  it('defaults the Toggle accessibilityLabel to Show/Hide password', async () => {
    await render(<PasswordToggleFieldExample />);

    expect(screen.getByTestId('toggle').props.accessibilityLabel).toBe(
      'Show password'
    );

    await fireEvent.press(screen.getByTestId('toggle'));
    expect(screen.getByTestId('toggle').props.accessibilityLabel).toBe(
      'Hide password'
    );
  });

  it('supports controlled mode via visible/onVisibleChange', async () => {
    const onVisibleChange = jest.fn();

    function Controlled() {
      const [visible, setVisible] = React.useState(false);
      return (
        <PasswordToggleFieldExample
          visible={visible}
          onVisibleChange={(next) => {
            onVisibleChange(next);
            setVisible(next);
          }}
        />
      );
    }

    await render(<Controlled />);

    await fireEvent.press(screen.getByTestId('toggle'));
    expect(onVisibleChange).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('input').props.secureTextEntry).toBe(false);
  });

  it('exposes an imperative ref API to toggle/setVisible/getVisible', async () => {
    const ref = React.createRef<PasswordToggleFieldHandle>();

    await render(
      <PasswordToggleField.Root ref={ref}>
        <PasswordToggleField.Input testID="input" />
      </PasswordToggleField.Root>
    );

    expect(ref.current?.getVisible()).toBe(false);

    React.act(() => {
      ref.current?.toggle();
    });
    expect(ref.current?.getVisible()).toBe(true);

    React.act(() => {
      ref.current?.setVisible(false);
    });
    expect(ref.current?.getVisible()).toBe(false);
  });

  describe('dev warnings', () => {
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
      errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    it('warns when switching between controlled and uncontrolled', async () => {
      function Wrapper({ controlled }: { controlled: boolean }) {
        return (
          <PasswordToggleFieldExample
            visible={controlled ? false : undefined}
          />
        );
      }

      const { rerender } = await render(<Wrapper controlled={false} />);
      expect(errorSpy).not.toHaveBeenCalled();

      await rerender(<Wrapper controlled />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('is changing from uncontrolled to controlled')
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('defaultVisible')
      );
    });
  });
});
