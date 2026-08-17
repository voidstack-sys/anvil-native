import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { BottomSheet } from '../primitives/BottomSheet';
import type { BottomSheetHandle } from '../primitives/BottomSheet';

function BottomSheetExample({
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
    <BottomSheet.Root
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      disabled={disabled}
    >
      <BottomSheet.Trigger testID="trigger" disabled={triggerDisabled}>
        <Text>Open</Text>
      </BottomSheet.Trigger>
      <BottomSheet.Content testID="content">
        <BottomSheet.Overlay
          testID="overlay"
          closeOnPress={overlayCloseOnPress}
        />
        <BottomSheet.Panel testID="panel">
          <BottomSheet.Handle testID="handle" />
          <BottomSheet.Title testID="title">Filters</BottomSheet.Title>
          <BottomSheet.Description testID="description">
            Choose how to narrow results.
          </BottomSheet.Description>
          <BottomSheet.Close testID="close-button">
            <Text>Close</Text>
          </BottomSheet.Close>
        </BottomSheet.Panel>
      </BottomSheet.Content>
    </BottomSheet.Root>
  );
}

describe('BottomSheet', () => {
  it('does not render content until opened', async () => {
    await render(<BottomSheetExample />);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('respects defaultOpen for uncontrolled usage', async () => {
    await render(<BottomSheetExample defaultOpen />);
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('opens on trigger press', async () => {
    await render(<BottomSheetExample />);

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('closes when the overlay is pressed', async () => {
    await render(<BottomSheetExample defaultOpen />);

    const overlay = screen.getByTestId('overlay');
    expect(overlay.props.accessibilityRole).toBe('button');

    await fireEvent.press(overlay);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('does not close on overlay press when closeOnPress is false, and hides it from accessibility', async () => {
    await render(
      <BottomSheetExample defaultOpen overlayCloseOnPress={false} />
    );

    const overlay = screen.getByTestId('overlay', {
      includeHiddenElements: true,
    });
    expect(overlay.props.accessibilityElementsHidden).toBe(true);

    await fireEvent.press(overlay);
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('closes when BottomSheet.Close is pressed', async () => {
    await render(<BottomSheetExample defaultOpen />);

    await fireEvent.press(screen.getByTestId('close-button'));
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('does not open when the trigger is disabled', async () => {
    await render(<BottomSheetExample triggerDisabled />);

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.queryByTestId('content')).toBeNull();
    expect(
      screen.getByTestId('trigger').props.accessibilityState.disabled
    ).toBe(true);
  });

  it('root disabled disables the trigger regardless of its own disabled prop', async () => {
    await render(<BottomSheetExample disabled />);

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
        <BottomSheetExample
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
    const ref = React.createRef<BottomSheetHandle>();

    await render(
      <BottomSheet.Root ref={ref}>
        <BottomSheet.Trigger testID="trigger">
          <Text>Open</Text>
        </BottomSheet.Trigger>
        <BottomSheet.Content testID="content">
          <Text>Sheet content</Text>
        </BottomSheet.Content>
      </BottomSheet.Root>
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

  it('links BottomSheet.Title and BottomSheet.Description to the content for accessibility', async () => {
    await render(<BottomSheetExample defaultOpen />);

    const contentView = screen.getByTestId('anvil-bottom-sheet-content');
    const title = screen.getByTestId('title');
    const description = screen.getByTestId('description');

    expect(contentView.props.accessibilityLabelledBy).toBe(
      title.props.nativeID
    );
    expect(contentView.props['aria-describedby']).toBe(
      description.props.nativeID
    );
  });

  it('resets the drag offset when the sheet re-opens', async () => {
    const ref = React.createRef<BottomSheetHandle>();

    await render(
      <BottomSheet.Root ref={ref} defaultOpen>
        <BottomSheet.Content testID="content">
          <BottomSheet.Panel testID="panel">
            <Text>Sheet content</Text>
          </BottomSheet.Panel>
        </BottomSheet.Content>
      </BottomSheet.Root>
    );

    expect(screen.getByTestId('panel').props.style[0]).toEqual({
      transform: [{ translateY: 0 }],
    });

    React.act(() => {
      ref.current?.close();
    });
    React.act(() => {
      ref.current?.open();
    });

    expect(screen.getByTestId('panel').props.style[0]).toEqual({
      transform: [{ translateY: 0 }],
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
        return <BottomSheetExample open={controlled ? false : undefined} />;
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
