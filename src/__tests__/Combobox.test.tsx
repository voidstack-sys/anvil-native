import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Combobox } from '../primitives/Combobox';
import type { ComboboxHandle } from '../primitives/Combobox';

const FRUITS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

function ComboboxExample({
  value,
  onValueChange,
  query,
  onQueryChange,
  open,
  onOpenChange,
  disabled,
}: {
  value?: string | null;
  onValueChange?: (value: string | null) => void;
  query?: string;
  onQueryChange?: (query: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
}) {
  const activeQuery = query ?? '';
  const filtered = FRUITS.filter((fruit) =>
    fruit.label.toLowerCase().includes(activeQuery.toLowerCase())
  );

  return (
    <Combobox.Root
      value={value}
      onValueChange={onValueChange}
      query={query}
      onQueryChange={onQueryChange}
      open={open}
      onOpenChange={onOpenChange}
      disabled={disabled}
    >
      <Combobox.Input testID="input" />
      <Combobox.Content testID="content">
        {filtered.map((fruit) => (
          <Combobox.Item
            key={fruit.value}
            value={fruit.value}
            testID={`item-${fruit.value}`}
          >
            <Combobox.ItemText>{fruit.label}</Combobox.ItemText>
          </Combobox.Item>
        ))}
      </Combobox.Content>
    </Combobox.Root>
  );
}

describe('Combobox', () => {
  it('does not render content until opened', async () => {
    await render(<ComboboxExample />);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('opens on input focus', async () => {
    await render(<ComboboxExample />);

    await fireEvent(screen.getByTestId('input'), 'focus');
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('does not open on focus when disabled', async () => {
    await render(<ComboboxExample disabled />);

    await fireEvent(screen.getByTestId('input'), 'focus');
    expect(screen.queryByTestId('content')).toBeNull();
    expect(screen.getByTestId('input').props.editable).toBe(false);
  });

  it('filters the rendered items as the consumer narrows them by query', async () => {
    function Controlled() {
      const [query, setQuery] = React.useState('');
      return <ComboboxExample query={query} onQueryChange={setQuery} />;
    }

    await render(<Controlled />);
    await fireEvent(screen.getByTestId('input'), 'focus');
    expect(screen.getByTestId('item-apple')).toBeTruthy();
    expect(screen.getByTestId('item-banana')).toBeTruthy();

    await fireEvent.changeText(screen.getByTestId('input'), 'ban');

    expect(screen.queryByTestId('item-apple')).toBeNull();
    expect(screen.getByTestId('item-banana')).toBeTruthy();
  });

  it('selecting an item sets the value and fills the query with its label', async () => {
    const onValueChange = jest.fn();

    function Controlled() {
      const [value, setValue] = React.useState<string | null>(null);
      const [query, setQuery] = React.useState('');
      return (
        <ComboboxExample
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
          query={query}
          onQueryChange={setQuery}
        />
      );
    }

    await render(<Controlled />);
    await fireEvent(screen.getByTestId('input'), 'focus');
    await fireEvent.press(screen.getByTestId('item-cherry'));

    expect(onValueChange).toHaveBeenCalledWith('cherry');
    expect(screen.getByTestId('input').props.value).toBe('Cherry');
    // Closes by default after selection.
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('stays closed even if closing the popover Modal spuriously refocuses Input', async () => {
    // Regression test: on web, closing the popover's Modal returns focus to
    // Input (standard modal a11y behavior), which fires a real 'focus'
    // event. Input.onFocus reopens on focus, so without the fix this
    // immediately re-opens the popover right after selection closed it.
    function Controlled() {
      const [value, setValue] = React.useState<string | null>(null);
      const [query, setQuery] = React.useState('');
      return (
        <ComboboxExample
          value={value}
          onValueChange={setValue}
          query={query}
          onQueryChange={setQuery}
        />
      );
    }

    await render(<Controlled />);
    await fireEvent(screen.getByTestId('input'), 'focus');
    await fireEvent.press(screen.getByTestId('item-cherry'));
    expect(screen.queryByTestId('content')).toBeNull();

    // Simulates the Modal-close-driven refocus a real browser fires.
    await fireEvent(screen.getByTestId('input'), 'focus');
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('does not close after selection when closeOnSelect is false', async () => {
    function Controlled() {
      const [value, setValue] = React.useState<string | null>(null);
      return (
        <Combobox.Root value={value} onValueChange={setValue}>
          <Combobox.Input testID="input" />
          <Combobox.Content testID="content">
            <Combobox.Item
              value="apple"
              closeOnSelect={false}
              testID="item-apple"
            >
              <Combobox.ItemText>Apple</Combobox.ItemText>
            </Combobox.Item>
          </Combobox.Content>
        </Combobox.Root>
      );
    }

    await render(<Controlled />);
    await fireEvent(screen.getByTestId('input'), 'focus');
    await fireEvent.press(screen.getByTestId('item-apple'));
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('exposes an imperative ref API to open/close/value/query getters and setters', async () => {
    const ref = React.createRef<ComboboxHandle>();

    await render(
      <Combobox.Root ref={ref}>
        <Combobox.Input testID="input" />
        <Combobox.Content testID="content">
          <Combobox.Item value="apple" testID="item-apple">
            <Combobox.ItemText>Apple</Combobox.ItemText>
          </Combobox.Item>
        </Combobox.Content>
      </Combobox.Root>
    );

    expect(ref.current?.isOpen()).toBe(false);
    expect(ref.current?.getValue()).toBeNull();
    expect(ref.current?.getQuery()).toBe('');

    React.act(() => {
      ref.current?.open();
    });
    expect(ref.current?.isOpen()).toBe(true);

    React.act(() => {
      ref.current?.setValue('apple');
      ref.current?.setQuery('Apple');
    });
    expect(ref.current?.getValue()).toBe('apple');
    expect(ref.current?.getQuery()).toBe('Apple');

    React.act(() => {
      ref.current?.close();
    });
    expect(ref.current?.isOpen()).toBe(false);
  });

  describe('dev warnings', () => {
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
      errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    it('warns when switching value between controlled and uncontrolled', async () => {
      function Wrapper({ controlled }: { controlled: boolean }) {
        return <ComboboxExample value={controlled ? 'apple' : undefined} />;
      }

      const { rerender } = await render(<Wrapper controlled={false} />);
      expect(errorSpy).not.toHaveBeenCalled();

      await rerender(<Wrapper controlled />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('is changing from uncontrolled to controlled')
      );
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('`value`'));
    });

    it('warns when switching query between controlled and uncontrolled', async () => {
      function Wrapper({ controlled }: { controlled: boolean }) {
        return <ComboboxExample query={controlled ? 'a' : undefined} />;
      }

      const { rerender } = await render(<Wrapper controlled={false} />);
      expect(errorSpy).not.toHaveBeenCalled();

      await rerender(<Wrapper controlled />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('is changing from uncontrolled to controlled')
      );
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('`query`'));
    });
  });
});
