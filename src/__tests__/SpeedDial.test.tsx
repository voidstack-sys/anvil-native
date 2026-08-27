import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SpeedDial } from '../primitives/SpeedDial';
import type { SpeedDialHandle } from '../primitives/SpeedDial';

function SpeedDialExample({
  defaultOpen,
  open,
  onOpenChange,
  disabled,
  triggerDisabled,
  onEdit,
  editCloseOnPress,
}: {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  triggerDisabled?: boolean;
  onEdit?: () => void;
  editCloseOnPress?: boolean;
}) {
  return (
    <SpeedDial.Root
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      disabled={disabled}
    >
      <SpeedDial.Backdrop testID="backdrop" />
      <SpeedDial.Actions testID="actions">
        <SpeedDial.Action
          testID="edit"
          onPress={onEdit}
          closeOnPress={editCloseOnPress}
        >
          <Text>Edit</Text>
        </SpeedDial.Action>
      </SpeedDial.Actions>
      <SpeedDial.Trigger testID="trigger" disabled={triggerDisabled}>
        <Text>+</Text>
      </SpeedDial.Trigger>
    </SpeedDial.Root>
  );
}

describe('SpeedDial', () => {
  it('does not render Actions/Backdrop until opened', async () => {
    await render(<SpeedDialExample />);
    expect(screen.queryByTestId('actions')).toBeNull();
    expect(screen.queryByTestId('backdrop')).toBeNull();
  });

  it('respects defaultOpen for uncontrolled usage', async () => {
    await render(<SpeedDialExample defaultOpen />);
    expect(screen.getByTestId('actions')).toBeTruthy();
  });

  it('opens on trigger press and toggles closed on a second press', async () => {
    await render(<SpeedDialExample />);

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.getByTestId('actions')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.queryByTestId('actions')).toBeNull();
  });

  it('closes when the backdrop is pressed', async () => {
    await render(<SpeedDialExample defaultOpen />);

    // Backdrop is decorative (accessibilityElementsHidden), so it's
    // invisible to RNTL's default queries -- same reasoning as
    // Popover/Dialog's own backdrops.
    await fireEvent.press(
      screen.getByTestId('backdrop', { includeHiddenElements: true })
    );
    expect(screen.queryByTestId('actions')).toBeNull();
  });

  it('closes when an Action is pressed by default', async () => {
    const onEdit = jest.fn();
    await render(<SpeedDialExample defaultOpen onEdit={onEdit} />);

    await fireEvent.press(screen.getByTestId('edit'));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('actions')).toBeNull();
  });

  it('does not close after an Action press when closeOnPress is false', async () => {
    const onEdit = jest.fn();
    await render(
      <SpeedDialExample defaultOpen onEdit={onEdit} editCloseOnPress={false} />
    );

    await fireEvent.press(screen.getByTestId('edit'));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('actions')).toBeTruthy();
  });

  it('keeps Actions mounted when forceMount is set, even while closed', async () => {
    await render(
      <SpeedDial.Root>
        <SpeedDial.Actions testID="actions" forceMount>
          <Text>Edit</Text>
        </SpeedDial.Actions>
        <SpeedDial.Trigger testID="trigger">
          <Text>+</Text>
        </SpeedDial.Trigger>
      </SpeedDial.Root>
    );

    expect(screen.getByTestId('actions')).toBeTruthy();
  });

  it('does not open when the trigger is disabled', async () => {
    await render(<SpeedDialExample triggerDisabled />);

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.queryByTestId('actions')).toBeNull();
    expect(
      screen.getByTestId('trigger').props.accessibilityState.disabled
    ).toBe(true);
  });

  it('root disabled disables the trigger regardless of its own disabled prop', async () => {
    await render(<SpeedDialExample disabled />);

    expect(
      screen.getByTestId('trigger').props.accessibilityState.disabled
    ).toBe(true);

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.queryByTestId('actions')).toBeNull();
  });

  it('supports controlled mode via open/onOpenChange', async () => {
    const onOpenChange = jest.fn();

    function Controlled() {
      const [open, setOpen] = React.useState(false);
      return (
        <SpeedDialExample
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
    expect(screen.getByTestId('actions')).toBeTruthy();
  });

  it('exposes an imperative ref API to open/close/toggle/isOpen', async () => {
    const ref = React.createRef<SpeedDialHandle>();

    await render(
      <SpeedDial.Root ref={ref}>
        <SpeedDial.Actions testID="actions">
          <Text>Edit</Text>
        </SpeedDial.Actions>
        <SpeedDial.Trigger testID="trigger">
          <Text>+</Text>
        </SpeedDial.Trigger>
      </SpeedDial.Root>
    );

    expect(ref.current?.isOpen()).toBe(false);

    React.act(() => {
      ref.current?.open();
    });
    expect(ref.current?.isOpen()).toBe(true);
    expect(screen.getByTestId('actions')).toBeTruthy();

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
        return <SpeedDialExample open={controlled ? false : undefined} />;
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
