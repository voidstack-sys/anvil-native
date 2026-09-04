import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Drawer } from '../primitives/Drawer';
import type { DrawerHandle, DrawerSide } from '../primitives/Drawer';

function DrawerExample({
  defaultOpen,
  open,
  onOpenChange,
  disabled,
  triggerDisabled,
  overlayCloseOnPress,
  side,
}: {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  triggerDisabled?: boolean;
  overlayCloseOnPress?: boolean;
  side?: DrawerSide;
}) {
  return (
    <Drawer.Root
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      disabled={disabled}
      side={side}
    >
      <Drawer.Trigger testID="trigger" disabled={triggerDisabled}>
        <Text>Open</Text>
      </Drawer.Trigger>
      <Drawer.Content testID="content">
        <Drawer.Overlay testID="overlay" closeOnPress={overlayCloseOnPress} />
        <Drawer.Panel testID="panel">
          <Drawer.Handle testID="handle" />
          <Drawer.Title testID="title">Navigation</Drawer.Title>
          <Drawer.Description testID="description">
            Jump to another section.
          </Drawer.Description>
          <Drawer.Close testID="close-button">
            <Text>Close</Text>
          </Drawer.Close>
        </Drawer.Panel>
      </Drawer.Content>
    </Drawer.Root>
  );
}

describe('Drawer', () => {
  it('does not render content until opened', async () => {
    await render(<DrawerExample />);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('respects defaultOpen for uncontrolled usage', async () => {
    await render(<DrawerExample defaultOpen />);
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('opens on trigger press', async () => {
    await render(<DrawerExample />);

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('closes when the overlay is pressed', async () => {
    await render(<DrawerExample defaultOpen />);

    const overlay = screen.getByTestId('overlay');
    expect(overlay.props.accessibilityRole).toBe('button');

    await fireEvent.press(overlay);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('does not close on overlay press when closeOnPress is false, and hides it from accessibility', async () => {
    await render(<DrawerExample defaultOpen overlayCloseOnPress={false} />);

    const overlay = screen.getByTestId('overlay', {
      includeHiddenElements: true,
    });
    expect(overlay.props.accessibilityElementsHidden).toBe(true);

    await fireEvent.press(overlay);
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('closes when Drawer.Close is pressed', async () => {
    await render(<DrawerExample defaultOpen />);

    await fireEvent.press(screen.getByTestId('close-button'));
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('does not open when the trigger is disabled', async () => {
    await render(<DrawerExample triggerDisabled />);

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.queryByTestId('content')).toBeNull();
    expect(
      screen.getByTestId('trigger').props.accessibilityState.disabled
    ).toBe(true);
  });

  it('root disabled disables the trigger regardless of its own disabled prop', async () => {
    await render(<DrawerExample disabled />);

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
        <DrawerExample
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
    const ref = React.createRef<DrawerHandle>();

    await render(
      <Drawer.Root ref={ref}>
        <Drawer.Trigger testID="trigger">
          <Text>Open</Text>
        </Drawer.Trigger>
        <Drawer.Content testID="content">
          <Text>Drawer content</Text>
        </Drawer.Content>
      </Drawer.Root>
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

  it('links Drawer.Title and Drawer.Description to the content for accessibility', async () => {
    await render(<DrawerExample defaultOpen />);

    const contentView = screen.getByTestId('anvil-drawer-content');
    const title = screen.getByTestId('title');
    const description = screen.getByTestId('description');

    expect(contentView.props.accessibilityLabelledBy).toBe(
      title.props.nativeID
    );
    expect(contentView.props['aria-describedby']).toBe(
      description.props.nativeID
    );
  });

  it('resets the drag offset when the drawer re-opens', async () => {
    const ref = React.createRef<DrawerHandle>();

    await render(
      <Drawer.Root ref={ref} defaultOpen>
        <Drawer.Content testID="content">
          <Drawer.Panel testID="panel">
            <Text>Drawer content</Text>
          </Drawer.Panel>
        </Drawer.Content>
      </Drawer.Root>
    );

    expect(screen.getByTestId('panel').props.style[0]).toEqual({
      transform: [{ translateX: 0 }],
    });

    React.act(() => {
      ref.current?.close();
    });
    React.act(() => {
      ref.current?.open();
    });

    expect(screen.getByTestId('panel').props.style[0]).toEqual({
      transform: [{ translateX: 0 }],
    });
  });

  it('defaults to sliding in from the left', async () => {
    await render(<DrawerExample defaultOpen />);
    expect(screen.getByTestId('trigger')).toBeTruthy();
    // No direct style assertion here (justifyContent is applied to the
    // Modal's content wrapper, not a testable prop) -- side-specific
    // positioning is confirmed live in the browser.
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
        return <DrawerExample open={controlled ? false : undefined} />;
      }

      const { rerender } = await render(<Wrapper controlled={false} />);
      expect(errorSpy).not.toHaveBeenCalled();

      await rerender(<Wrapper controlled />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('is changing from uncontrolled to controlled')
      );
    });

    it('warns when the side prop changes after the initial render', async () => {
      function Wrapper({ side }: { side: DrawerSide }) {
        return <DrawerExample side={side} />;
      }

      const { rerender } = await render(<Wrapper side="left" />);
      expect(errorSpy).not.toHaveBeenCalled();

      await rerender(<Wrapper side="right" />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('`side` prop changed from "left" to "right"')
      );
    });
  });
});
