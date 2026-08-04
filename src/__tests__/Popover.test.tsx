import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Popover } from '../primitives/Popover';
import type { PopoverHandle } from '../primitives/Popover';

function PopoverExample({
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
    <Popover.Root
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      disabled={disabled}
    >
      <Popover.Trigger testID="trigger" disabled={triggerDisabled}>
        <Text>Open</Text>
      </Popover.Trigger>
      <Popover.Content testID="content">
        <Text>Popover content</Text>
        <Popover.Close testID="close-button">
          <Text>Close</Text>
        </Popover.Close>
      </Popover.Content>
    </Popover.Root>
  );
}

describe('Popover', () => {
  it('does not render content until opened', async () => {
    await render(<PopoverExample />);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('respects defaultOpen for uncontrolled usage', async () => {
    await render(<PopoverExample defaultOpen />);
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('opens on trigger press and toggles closed on a second press', async () => {
    await render(<PopoverExample />);

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.getByTestId('content')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('closes when the backdrop is pressed', async () => {
    await render(<PopoverExample defaultOpen />);

    // `accessibilityViewIsModal` on Content correctly makes its sibling (the
    // backdrop) unreachable via linear screen-reader navigation on iOS — the
    // same reason `Popover.Close` exists as the a11y-reachable dismiss path.
    // It's still there for sighted/touch users, so we query past that here.
    const backdrop = screen.getByTestId('anvil-popover-backdrop', {
      includeHiddenElements: true,
    });
    expect(backdrop.props.accessibilityRole).toBe('button');

    await fireEvent.press(backdrop);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('does not close on backdrop press when closeOnOutsidePress is false, and hides it from accessibility', async () => {
    await render(
      <Popover.Root defaultOpen>
        <Popover.Trigger testID="trigger">
          <Text>Open</Text>
        </Popover.Trigger>
        <Popover.Content testID="content" closeOnOutsidePress={false}>
          <Text>Popover content</Text>
        </Popover.Content>
      </Popover.Root>
    );

    const backdrop = screen.getByTestId('anvil-popover-backdrop', {
      includeHiddenElements: true,
    });
    expect(backdrop.props.accessibilityElementsHidden).toBe(true);

    await fireEvent.press(backdrop);
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('closes when Popover.Close is pressed', async () => {
    await render(<PopoverExample defaultOpen />);

    await fireEvent.press(screen.getByTestId('close-button'));
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('does not open when the trigger is disabled', async () => {
    await render(<PopoverExample triggerDisabled />);

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.queryByTestId('content')).toBeNull();
    expect(
      screen.getByTestId('trigger').props.accessibilityState.disabled
    ).toBe(true);
  });

  it('root disabled disables the trigger regardless of its own disabled prop', async () => {
    await render(<PopoverExample disabled />);

    expect(
      screen.getByTestId('trigger').props.accessibilityState.disabled
    ).toBe(true);

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('supports controlled mode via open/onOpenChange', async () => {
    const onOpenChange = jest.fn();

    function Controlled() {
      const [open, setOpen] = React.useState(false);
      return (
        <PopoverExample
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
    const ref = React.createRef<PopoverHandle>();

    await render(
      <Popover.Root ref={ref}>
        <Popover.Trigger testID="trigger">
          <Text>Open</Text>
        </Popover.Trigger>
        <Popover.Content testID="content">
          <Text>Popover content</Text>
        </Popover.Content>
      </Popover.Root>
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

  it('uses Popover.Anchor for positioning without breaking Trigger toggling', async () => {
    await render(
      <Popover.Root>
        <Popover.Anchor testID="anchor">
          <Text>Anchor</Text>
        </Popover.Anchor>
        <Popover.Trigger testID="trigger">
          <Text>Open</Text>
        </Popover.Trigger>
        <Popover.Content testID="content">
          <Text>Popover content</Text>
        </Popover.Content>
      </Popover.Root>
    );

    expect(screen.getByTestId('anchor')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.getByTestId('content')).toBeTruthy();
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
        return <PopoverExample open={controlled ? false : undefined} />;
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
