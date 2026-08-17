import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Tooltip } from '../primitives/Tooltip';
import type { TooltipHandle } from '../primitives/Tooltip';

function TooltipExample({
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
    <Tooltip.Root
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      disabled={disabled}
    >
      <Tooltip.Trigger testID="trigger" disabled={triggerDisabled}>
        <Text>Delete</Text>
      </Tooltip.Trigger>
      <Tooltip.Content testID="content">Delete this item</Tooltip.Content>
    </Tooltip.Root>
  );
}

describe('Tooltip', () => {
  it('does not render content until opened', async () => {
    await render(<TooltipExample />);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('respects defaultOpen for uncontrolled usage', async () => {
    await render(<TooltipExample defaultOpen />);
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('opens on long-press and closes when the finger lifts', async () => {
    await render(<TooltipExample />);

    await fireEvent(screen.getByTestId('trigger'), 'longPress');
    expect(screen.getByTestId('content')).toBeTruthy();

    await fireEvent(screen.getByTestId('trigger'), 'pressOut');
    expect(screen.queryByTestId('content')).toBeNull();
  });

  describe('hover', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('opens on hover-in and closes on hover-out, after the debounce', async () => {
      await render(<TooltipExample />);

      await fireEvent(screen.getByTestId('trigger'), 'hoverIn');
      expect(screen.getByTestId('content')).toBeTruthy();

      await fireEvent(screen.getByTestId('trigger'), 'hoverOut');
      // The close is debounced so a same-frame re-hover-in (which can happen
      // when the content mounts under the cursor) doesn't cause a flicker.
      expect(screen.getByTestId('content')).toBeTruthy();

      React.act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(screen.queryByTestId('content')).toBeNull();
    });

    it('cancels a pending hover-out close if hover-in fires again first', async () => {
      await render(<TooltipExample />);

      await fireEvent(screen.getByTestId('trigger'), 'hoverIn');
      await fireEvent(screen.getByTestId('trigger'), 'hoverOut');

      React.act(() => {
        jest.advanceTimersByTime(50);
      });
      await fireEvent(screen.getByTestId('trigger'), 'hoverIn');

      React.act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(screen.getByTestId('content')).toBeTruthy();
    });
  });

  it('opens on focus and closes on blur', async () => {
    await render(<TooltipExample />);

    await fireEvent(screen.getByTestId('trigger'), 'focus');
    expect(screen.getByTestId('content')).toBeTruthy();

    await fireEvent(screen.getByTestId('trigger'), 'blur');
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('does not open when the trigger is disabled', async () => {
    await render(<TooltipExample triggerDisabled />);

    await fireEvent(screen.getByTestId('trigger'), 'longPress');
    await fireEvent(screen.getByTestId('trigger'), 'hoverIn');
    await fireEvent(screen.getByTestId('trigger'), 'focus');
    expect(screen.queryByTestId('content')).toBeNull();
    expect(
      screen.getByTestId('trigger').props.accessibilityState.disabled
    ).toBe(true);
  });

  it('root disabled disables the trigger regardless of its own disabled prop', async () => {
    await render(<TooltipExample disabled />);

    expect(
      screen.getByTestId('trigger').props.accessibilityState.disabled
    ).toBe(true);

    await fireEvent(screen.getByTestId('trigger'), 'longPress');
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('supports controlled mode via open/onOpenChange', async () => {
    const onOpenChange = jest.fn();

    function Controlled() {
      const [open, setOpen] = React.useState(false);
      return (
        <TooltipExample
          open={open}
          onOpenChange={(next) => {
            onOpenChange(next);
            setOpen(next);
          }}
        />
      );
    }

    await render(<Controlled />);

    await fireEvent(screen.getByTestId('trigger'), 'longPress');
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('exposes an imperative ref API to open/close/isOpen', async () => {
    const ref = React.createRef<TooltipHandle>();

    await render(
      <Tooltip.Root ref={ref}>
        <Tooltip.Trigger testID="trigger">
          <Text>Delete</Text>
        </Tooltip.Trigger>
        <Tooltip.Content testID="content">Delete this item</Tooltip.Content>
      </Tooltip.Root>
    );

    expect(ref.current?.isOpen()).toBe(false);

    React.act(() => {
      ref.current?.open();
    });
    expect(ref.current?.isOpen()).toBe(true);
    expect(screen.getByTestId('content')).toBeTruthy();

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
        return <TooltipExample open={controlled ? false : undefined} />;
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
