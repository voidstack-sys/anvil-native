import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Accordion } from '../primitives/Accordion';

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
});
