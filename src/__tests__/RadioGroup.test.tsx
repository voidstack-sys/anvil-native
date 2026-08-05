import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { RadioGroup } from '../primitives/RadioGroup';
import type { RadioGroupHandle } from '../primitives/RadioGroup';

function RadioGroupExample({
  value,
  defaultValue,
  onValueChange,
  disabled,
  bananaDisabled,
}: {
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  disabled?: boolean;
  bananaDisabled?: boolean;
}) {
  return (
    <RadioGroup.Root
      testID="group"
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <RadioGroup.Item testID="item-apple" value="apple">
        <RadioGroup.Indicator testID="indicator-apple">
          <Text>●</Text>
        </RadioGroup.Indicator>
      </RadioGroup.Item>
      <RadioGroup.Item
        testID="item-banana"
        value="banana"
        disabled={bananaDisabled}
      >
        <RadioGroup.Indicator testID="indicator-banana">
          <Text>●</Text>
        </RadioGroup.Indicator>
      </RadioGroup.Item>
    </RadioGroup.Root>
  );
}

describe('RadioGroup', () => {
  it('has no selection by default', async () => {
    await render(<RadioGroupExample />);

    expect(
      screen.getByTestId('item-apple').props.accessibilityState.checked
    ).toBe(false);
    expect(screen.queryByTestId('indicator-apple')).toBeNull();
  });

  it('respects defaultValue for uncontrolled usage', async () => {
    await render(<RadioGroupExample defaultValue="apple" />);

    expect(
      screen.getByTestId('item-apple').props.accessibilityState.checked
    ).toBe(true);
    expect(
      screen.getByTestId('indicator-apple', { includeHiddenElements: true })
    ).toBeTruthy();
  });

  it('selects an item on press and calls onValueChange', async () => {
    const onValueChange = jest.fn();
    await render(<RadioGroupExample onValueChange={onValueChange} />);

    await fireEvent.press(screen.getByTestId('item-apple'));
    expect(onValueChange).toHaveBeenCalledWith('apple');
    expect(
      screen.getByTestId('item-apple').props.accessibilityState.checked
    ).toBe(true);
  });

  it('switches selection between items, unselecting the previous one', async () => {
    const onValueChange = jest.fn();

    function Controlled() {
      const [value, setValue] = React.useState<string | null>('apple');
      return (
        <RadioGroupExample
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
        />
      );
    }

    await render(<Controlled />);

    await fireEvent.press(screen.getByTestId('item-banana'));
    expect(onValueChange).toHaveBeenCalledWith('banana');
    expect(
      screen.getByTestId('item-apple').props.accessibilityState.checked
    ).toBe(false);
    expect(
      screen.getByTestId('item-banana').props.accessibilityState.checked
    ).toBe(true);
  });

  it('pressing the already-selected item is a no-op (no deselection)', async () => {
    const onValueChange = jest.fn();
    await render(
      <RadioGroupExample defaultValue="apple" onValueChange={onValueChange} />
    );

    await fireEvent.press(screen.getByTestId('item-apple'));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(
      screen.getByTestId('item-apple').props.accessibilityState.checked
    ).toBe(true);
  });

  it('does not select a disabled item', async () => {
    const onValueChange = jest.fn();
    await render(
      <RadioGroupExample bananaDisabled onValueChange={onValueChange} />
    );

    const disabledItem = screen.getByTestId('item-banana');
    expect(disabledItem.props.accessibilityState.disabled).toBe(true);

    await fireEvent.press(disabledItem);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('root disabled disables every item regardless of its own disabled prop', async () => {
    const onValueChange = jest.fn();
    await render(<RadioGroupExample disabled onValueChange={onValueChange} />);

    expect(
      screen.getByTestId('item-apple').props.accessibilityState.disabled
    ).toBe(true);

    await fireEvent.press(screen.getByTestId('item-apple'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('exposes the radiogroup/radio accessibility roles', async () => {
    await render(<RadioGroupExample />);

    expect(screen.getByTestId('group').props.accessibilityRole).toBe(
      'radiogroup'
    );
    expect(screen.getByTestId('item-apple').props.accessibilityRole).toBe(
      'radio'
    );
  });

  it('exposes an imperative ref API to select/clear/getValue', async () => {
    const ref = React.createRef<RadioGroupHandle>();

    await render(
      <RadioGroup.Root ref={ref}>
        <RadioGroup.Item testID="item-apple" value="apple">
          <Text>Apple</Text>
        </RadioGroup.Item>
        <RadioGroup.Item testID="item-banana" value="banana">
          <Text>Banana</Text>
        </RadioGroup.Item>
      </RadioGroup.Root>
    );

    expect(ref.current?.getValue()).toBe(null);

    React.act(() => {
      ref.current?.select('banana');
    });
    expect(ref.current?.getValue()).toBe('banana');
    expect(
      screen.getByTestId('item-banana').props.accessibilityState.checked
    ).toBe(true);

    React.act(() => {
      ref.current?.clear();
    });
    expect(ref.current?.getValue()).toBe(null);
    expect(
      screen.getByTestId('item-banana').props.accessibilityState.checked
    ).toBe(false);
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
        return <RadioGroupExample value={controlled ? null : undefined} />;
      }

      const { rerender } = await render(<Wrapper controlled={false} />);
      expect(errorSpy).not.toHaveBeenCalled();

      await rerender(<Wrapper controlled />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('is changing from uncontrolled to controlled')
      );
    });

    it('warns when two sibling items share the same value', async () => {
      await render(
        <RadioGroup.Root>
          <RadioGroup.Item testID="item-1" value="dup">
            <Text>One</Text>
          </RadioGroup.Item>
          <RadioGroup.Item testID="item-2" value="dup">
            <Text>Two</Text>
          </RadioGroup.Item>
        </RadioGroup.Root>
      );

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('found more than one item with the value')
      );
    });
  });
});
