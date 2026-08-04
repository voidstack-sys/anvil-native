import * as React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Select } from '../primitives/Select';
import type { SelectHandle } from '../primitives/Select';

function SelectExample({
  defaultOpen,
  open,
  onOpenChange,
  value,
  defaultValue,
  onValueChange,
  disabled,
  triggerDisabled,
  bananaCloseOnSelect,
}: {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  disabled?: boolean;
  triggerDisabled?: boolean;
  bananaCloseOnSelect?: boolean;
}) {
  return (
    <Select.Root
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <Select.Trigger testID="trigger" disabled={triggerDisabled}>
        <Select.Value testID="value" placeholder="Select a fruit" />
      </Select.Trigger>
      <Select.Content testID="content">
        <Select.Label testID="label">Fruits</Select.Label>
        <Select.Item testID="item-apple" value="apple">
          <Select.ItemText>Apple</Select.ItemText>
        </Select.Item>
        <Select.Separator testID="separator" />
        <Select.Item
          testID="item-banana"
          value="banana"
          closeOnSelect={bananaCloseOnSelect}
        >
          <Select.ItemText>Banana</Select.ItemText>
        </Select.Item>
        <Select.Item testID="item-cherry" value="cherry" disabled>
          <Select.ItemText>Cherry</Select.ItemText>
        </Select.Item>
      </Select.Content>
    </Select.Root>
  );
}

