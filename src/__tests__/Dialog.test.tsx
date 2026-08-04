import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Dialog } from '../primitives/Dialog';
import type { DialogHandle } from '../primitives/Dialog';

function DialogExample({
  defaultOpen,
  open,
  onOpenChange,
  disabled,
  triggerDisabled,
  overlayCloseOnPress,
}: {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  triggerDisabled?: boolean;
  overlayCloseOnPress?: boolean;
}) {
  return (
    <Dialog.Root
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      disabled={disabled}
    >
      <Dialog.Trigger testID="trigger" disabled={triggerDisabled}>
        <Text>Open</Text>
      </Dialog.Trigger>
      <Dialog.Content testID="content">
        <Dialog.Overlay testID="overlay" closeOnPress={overlayCloseOnPress} />
        <Dialog.Title testID="title">Delete item</Dialog.Title>
        <Dialog.Description testID="description">
          This can't be undone.
        </Dialog.Description>
        <Dialog.Close testID="close-button">
          <Text>Close</Text>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  );
}

describe('Dialog', () => {
  it('does not render content until opened', async () => {
    await render(<DialogExample />);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('respects defaultOpen for uncontrolled usage', async () => {
    await render(<DialogExample defaultOpen />);
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('opens on trigger press', async () => {
    await render(<DialogExample />);

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('closes when the overlay is pressed', async () => {
    await render(<DialogExample defaultOpen />);

    const overlay = screen.getByTestId('overlay');
    expect(overlay.props.accessibilityRole).toBe('button');

    await fireEvent.press(overlay);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('does not close on overlay press when closeOnPress is false, and hides it from accessibility', async () => {
    await render(<DialogExample defaultOpen overlayCloseOnPress={false} />);

    const overlay = screen.getByTestId('overlay', {
      includeHiddenElements: true,
    });
    expect(overlay.props.accessibilityElementsHidden).toBe(true);

    await fireEvent.press(overlay);
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('closes when Dialog.Close is pressed', async () => {
    await render(<DialogExample defaultOpen />);

    await fireEvent.press(screen.getByTestId('close-button'));
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('does not open when the trigger is disabled', async () => {
    await render(<DialogExample triggerDisabled />);

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.queryByTestId('content')).toBeNull();
    expect(
      screen.getByTestId('trigger').props.accessibilityState.disabled
    ).toBe(true);
  });

  it('root disabled disables the trigger regardless of its own disabled prop', async () => {
    await render(<DialogExample disabled />);

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
        <DialogExample
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
    const ref = React.createRef<DialogHandle>();

    await render(
      <Dialog.Root ref={ref}>
        <Dialog.Trigger testID="trigger">
          <Text>Open</Text>
        </Dialog.Trigger>
        <Dialog.Content testID="content">
          <Text>Dialog content</Text>
        </Dialog.Content>
      </Dialog.Root>
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

  it('links Dialog.Title and Dialog.Description to the content for accessibility', async () => {
    await render(<DialogExample defaultOpen />);

    const contentView = screen.getByTestId('anvil-dialog-content');
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
        return <DialogExample open={controlled ? false : undefined} />;
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
