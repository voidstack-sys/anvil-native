import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ActionSheet } from '../primitives/ActionSheet';
import type { ActionSheetHandle } from '../primitives/ActionSheet';

function ActionSheetExample({
  defaultOpen,
  open,
  onOpenChange,
  disabled,
  triggerDisabled,
  overlayCloseOnPress,
  onEdit,
  editCloseOnPress,
  editDisabled,
}: {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  triggerDisabled?: boolean;
  overlayCloseOnPress?: boolean;
  onEdit?: () => void;
  editCloseOnPress?: boolean;
  editDisabled?: boolean;
}) {
  return (
    <ActionSheet.Root
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      disabled={disabled}
    >
      <ActionSheet.Trigger testID="trigger" disabled={triggerDisabled}>
        <Text>Open</Text>
      </ActionSheet.Trigger>
      <ActionSheet.Content testID="content">
        <ActionSheet.Overlay
          testID="overlay"
          closeOnPress={overlayCloseOnPress}
        />
        <ActionSheet.Title testID="title">Post options</ActionSheet.Title>
        <ActionSheet.Description testID="description">
          Choose an action.
        </ActionSheet.Description>
        <ActionSheet.Action
          testID="edit"
          onPress={onEdit}
          closeOnPress={editCloseOnPress}
          disabled={editDisabled}
        >
          <Text>Edit</Text>
        </ActionSheet.Action>
        <ActionSheet.Cancel testID="cancel">
          <Text>Cancel</Text>
        </ActionSheet.Cancel>
      </ActionSheet.Content>
    </ActionSheet.Root>
  );
}

describe('ActionSheet', () => {
  it('does not render content until opened', async () => {
    await render(<ActionSheetExample />);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('respects defaultOpen for uncontrolled usage', async () => {
    await render(<ActionSheetExample defaultOpen />);
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('opens on trigger press', async () => {
    await render(<ActionSheetExample />);

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('exposes the menu accessibility role on the content', async () => {
    await render(<ActionSheetExample defaultOpen />);
    expect(
      screen.getByTestId('anvil-action-sheet-content').props.accessibilityRole
    ).toBe('menu');
  });

  it('closes when the overlay is pressed', async () => {
    await render(<ActionSheetExample defaultOpen />);

    await fireEvent.press(screen.getByTestId('overlay'));
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('does not close on overlay press when closeOnPress is false, and hides it from accessibility', async () => {
    await render(
      <ActionSheetExample defaultOpen overlayCloseOnPress={false} />
    );

    const overlay = screen.getByTestId('overlay', {
      includeHiddenElements: true,
    });
    expect(overlay.props.accessibilityElementsHidden).toBe(true);

    await fireEvent.press(overlay);
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('closes and fires onPress when an Action is pressed', async () => {
    const onEdit = jest.fn();
    await render(<ActionSheetExample defaultOpen onEdit={onEdit} />);

    await fireEvent.press(screen.getByTestId('edit'));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('does not close after an Action press when closeOnPress is false', async () => {
    const onEdit = jest.fn();
    await render(
      <ActionSheetExample
        defaultOpen
        onEdit={onEdit}
        editCloseOnPress={false}
      />
    );

    await fireEvent.press(screen.getByTestId('edit'));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('does not fire onPress or close when a disabled Action is pressed', async () => {
    const onEdit = jest.fn();
    await render(
      <ActionSheetExample defaultOpen onEdit={onEdit} editDisabled />
    );

    await fireEvent.press(screen.getByTestId('edit'));
    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('always closes when Cancel is pressed', async () => {
    await render(<ActionSheetExample defaultOpen />);

    await fireEvent.press(screen.getByTestId('cancel'));
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('does not open when the trigger is disabled', async () => {
    await render(<ActionSheetExample triggerDisabled />);

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.queryByTestId('content')).toBeNull();
    expect(
      screen.getByTestId('trigger').props.accessibilityState.disabled
    ).toBe(true);
  });

  it('root disabled disables the trigger regardless of its own disabled prop', async () => {
    await render(<ActionSheetExample disabled />);

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
        <ActionSheetExample
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
    const ref = React.createRef<ActionSheetHandle>();

    await render(
      <ActionSheet.Root ref={ref}>
        <ActionSheet.Trigger testID="trigger">
          <Text>Open</Text>
        </ActionSheet.Trigger>
        <ActionSheet.Content testID="content">
          <Text>Sheet content</Text>
        </ActionSheet.Content>
      </ActionSheet.Root>
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

  it('links ActionSheet.Title and ActionSheet.Description to the content for accessibility', async () => {
    await render(<ActionSheetExample defaultOpen />);

    const contentView = screen.getByTestId('anvil-action-sheet-content');
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
        return <ActionSheetExample open={controlled ? false : undefined} />;
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
