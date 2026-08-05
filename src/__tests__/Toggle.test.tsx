import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Toggle } from '../primitives/Toggle';
import type { ToggleHandle } from '../primitives/Toggle';

function ToggleExample({
  pressed,
  defaultPressed,
  onPressedChange,
  disabled,
}: {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Toggle.Root
      testID="toggle"
      pressed={pressed}
      defaultPressed={defaultPressed}
      onPressedChange={onPressedChange}
      disabled={disabled}
    >
      {({ pressed: isPressed }) => (
        <Text>{isPressed ? 'Bold on' : 'Bold off'}</Text>
      )}
    </Toggle.Root>
  );
}

describe('Toggle', () => {
  it('is unpressed by default', async () => {
    await render(<ToggleExample />);

    expect(screen.getByTestId('toggle').props.accessibilityState.selected).toBe(
      false
    );
  });

  it('respects defaultPressed for uncontrolled usage', async () => {
    await render(<ToggleExample defaultPressed />);

    expect(screen.getByTestId('toggle').props.accessibilityState.selected).toBe(
      true
    );
  });

  it('toggles on press and calls onPressedChange', async () => {
    const onPressedChange = jest.fn();
    await render(<ToggleExample onPressedChange={onPressedChange} />);

    await fireEvent.press(screen.getByTestId('toggle'));
    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('toggle').props.accessibilityState.selected).toBe(
      true
    );

    await fireEvent.press(screen.getByTestId('toggle'));
    expect(onPressedChange).toHaveBeenCalledWith(false);
  });

  it('does not toggle when disabled', async () => {
    const onPressedChange = jest.fn();
    await render(<ToggleExample disabled onPressedChange={onPressedChange} />);

    await fireEvent.press(screen.getByTestId('toggle'));
    expect(onPressedChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('toggle').props.accessibilityState.disabled).toBe(
      true
    );
  });

  it('supports controlled mode via pressed/onPressedChange', async () => {
    const onPressedChange = jest.fn();

    function Controlled() {
      const [pressed, setPressed] = React.useState(false);
      return (
        <ToggleExample
          pressed={pressed}
          onPressedChange={(next) => {
            onPressedChange(next);
            setPressed(next);
          }}
        />
      );
    }

    await render(<Controlled />);

    await fireEvent.press(screen.getByTestId('toggle'));
    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('toggle').props.accessibilityState.selected).toBe(
      true
    );
  });

  it('exposes an imperative ref API to toggle/setPressed/getPressed', async () => {
    const ref = React.createRef<ToggleHandle>();

    await render(
      <Toggle.Root ref={ref} testID="toggle">
        <Text>Bold</Text>
      </Toggle.Root>
    );

    expect(ref.current?.getPressed()).toBe(false);

    React.act(() => {
      ref.current?.toggle();
    });
    expect(ref.current?.getPressed()).toBe(true);

    React.act(() => {
      ref.current?.setPressed(false);
    });
    expect(ref.current?.getPressed()).toBe(false);
  });

  it('exposes the togglebutton accessibility role', async () => {
    await render(<ToggleExample />);

    expect(screen.getByTestId('toggle').props.accessibilityRole).toBe(
      'togglebutton'
    );
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
        return <ToggleExample pressed={controlled ? false : undefined} />;
      }

      const { rerender } = await render(<Wrapper controlled={false} />);
      expect(errorSpy).not.toHaveBeenCalled();

      await rerender(<Wrapper controlled />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('is changing from uncontrolled to controlled')
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('defaultPressed')
      );
    });
  });
});
