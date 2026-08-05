import * as React from 'react';
import { render, screen } from '@testing-library/react-native';
import { fireEvent } from '@testing-library/react-native';
import { Switch } from '../primitives/Switch';
import type { SwitchHandle } from '../primitives/Switch';

function SwitchExample({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
}: {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Switch.Root
      testID="switch"
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
    >
      <Switch.Thumb testID="thumb" />
    </Switch.Root>
  );
}

describe('Switch', () => {
  it('is off by default', async () => {
    await render(<SwitchExample />);

    expect(screen.getByTestId('switch').props.accessibilityState.checked).toBe(
      false
    );
  });

  it('respects defaultChecked for uncontrolled usage', async () => {
    await render(<SwitchExample defaultChecked />);

    expect(screen.getByTestId('switch').props.accessibilityState.checked).toBe(
      true
    );
  });

  it('toggles on press and calls onCheckedChange', async () => {
    const onCheckedChange = jest.fn();
    await render(<SwitchExample onCheckedChange={onCheckedChange} />);

    await fireEvent.press(screen.getByTestId('switch'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('switch').props.accessibilityState.checked).toBe(
      true
    );

    await fireEvent.press(screen.getByTestId('switch'));
    expect(onCheckedChange).toHaveBeenCalledWith(false);
    expect(screen.getByTestId('switch').props.accessibilityState.checked).toBe(
      false
    );
  });

  it('does not toggle when disabled', async () => {
    const onCheckedChange = jest.fn();
    await render(<SwitchExample disabled onCheckedChange={onCheckedChange} />);

    await fireEvent.press(screen.getByTestId('switch'));
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('switch').props.accessibilityState.disabled).toBe(
      true
    );
  });

  it('supports controlled mode via checked/onCheckedChange', async () => {
    const onCheckedChange = jest.fn();

    function Controlled() {
      const [checked, setChecked] = React.useState(false);
      return (
        <SwitchExample
          checked={checked}
          onCheckedChange={(next) => {
            onCheckedChange(next);
            setChecked(next);
          }}
        />
      );
    }

    await render(<Controlled />);

    await fireEvent.press(screen.getByTestId('switch'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('switch').props.accessibilityState.checked).toBe(
      true
    );
  });

  it('exposes an imperative ref API to toggle/setChecked/getChecked', async () => {
    const ref = React.createRef<SwitchHandle>();

    await render(
      <Switch.Root ref={ref} testID="switch">
        <Switch.Thumb testID="thumb" />
      </Switch.Root>
    );

    expect(ref.current?.getChecked()).toBe(false);

    React.act(() => {
      ref.current?.toggle();
    });
    expect(ref.current?.getChecked()).toBe(true);

    React.act(() => {
      ref.current?.setChecked(false);
    });
    expect(ref.current?.getChecked()).toBe(false);
  });

  it('exposes the switch accessibility role', async () => {
    await render(<SwitchExample />);

    expect(screen.getByTestId('switch').props.accessibilityRole).toBe('switch');
  });

  it('always renders the thumb, in both states', async () => {
    await render(<SwitchExample />);
    expect(screen.getByTestId('thumb')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('switch'));
    expect(screen.getByTestId('thumb')).toBeTruthy();
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
        return <SwitchExample checked={controlled ? false : undefined} />;
      }

      const { rerender } = await render(<Wrapper controlled={false} />);
      expect(errorSpy).not.toHaveBeenCalled();

      await rerender(<Wrapper controlled />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('is changing from uncontrolled to controlled')
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('defaultChecked')
      );
    });
  });
});
