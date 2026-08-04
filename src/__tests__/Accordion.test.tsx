import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Accordion } from '../primitives/Accordion';
import type { AccordionHandle } from '../primitives/Accordion';

function Item({ value, label }: { value: string; label: string }) {
  return (
    <Accordion.Item value={value}>
      <Accordion.Trigger testID={`trigger-${value}`}>
        <Text>{label}</Text>
      </Accordion.Trigger>
      <Accordion.Content testID={`content-${value}`}>
        <Text>{`content for ${label}`}</Text>
      </Accordion.Content>
    </Accordion.Item>
  );
}

describe('Accordion', () => {
  it('type="single": expands one item and closes the previous one', async () => {
    await render(
      <Accordion.Root type="single">
        <Item value="a" label="A" />
        <Item value="b" label="B" />
      </Accordion.Root>
    );

    expect(screen.queryByTestId('content-a')).toBeNull();
    expect(screen.queryByTestId('content-b')).toBeNull();

    await fireEvent.press(screen.getByTestId('trigger-a'));
    expect(screen.getByTestId('content-a')).toBeTruthy();
    expect(screen.queryByTestId('content-b')).toBeNull();

    await fireEvent.press(screen.getByTestId('trigger-b'));
    expect(screen.queryByTestId('content-a')).toBeNull();
    expect(screen.getByTestId('content-b')).toBeTruthy();
  });

  it('type="single": collapsible (default) allows closing the open item', async () => {
    await render(
      <Accordion.Root type="single">
        <Item value="a" label="A" />
      </Accordion.Root>
    );

    await fireEvent.press(screen.getByTestId('trigger-a'));
    expect(screen.getByTestId('content-a')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('trigger-a'));
    expect(screen.queryByTestId('content-a')).toBeNull();
  });

  it('type="single": collapsible={false} keeps the item open on re-press', async () => {
    await render(
      <Accordion.Root type="single" collapsible={false}>
        <Item value="a" label="A" />
      </Accordion.Root>
    );

    await fireEvent.press(screen.getByTestId('trigger-a'));
    await fireEvent.press(screen.getByTestId('trigger-a'));
    expect(screen.getByTestId('content-a')).toBeTruthy();
  });

  it('type="multiple": allows more than one item open at a time', async () => {
    await render(
      <Accordion.Root type="multiple">
        <Item value="a" label="A" />
        <Item value="b" label="B" />
      </Accordion.Root>
    );

    await fireEvent.press(screen.getByTestId('trigger-a'));
    await fireEvent.press(screen.getByTestId('trigger-b'));

    expect(screen.getByTestId('content-a')).toBeTruthy();
    expect(screen.getByTestId('content-b')).toBeTruthy();
  });

  it('supports controlled mode via value/onValueChange', async () => {
    const onValueChange = jest.fn();

    function Controlled() {
      const [value, setValue] = React.useState<string | null>(null);
      return (
        <Accordion.Root
          type="single"
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
        >
          <Item value="a" label="A" />
        </Accordion.Root>
      );
    }

    await render(<Controlled />);

    await fireEvent.press(screen.getByTestId('trigger-a'));
    expect(onValueChange).toHaveBeenCalledWith('a');
    expect(screen.getByTestId('content-a')).toBeTruthy();
  });

  it('does not toggle a disabled item', async () => {
    await render(
      <Accordion.Root type="single">
        <Accordion.Item value="a" disabled>
          <Accordion.Trigger testID="trigger-a">
            <Text>A</Text>
          </Accordion.Trigger>
          <Accordion.Content testID="content-a">
            <Text>content</Text>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    );

    await fireEvent.press(screen.getByTestId('trigger-a'));
    expect(screen.queryByTestId('content-a')).toBeNull();
  });

  it('exposes accessibilityState.expanded on the trigger', async () => {
    await render(
      <Accordion.Root type="single">
        <Item value="a" label="A" />
      </Accordion.Root>
    );

    const trigger = screen.getByTestId('trigger-a');
    expect(trigger.props.accessibilityState).toEqual({
      expanded: false,
      disabled: false,
    });

    await fireEvent.press(trigger);
    expect(screen.getByTestId('trigger-a').props.accessibilityState).toEqual({
      expanded: true,
      disabled: false,
    });
  });

  it('root disabled disables every item regardless of its own disabled prop', async () => {
    await render(
      <Accordion.Root type="single" disabled>
        <Item value="a" label="A" />
      </Accordion.Root>
    );

    const trigger = screen.getByTestId('trigger-a');
    expect(trigger.props.accessibilityState.disabled).toBe(true);

    await fireEvent.press(trigger);
    expect(screen.queryByTestId('content-a')).toBeNull();
  });

  it('exposes an imperative ref API to open/close/toggle items', async () => {
    const ref = React.createRef<AccordionHandle>();

    await render(
      <Accordion.Root type="single" ref={ref}>
        <Item value="a" label="A" />
        <Item value="b" label="B" />
      </Accordion.Root>
    );

    expect(ref.current?.getValue()).toEqual([]);

    React.act(() => {
      ref.current?.open('a');
    });
    expect(screen.getByTestId('content-a')).toBeTruthy();
    expect(ref.current?.getValue()).toEqual(['a']);

    React.act(() => {
      ref.current?.open('b');
    });
    expect(screen.queryByTestId('content-a')).toBeNull();
    expect(screen.getByTestId('content-b')).toBeTruthy();

    React.act(() => {
      ref.current?.close('b');
    });
    expect(screen.queryByTestId('content-b')).toBeNull();

    React.act(() => {
      ref.current?.toggle('a');
    });
    expect(screen.getByTestId('content-a')).toBeTruthy();
  });

  it('the ref API reports through onValueChange in controlled mode without changing state itself', async () => {
    const onValueChange = jest.fn();
    const ref = React.createRef<AccordionHandle>();

    await render(
      <Accordion.Root
        type="single"
        value={null}
        onValueChange={onValueChange}
        ref={ref}
      >
        <Item value="a" label="A" />
      </Accordion.Root>
    );

    React.act(() => {
      ref.current?.open('a');
    });

    expect(onValueChange).toHaveBeenCalledWith('a');
    // Controlled: the prop (`value={null}`) didn't change, so the UI shouldn't either.
    expect(screen.queryByTestId('content-a')).toBeNull();
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
          <Accordion.Root type="single" value={controlled ? null : undefined}>
            <Item value="a" label="A" />
          </Accordion.Root>
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
          <Accordion.Root type={type}>
            <Item value="a" label="A" />
          </Accordion.Root>
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
        <Accordion.Root type="single">
          <Item value="a" label="A" />
          <Item value="a" label="A duplicate" />
        </Accordion.Root>
      );

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('found more than one item with the value "a"')
      );
    });
  });
});
