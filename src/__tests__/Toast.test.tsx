import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Toast } from '../primitives/Toast';
import type { ToastHandle } from '../primitives/Toast';

function ToastExample({
  defaultOpen,
  open,
  onOpenChange,
  duration,
  onAction,
}: {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
  onAction?: () => void;
}) {
  return (
    <Toast.Root
      testID="toast"
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      duration={duration}
    >
      <Toast.Title testID="title">Saved</Toast.Title>
      <Toast.Description testID="description">
        Your changes were saved.
      </Toast.Description>
      <Toast.Action testID="action" onPress={onAction}>
        <Text>Undo</Text>
      </Toast.Action>
      <Toast.Close testID="close">
        <Text>Dismiss</Text>
      </Toast.Close>
    </Toast.Root>
  );
}

describe('Toast', () => {
  it('does not render until opened', async () => {
    await render(<ToastExample />);
    expect(screen.queryByTestId('toast')).toBeNull();
  });

  it('respects defaultOpen for uncontrolled usage', async () => {
    await render(<ToastExample defaultOpen duration={Infinity} />);
    expect(screen.getByTestId('toast')).toBeTruthy();
  });

  it('exposes accessibilityRole="alert"', async () => {
    await render(<ToastExample defaultOpen duration={Infinity} />);
    expect(screen.getByTestId('toast').props.accessibilityRole).toBe('alert');
  });

  it('closes when Toast.Close is pressed', async () => {
    await render(<ToastExample defaultOpen duration={Infinity} />);

    await fireEvent.press(screen.getByTestId('close'));
    expect(screen.queryByTestId('toast')).toBeNull();
  });

  it('closes and calls onPress when Toast.Action is pressed', async () => {
    const onAction = jest.fn();
    await render(
      <ToastExample defaultOpen duration={Infinity} onAction={onAction} />
    );

    await fireEvent.press(screen.getByTestId('action'));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('toast')).toBeNull();
  });

  it('supports controlled mode via open/onOpenChange', async () => {
    const onOpenChange = jest.fn();

    function Controlled() {
      const [open, setOpen] = React.useState(true);
      return (
        <ToastExample
          open={open}
          duration={Infinity}
          onOpenChange={(next) => {
            onOpenChange(next);
            setOpen(next);
          }}
        />
      );
    }

    await render(<Controlled />);
    expect(screen.getByTestId('toast')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('close'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByTestId('toast')).toBeNull();
  });

  it('exposes an imperative ref API to open/close/toggle/isOpen', async () => {
    const ref = React.createRef<ToastHandle>();

    await render(
      <Toast.Root ref={ref} testID="toast" duration={Infinity}>
        <Text>Saved</Text>
      </Toast.Root>
    );

    expect(ref.current?.isOpen()).toBe(false);

    React.act(() => {
      ref.current?.open();
    });
    expect(ref.current?.isOpen()).toBe(true);
    expect(screen.getByTestId('toast')).toBeTruthy();

    React.act(() => {
      ref.current?.close();
    });
    expect(ref.current?.isOpen()).toBe(false);
  });

  describe('auto-dismiss', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('auto-dismisses after `duration` elapses', async () => {
      const onOpenChange = jest.fn();
      await render(
        <ToastExample defaultOpen duration={1000} onOpenChange={onOpenChange} />
      );

      expect(screen.getByTestId('toast')).toBeTruthy();

      React.act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('does not auto-dismiss when duration is Infinity', async () => {
      const onOpenChange = jest.fn();
      await render(
        <ToastExample
          defaultOpen
          duration={Infinity}
          onOpenChange={onOpenChange}
        />
      );

      React.act(() => {
        jest.advanceTimersByTime(60000);
      });

      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.getByTestId('toast')).toBeTruthy();
    });

    it('falls back to Toast.Provider defaultDuration when Root has no duration', async () => {
      const onOpenChange = jest.fn();
      await render(
        <Toast.Provider defaultDuration={2000}>
          <ToastExample defaultOpen onOpenChange={onOpenChange} />
        </Toast.Provider>
      );

      React.act(() => {
        jest.advanceTimersByTime(1999);
      });
      expect(onOpenChange).not.toHaveBeenCalled();

      React.act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('restarts the timer if duration changes while open', async () => {
      const onOpenChange = jest.fn();

      function Resizable() {
        const [duration, setDuration] = React.useState(1000);
        return (
          <>
            <ToastExample
              defaultOpen
              duration={duration}
              onOpenChange={onOpenChange}
            />
            <Text testID="extend" onPress={() => setDuration(5000)}>
              extend
            </Text>
          </>
        );
      }

      await render(<Resizable />);

      React.act(() => {
        jest.advanceTimersByTime(500);
      });
      await fireEvent.press(screen.getByTestId('extend'));

      // The timer restarted at the new duration (5000ms) when it changed,
      // so the original 1000ms deadline passing shouldn't dismiss it.
      React.act(() => {
        jest.advanceTimersByTime(999);
      });
      expect(onOpenChange).not.toHaveBeenCalled();

      React.act(() => {
        jest.advanceTimersByTime(4001);
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
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
          <ToastExample
            open={controlled ? false : undefined}
            duration={Infinity}
          />
        );
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
