import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Checkbox } from '../primitives/Checkbox';
import type { CheckboxHandle, CheckedState } from '../primitives/Checkbox';

function CheckboxExample({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
}: {
  checked?: CheckedState;
  defaultChecked?: CheckedState;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Checkbox.Root
      testID="checkbox"
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
    >
      <Checkbox.Indicator testID="indicator">
        <Text>✓</Text>
      </Checkbox.Indicator>
    </Checkbox.Root>
  );
}

describe('Checkbox', () => {
  it('is unchecked by default and hides the indicator', async () => {
    await render(<CheckboxExample />);

    expect(
      screen.getByTestId('checkbox').props.accessibilityState.checked
    ).toBe(false);
    expect(screen.queryByTestId('indicator')).toBeNull();
  });

  it('respects defaultChecked for uncontrolled usage', async () => {
    await render(<CheckboxExample defaultChecked />);

    expect(
      screen.getByTestId('checkbox').props.accessibilityState.checked
    ).toBe(true);
    expect(
      screen.getByTestId('indicator', { includeHiddenElements: true })
    ).toBeTruthy();
  });

  it('toggles on press and calls onCheckedChange', async () => {
    const onCheckedChange = jest.fn();
    await render(<CheckboxExample onCheckedChange={onCheckedChange} />);

    await fireEvent.press(screen.getByTestId('checkbox'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(
      screen.getByTestId('checkbox').props.accessibilityState.checked
    ).toBe(true);

    await fireEvent.press(screen.getByTestId('checkbox'));
    expect(onCheckedChange).toHaveBeenCalledWith(false);
    expect(
      screen.getByTestId('checkbox').props.accessibilityState.checked
    ).toBe(false);
  });

  it('does not toggle when disabled', async () => {
    const onCheckedChange = jest.fn();
    await render(
      <CheckboxExample disabled onCheckedChange={onCheckedChange} />
    );

    await fireEvent.press(screen.getByTestId('checkbox'));
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(
      screen.getByTestId('checkbox').props.accessibilityState.disabled
    ).toBe(true);
  });

  it('supports controlled mode via checked/onCheckedChange', async () => {
    const onCheckedChange = jest.fn();

    function Controlled() {
      const [checked, setChecked] = React.useState<CheckedState>(false);
      return (
        <CheckboxExample
          checked={checked}
          onCheckedChange={(next) => {
            onCheckedChange(next);
            setChecked(next);
          }}
        />
      );
    }

    await render(<Controlled />);

    await fireEvent.press(screen.getByTestId('checkbox'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(
      screen.getByTestId('checkbox').props.accessibilityState.checked
    ).toBe(true);
  });

  it('reports "mixed" for indeterminate and shows the indicator', async () => {
    await render(<CheckboxExample checked="indeterminate" />);

    expect(
      screen.getByTestId('checkbox').props.accessibilityState.checked
    ).toBe('mixed');
    expect(
      screen.getByTestId('indicator', { includeHiddenElements: true })
    ).toBeTruthy();
  });

  it('pressing an indeterminate checkbox transitions it to checked, not unchecked', async () => {
    const onCheckedChange = jest.fn();

    function Controlled() {
      const [checked, setChecked] =
        React.useState<CheckedState>('indeterminate');
      return (
        <CheckboxExample
          checked={checked}
          onCheckedChange={(next) => {
            onCheckedChange(next);
            setChecked(next);
          }}
        />
      );
    }

    await render(<Controlled />);

    await fireEvent.press(screen.getByTestId('checkbox'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(
      screen.getByTestId('checkbox').props.accessibilityState.checked
    ).toBe(true);
  });

  it('exposes an imperative ref API to toggle/setChecked/getChecked', async () => {
    const ref = React.createRef<CheckboxHandle>();

    await render(
      <Checkbox.Root ref={ref} testID="checkbox">
        <Checkbox.Indicator testID="indicator">
          <Text>✓</Text>
        </Checkbox.Indicator>
      </Checkbox.Root>
    );

    expect(ref.current?.getChecked()).toBe(false);

    React.act(() => {
      ref.current?.toggle();
    });
    expect(ref.current?.getChecked()).toBe(true);

    React.act(() => {
      ref.current?.setChecked('indeterminate');
    });
    expect(ref.current?.getChecked()).toBe('indeterminate');

    React.act(() => {
      ref.current?.toggle();
    });
    expect(ref.current?.getChecked()).toBe(true);
  });

  it('keeps the indicator mounted when forceMount is set, even unchecked', async () => {
    await render(
      <Checkbox.Root testID="checkbox">
        <Checkbox.Indicator testID="indicator" forceMount>
          <Text>✓</Text>
        </Checkbox.Indicator>
      </Checkbox.Root>
    );

    expect(
      screen.getByTestId('indicator', { includeHiddenElements: true })
    ).toBeTruthy();
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
        return <CheckboxExample checked={controlled ? false : undefined} />;
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
