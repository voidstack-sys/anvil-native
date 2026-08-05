import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Collapsible } from '../primitives/Collapsible';
import type { CollapsibleHandle } from '../primitives/Collapsible';

function CollapsibleExample({
  defaultOpen,
  open,
  onOpenChange,
  disabled,
  triggerDisabled,
}: {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  triggerDisabled?: boolean;
}) {
  return (
    <Collapsible.Root
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      disabled={disabled}
    >
      <Collapsible.Trigger testID="trigger" disabled={triggerDisabled}>
        <Text>Show more</Text>
      </Collapsible.Trigger>
      <Collapsible.Content testID="content">
        <Text>Extra details</Text>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

describe('Collapsible', () => {
  it('does not render content until opened', async () => {
    await render(<CollapsibleExample />);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('respects defaultOpen for uncontrolled usage', async () => {
    await render(<CollapsibleExample defaultOpen />);
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('toggles on trigger press', async () => {
    await render(<CollapsibleExample />);

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.getByTestId('content')).toBeTruthy();
    expect(
      screen.getByTestId('trigger').props.accessibilityState.expanded
    ).toBe(true);

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('does not toggle when the trigger is disabled', async () => {
    await render(<CollapsibleExample triggerDisabled />);

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('root disabled disables the trigger regardless of its own disabled prop', async () => {
    await render(<CollapsibleExample disabled />);

    expect(
      screen.getByTestId('trigger').props.accessibilityState.disabled
    ).toBe(true);

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('keeps content mounted but hidden from accessibility when forceMount is set and closed', async () => {
    await render(
      <Collapsible.Root>
        <Collapsible.Trigger testID="trigger">
          <Text>Show more</Text>
        </Collapsible.Trigger>
        <Collapsible.Content testID="content" forceMount>
          <Text>Extra details</Text>
        </Collapsible.Content>
      </Collapsible.Root>
    );

    const content = screen.getByTestId('content', {
      includeHiddenElements: true,
    });
    expect(content.props.accessibilityElementsHidden).toBe(true);
  });

  it('supports controlled mode via open/onOpenChange', async () => {
    const onOpenChange = jest.fn();

    function Controlled() {
      const [open, setOpen] = React.useState(false);
      return (
        <CollapsibleExample
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
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('exposes an imperative ref API to open/close/toggle/isOpen', async () => {
    const ref = React.createRef<CollapsibleHandle>();

    await render(
      <Collapsible.Root ref={ref}>
        <Collapsible.Trigger testID="trigger">
          <Text>Show more</Text>
        </Collapsible.Trigger>
        <Collapsible.Content testID="content">
          <Text>Extra details</Text>
        </Collapsible.Content>
      </Collapsible.Root>
    );

    expect(ref.current?.isOpen()).toBe(false);

    React.act(() => {
      ref.current?.open();
    });
    expect(ref.current?.isOpen()).toBe(true);
    expect(screen.getByTestId('content')).toBeTruthy();

    React.act(() => {
      ref.current?.toggle();
    });
    expect(ref.current?.isOpen()).toBe(false);

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

    it('warns when switching between controlled and uncontrolled', async () => {
      function Wrapper({ controlled }: { controlled: boolean }) {
        return <CollapsibleExample open={controlled ? false : undefined} />;
      }

      const { rerender } = await render(<Wrapper controlled={false} />);
      expect(errorSpy).not.toHaveBeenCalled();

      await rerender(<Wrapper controlled />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('is changing from uncontrolled to controlled')
      );
    });
  });
});