describe('Select', () => {
  it('does not render content until opened', async () => {
    await render(<SelectExample />);
    expect(screen.queryByTestId('item-apple')).toBeNull();
  });

  it('shows the placeholder when nothing is selected', async () => {
    await render(<SelectExample />);
    expect(screen.getByTestId('value').props.children).toBe('Select a fruit');
  });

  it('respects defaultOpen for uncontrolled usage', async () => {
    await render(<SelectExample defaultOpen />);
    expect(screen.getByTestId('item-apple')).toBeTruthy();
  });

  it('opens on trigger press', async () => {
    await render(<SelectExample />);

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.getByTestId('item-apple')).toBeTruthy();
  });

  it('selecting an item updates the value shown by Select.Value and closes by default', async () => {
    const onValueChange = jest.fn();

    function Controlled() {
      const [value, setValue] = React.useState<string | null>(null);
      return (
        <SelectExample
          defaultOpen
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
        />
      );
    }

    await render(<Controlled />);

    await fireEvent.press(screen.getByTestId('item-apple'));
    expect(onValueChange).toHaveBeenCalledWith('apple');
    expect(screen.getByTestId('value').props.children).toBe('Apple');
    expect(screen.queryByTestId('item-apple')).toBeNull();
  });

  it('closeOnSelect={false} keeps the select open after selecting', async () => {
    const onValueChange = jest.fn();
    await render(
      <SelectExample
        defaultOpen
        onValueChange={onValueChange}
        bananaCloseOnSelect={false}
      />
    );

    await fireEvent.press(screen.getByTestId('item-banana'));
    expect(onValueChange).toHaveBeenCalledWith('banana');
    expect(screen.getByTestId('item-banana')).toBeTruthy();
  });

  it('does not select a disabled item', async () => {
    const onValueChange = jest.fn();
    await render(<SelectExample defaultOpen onValueChange={onValueChange} />);

    const disabledItem = screen.getByTestId('item-cherry');
    expect(disabledItem.props.accessibilityState.disabled).toBe(true);

    await fireEvent.press(disabledItem);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('item-cherry')).toBeTruthy();
  });

  it('marks the selected item via accessibilityState.selected', async () => {
    await render(<SelectExample defaultOpen defaultValue="apple" />);

    expect(
      screen.getByTestId('item-apple').props.accessibilityState.selected
    ).toBe(true);
    expect(
      screen.getByTestId('item-banana').props.accessibilityState.selected
    ).toBe(false);
  });

  it('closes when the backdrop is pressed', async () => {
    await render(<SelectExample defaultOpen />);

    const backdrop = screen.getByTestId('anvil-select-backdrop', {
      includeHiddenElements: true,
    });
    expect(backdrop.props.accessibilityRole).toBe('button');

    await fireEvent.press(backdrop);
    expect(screen.queryByTestId('item-apple')).toBeNull();
  });

  it('does not open when the trigger is disabled', async () => {
    await render(<SelectExample triggerDisabled />);

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.queryByTestId('item-apple')).toBeNull();
    expect(
      screen.getByTestId('trigger').props.accessibilityState.disabled
    ).toBe(true);
  });

  it('root disabled disables the trigger regardless of its own disabled prop', async () => {
    await render(<SelectExample disabled />);

    expect(
      screen.getByTestId('trigger').props.accessibilityState.disabled
    ).toBe(true);

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.queryByTestId('item-apple')).toBeNull();
  });

  it('supports controlled open via open/onOpenChange', async () => {
    const onOpenChange = jest.fn();

    function Controlled() {
      const [open, setOpen] = React.useState(false);
      return (
        <SelectExample
          open={open}
          onOpenChange={(next) => {
            onOpenChange(next);
            setOpen(next);
          }}
        />
      );
    }

    await render(<Controlled />);

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('item-apple')).toBeTruthy();
  });

  it('exposes an imperative ref API to open/close/toggle/isOpen/getValue/setValue', async () => {
    const ref = React.createRef<SelectHandle>();

    await render(
      <Select.Root ref={ref} defaultValue="apple">
        <Select.Trigger testID="trigger">
          <Select.Value testID="value" placeholder="Select a fruit" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item testID="item-apple" value="apple">
            <Select.ItemText>Apple</Select.ItemText>
          </Select.Item>
          <Select.Item testID="item-banana" value="banana">
            <Select.ItemText>Banana</Select.ItemText>
          </Select.Item>
        </Select.Content>
      </Select.Root>
    );

    expect(ref.current?.isOpen()).toBe(false);
    expect(ref.current?.getValue()).toBe('apple');

    React.act(() => {
      ref.current?.open();
    });
    expect(ref.current?.isOpen()).toBe(true);
    expect(screen.getByTestId('item-apple')).toBeTruthy();

    React.act(() => {
      ref.current?.setValue('banana');
    });
    expect(ref.current?.getValue()).toBe('banana');

    React.act(() => {
      ref.current?.toggle();
    });
    expect(ref.current?.isOpen()).toBe(false);

    React.act(() => {
      ref.current?.close();
    });
    expect(ref.current?.isOpen()).toBe(false);
  });

  it('exposes the combobox accessibility role on the trigger', async () => {
    await render(<SelectExample />);

    expect(screen.getByTestId('trigger').props.accessibilityRole).toBe(
      'combobox'
    );
  });

  it('becomes visible once its own layout is measured via onLayout', async () => {
    // Regression test mirroring the Menu bug found by manual testing: Content
    // must call `setContentSize` from `onLayout`, or the content stays
    // mounted-but-invisible (opacity 0) forever even though every other
    // assertion (querying by testID, pressing items) still passes.
    //
    // No Select.Trigger is rendered on purpose: with no trigger to measure,
    // Content's anchor-measurement effect takes its synchronous fallback
    // path instead of the real (async, native-backed) `measureInWindow`,
    // which never resolves in this JS-only test environment.
    await render(
      <Select.Root defaultOpen>
        <Select.Content testID="content">
          <Select.Item value="apple">
            <Select.ItemText>Apple</Select.ItemText>
          </Select.Item>
        </Select.Content>
      </Select.Root>
    );

    const content = screen.getByTestId('content');
    expect(content.props.accessibilityRole).toBe('list');
    expect(StyleSheet.flatten(content.props.style).opacity).toBe(0);

    await fireEvent(content, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 180, height: 175 } },
    });

    expect(
      StyleSheet.flatten(screen.getByTestId('content').props.style).opacity
    ).toBe(1);
  });

  describe('dev warnings', () => {
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
      errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    it('warns when switching between controlled and uncontrolled value', async () => {
      function Wrapper({ controlled }: { controlled: boolean }) {
        return <SelectExample value={controlled ? null : undefined} />;
      }

      const { rerender } = await render(<Wrapper controlled={false} />);
      expect(errorSpy).not.toHaveBeenCalled();

      await rerender(<Wrapper controlled />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('is changing from uncontrolled to controlled')
      );
    });

    it('warns when switching between controlled and uncontrolled open', async () => {
      function Wrapper({ controlled }: { controlled: boolean }) {
        return <SelectExample open={controlled ? false : undefined} />;
      }

      const { rerender } = await render(<Wrapper controlled={false} />);
      expect(errorSpy).not.toHaveBeenCalled();

      await rerender(<Wrapper controlled />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('is changing from uncontrolled to controlled')
      );
    });

    it('warns when an item has more than one sibling sharing the same value', async () => {
      await render(
        <Select.Root defaultOpen>
          <Select.Content>
            <Select.Item testID="item-1" value="dup">
              <Select.ItemText>One</Select.ItemText>
            </Select.Item>
            <Select.Item testID="item-2" value="dup">
              <Select.ItemText>Two</Select.ItemText>
            </Select.Item>
          </Select.Content>
        </Select.Root>
      );

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('found more than one item with the value')
      );
    });

    it('warns when Select.ItemText does not receive a plain string child', async () => {
      await render(
        <Select.Root defaultOpen>
          <Select.Content>
            <Select.Item value="apple">
              <Select.ItemText>{123 as unknown as string}</Select.ItemText>
            </Select.Item>
          </Select.Content>
        </Select.Root>
      );

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('expected a plain string child')
      );
    });
  });
});
