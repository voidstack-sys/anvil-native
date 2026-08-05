import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AlertDialog } from '../primitives/AlertDialog';
import type { AlertDialogHandle } from '../primitives/AlertDialog';

function AlertDialogExample({
  defaultOpen,
  open,
  onOpenChange,
  disabled,
  triggerDisabled,
  overlayCloseOnPress,
  onAction,
  actionCloseOnPress,
}: {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  triggerDisabled?: boolean;
  overlayCloseOnPress?: boolean;
  onAction?: () => void;
  actionCloseOnPress?: boolean;
}) {
  return (
    <AlertDialog.Root
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      disabled={disabled}
    >
      <AlertDialog.Trigger testID="trigger" disabled={triggerDisabled}>
        <Text>Delete</Text>
      </AlertDialog.Trigger>
      <AlertDialog.Content testID="content">
        <AlertDialog.Overlay
          testID="overlay"
          closeOnPress={overlayCloseOnPress}
        />
        <AlertDialog.Title testID="title">Delete item?</AlertDialog.Title>
        <AlertDialog.Description testID="description">
          This can't be undone.
        </AlertDialog.Description>
        <AlertDialog.Cancel testID="cancel-button">
          <Text>Cancel</Text>
        </AlertDialog.Cancel>
        <AlertDialog.Action
          testID="action-button"
          onPress={onAction}
          closeOnPress={actionCloseOnPress}
        >
          <Text>Delete</Text>
        </AlertDialog.Action>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}

describe('AlertDialog', () => {
  it('does not render content until opened', async () => {
    await render(<AlertDialogExample />);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('respects defaultOpen for uncontrolled usage', async () => {
    await render(<AlertDialogExample defaultOpen />);
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('opens on trigger press', async () => {
    await render(<AlertDialogExample />);

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('does NOT close when the overlay is pressed by default, unlike Dialog', async () => {
    await render(<AlertDialogExample defaultOpen />);

    const overlay = screen.getByTestId('overlay', {
      includeHiddenElements: true,
    });
    expect(overlay.props.accessibilityElementsHidden).toBe(true);

    await fireEvent.press(overlay);
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('closes on overlay press when explicitly opted in via closeOnPress', async () => {
    await render(<AlertDialogExample defaultOpen overlayCloseOnPress />);

    const overlay = screen.getByTestId('overlay');
    expect(overlay.props.accessibilityRole).toBe('button');

    await fireEvent.press(overlay);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('does not close on the Android back button (onRequestClose) by default', async () => {
    await render(<AlertDialogExample defaultOpen />);

    // `testID` on AlertDialog.Content lands on the underlying Modal itself.
    const modal = screen.getByTestId('content');
    expect(modal.props.onRequestClose).toBeInstanceOf(Function);

    modal.props.onRequestClose();
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('closes when AlertDialog.Cancel is pressed', async () => {
    await render(<AlertDialogExample defaultOpen />);

    await fireEvent.press(screen.getByTestId('cancel-button'));
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('closes when AlertDialog.Action is pressed, and calls its onPress', async () => {
    const onAction = jest.fn();
    await render(<AlertDialogExample defaultOpen onAction={onAction} />);

    await fireEvent.press(screen.getByTestId('action-button'));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('keeps the dialog open when Action has closeOnPress={false}, for async confirm flows', async () => {
    const onAction = jest.fn();
    await render(
      <AlertDialogExample
        defaultOpen
        onAction={onAction}
        actionCloseOnPress={false}
      />
    );

    await fireEvent.press(screen.getByTestId('action-button'));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('does not open when the trigger is disabled', async () => {
    await render(<AlertDialogExample triggerDisabled />);

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.queryByTestId('content')).toBeNull();
    expect(
      screen.getByTestId('trigger').props.accessibilityState.disabled
    ).toBe(true);
  });

  it('root disabled disables the trigger regardless of its own disabled prop', async () => {
    await render(<AlertDialogExample disabled />);

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
        <AlertDialogExample
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
    const ref = React.createRef<AlertDialogHandle>();

    await render(
      <AlertDialog.Root ref={ref}>
        <AlertDialog.Trigger testID="trigger">
          <Text>Delete</Text>
        </AlertDialog.Trigger>
        <AlertDialog.Content testID="content">
          <Text>Alert content</Text>
        </AlertDialog.Content>
      </AlertDialog.Root>
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

  it('links AlertDialog.Title and AlertDialog.Description to the content for accessibility', async () => {
    await render(<AlertDialogExample defaultOpen />);

    const contentView = screen.getByTestId('anvil-alert-dialog-content');
    const title = screen.getByTestId('title');
    const description = screen.getByTestId('description');

    expect(contentView.props.accessibilityLabelledBy).toBe(
      title.props.nativeID
    );
    expect(contentView.props['aria-describedby']).toBe(
      description.props.nativeID
    );
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
        return <AlertDialogExample open={controlled ? false : undefined} />;
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
