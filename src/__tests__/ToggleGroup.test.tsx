import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ToggleGroup } from '../primitives/ToggleGroup';
import type { ToggleGroupHandle } from '../primitives/ToggleGroup';

describe('ToggleGroup', () => {
  it('type="single": selects one item and deselects the previous one', async () => {
    await render(
      <ToggleGroup.Root type="single">
        <ToggleGroup.Item value="left" testID="item-left">
          <Text>Left</Text>
        </ToggleGroup.Item>
        <ToggleGroup.Item value="right" testID="item-right">
          <Text>Right</Text>
        </ToggleGroup.Item>
      </ToggleGroup.Root>
    );

    expect(screen.getByTestId('item-left').props.accessibilityState).toEqual({
      checked: false,
      disabled: false,
    });

    await fireEvent.press(screen.getByTestId('item-left'));
    expect(screen.getByTestId('item-left').props.accessibilityState).toEqual({
      checked: true,
      disabled: false,
    });
    expect(screen.getByTestId('item-right').props.accessibilityState).toEqual({
      checked: false,
      disabled: false,
    });

    await fireEvent.press(screen.getByTestId('item-right'));
    expect(screen.getByTestId('item-left').props.accessibilityState).toEqual({
      checked: false,
      disabled: false,
    });
    expect(screen.getByTestId('item-right').props.accessibilityState).toEqual({
      checked: true,
      disabled: false,
    });
  });

  it('type="single": pressing the selected item deselects it', async () => {
    await render(
      <ToggleGroup.Root type="single">
        <ToggleGroup.Item value="left" testID="item-left">
          <Text>Left</Text>
        </ToggleGroup.Item>
      </ToggleGroup.Root>
    );

    await fireEvent.press(screen.getByTestId('item-left'));
    await fireEvent.press(screen.getByTestId('item-left'));
    expect(screen.getByTestId('item-left').props.accessibilityState).toEqual({
      checked: false,
      disabled: false,
    });
  });

  it('type="multiple": allows more than one item selected at a time', async () => {
    await render(
      <ToggleGroup.Root type="multiple">
        <ToggleGroup.Item value="bold" testID="item-bold">
          <Text>Bold</Text>
        </ToggleGroup.Item>
        <ToggleGroup.Item value="italic" testID="item-italic">
          <Text>Italic</Text>
        </ToggleGroup.Item>
      </ToggleGroup.Root>
    );

    await fireEvent.press(screen.getByTestId('item-bold'));
    await fireEvent.press(screen.getByTestId('item-italic'));

    expect(
      screen.getByTestId('item-bold').props.accessibilityState.checked
    ).toBe(true);
    expect(
      screen.getByTestId('item-italic').props.accessibilityState.checked
    ).toBe(true);
  });

  it('supports controlled mode via value/onValueChange', async () => {
    const onValueChange = jest.fn();

    function Controlled() {
      const [value, setValue] = React.useState<string | null>(null);
      return (
        <ToggleGroup.Root
          type="single"
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
        >
          <ToggleGroup.Item value="left" testID="item-left">
            <Text>Left</Text>
          </ToggleGroup.Item>
        </ToggleGroup.Root>
      );
    }

    await render(<Controlled />);

    await fireEvent.press(screen.getByTestId('item-left'));
    expect(onValueChange).toHaveBeenCalledWith('left');
    expect(
      screen.getByTestId('item-left').props.accessibilityState.checked
    ).toBe(true);
  });

  it('does not toggle a disabled item', async () => {
    await render(
      <ToggleGroup.Root type="single">
        <ToggleGroup.Item value="left" testID="item-left" disabled>
          <Text>Left</Text>
        </ToggleGroup.Item>
      </ToggleGroup.Root>
    );

    await fireEvent.press(screen.getByTestId('item-left'));
    expect(
      screen.getByTestId('item-left').props.accessibilityState.checked
    ).toBe(false);
  });

  it('uses radio/checkbox roles depending on type', async () => {
    await render(
      <>
        <ToggleGroup.Root type="single">
          <ToggleGroup.Item value="left" testID="single-item">
            <Text>Left</Text>
          </ToggleGroup.Item>
        </ToggleGroup.Root>
        <ToggleGroup.Root type="multiple">
          <ToggleGroup.Item value="bold" testID="multiple-item">
            <Text>Bold</Text>
          </ToggleGroup.Item>
        </ToggleGroup.Root>
      </>
    );

    expect(screen.getByTestId('single-item').props.accessibilityRole).toBe(
      'radio'
    );
    expect(screen.getByTestId('multiple-item').props.accessibilityRole).toBe(
      'checkbox'
    );
  });

  it('root disabled disables every item regardless of its own disabled prop', async () => {
    await render(
      <ToggleGroup.Root type="single" disabled>
        <ToggleGroup.Item value="left" testID="item-left">
          <Text>Left</Text>
        </ToggleGroup.Item>
      </ToggleGroup.Root>
    );

    const item = screen.getByTestId('item-left');
    expect(item.props.accessibilityState.disabled).toBe(true);

    await fireEvent.press(item);
    expect(
      screen.getByTestId('item-left').props.accessibilityState.checked
    ).toBe(false);
  });

  it('exposes an imperative ref API to select/deselect/toggle items', async () => {
    const ref = React.createRef<ToggleGroupHandle>();

    await render(
      <ToggleGroup.Root type="multiple" ref={ref}>
        <ToggleGroup.Item value="bold" testID="item-bold">
          <Text>Bold</Text>
        </ToggleGroup.Item>
        <ToggleGroup.Item value="italic" testID="item-italic">
          <Text>Italic</Text>
        </ToggleGroup.Item>
      </ToggleGroup.Root>
    );

    expect(ref.current?.getValue()).toEqual([]);

    React.act(() => {
      ref.current?.select('bold');
    });
    expect(ref.current?.getValue()).toEqual(['bold']);
    expect(
      screen.getByTestId('item-bold').props.accessibilityState.checked
    ).toBe(true);

    React.act(() => {
      ref.current?.select('italic');
    });
    expect(ref.current?.getValue()).toEqual(['bold', 'italic']);

    React.act(() => {
      ref.current?.deselect('bold');
    });
    expect(ref.current?.getValue()).toEqual(['italic']);

    React.act(() => {
      ref.current?.toggle('italic');
    });
    expect(ref.current?.getValue()).toEqual([]);
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
          <ToggleGroup.Root type="single" value={controlled ? null : undefined}>
            <ToggleGroup.Item value="left" testID="item-left">
              <Text>Left</Text>
            </ToggleGroup.Item>
          </ToggleGroup.Root>
        );
      }

      const { rerender } = await render(<Wrapper controlled={false} />);
      expect(errorSpy).not.toHaveBeenCalled();

      await rerender(<Wrapper controlled />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('is changing from uncontrolled to controlled')
      );
    });

    it('warns when the `type` prop changes after the initial render', async () => {
      function Wrapper({ type }: { type: 'single' | 'multiple' }) {
        return (
          <ToggleGroup.Root type={type}>
            <ToggleGroup.Item value="left" testID="item-left">
              <Text>Left</Text>
            </ToggleGroup.Item>
          </ToggleGroup.Root>
        );
      }

      const { rerender } = await render(<Wrapper type="single" />);
      expect(errorSpy).not.toHaveBeenCalled();

      await rerender(<Wrapper type="multiple" />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'the `type` prop changed from "single" to "multiple"'
        )
      );
    });

    it('warns when two items share the same value', async () => {
      await render(
        <ToggleGroup.Root type="single">
          <ToggleGroup.Item value="left" testID="item-a">
            <Text>Left</Text>
          </ToggleGroup.Item>
          <ToggleGroup.Item value="left" testID="item-b">
            <Text>Left duplicate</Text>
          </ToggleGroup.Item>
        </ToggleGroup.Root>
      );

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'found more than one item with the value "left"'
        )
      );
    });
  });
});
