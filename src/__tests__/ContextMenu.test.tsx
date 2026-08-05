import * as React from 'react';
import { StyleSheet, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ContextMenu } from '../primitives/ContextMenu';
import type { ContextMenuHandle } from '../primitives/ContextMenu';

function longPressAt(testID: string, x: number, y: number) {
  return fireEvent(screen.getByTestId(testID), 'longPress', {
    nativeEvent: { pageX: x, pageY: y },
  });
}

function ContextMenuExample({
  defaultOpen,
  open,
  onOpenChange,
  disabled,
  triggerDisabled,
  onSelectEdit,
}: {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  triggerDisabled?: boolean;
  onSelectEdit?: () => void;
}) {
  return (
    <ContextMenu.Root
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      disabled={disabled}
    >
      <ContextMenu.Trigger testID="trigger" disabled={triggerDisabled}>
        <Text>Long-press me</Text>
      </ContextMenu.Trigger>
      <ContextMenu.Content testID="content">
        <ContextMenu.Label testID="label">Actions</ContextMenu.Label>
        <ContextMenu.Item testID="item-edit" onSelect={onSelectEdit}>
          <Text>Edit</Text>
        </ContextMenu.Item>
        <ContextMenu.Separator testID="separator" />
        <ContextMenu.Item testID="item-disabled" disabled>
          <Text>Disabled action</Text>
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
}

describe('ContextMenu', () => {
  it('does not render content until opened', async () => {
    await render(<ContextMenuExample />);
    expect(screen.queryByTestId('item-edit')).toBeNull();
  });

  it('respects defaultOpen for uncontrolled usage', async () => {
    await render(<ContextMenuExample defaultOpen />);
    expect(screen.getByTestId('item-edit')).toBeTruthy();
  });

  it('opens on long-press, anchored at the touch point', async () => {
    await render(<ContextMenuExample />);

    await longPressAt('trigger', 120, 240);
    expect(screen.getByTestId('item-edit')).toBeTruthy();
  });

  it('selecting an item calls onSelect and closes the menu by default', async () => {
    const onSelectEdit = jest.fn();
    await render(
      <ContextMenuExample defaultOpen onSelectEdit={onSelectEdit} />
    );

    await fireEvent.press(screen.getByTestId('item-edit'));
    expect(onSelectEdit).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('item-edit')).toBeNull();
  });

  it('does not select a disabled item', async () => {
    await render(<ContextMenuExample defaultOpen />);

    const disabledItem = screen.getByTestId('item-disabled');
    expect(disabledItem.props.accessibilityState.disabled).toBe(true);

    await fireEvent.press(disabledItem);
    expect(screen.getByTestId('item-disabled')).toBeTruthy();
  });

  it('closes when the backdrop is pressed', async () => {
    await render(<ContextMenuExample defaultOpen />);

    const backdrop = screen.getByTestId('anvil-context-menu-backdrop', {
      includeHiddenElements: true,
    });
    expect(backdrop.props.accessibilityRole).toBe('button');

    await fireEvent.press(backdrop);
    expect(screen.queryByTestId('item-edit')).toBeNull();
  });

  it('does not open when the trigger is disabled', async () => {
    await render(<ContextMenuExample triggerDisabled />);

    await longPressAt('trigger', 50, 50);
    expect(screen.queryByTestId('item-edit')).toBeNull();
    expect(
      screen.getByTestId('trigger').props.accessibilityState.disabled
    ).toBe(true);
  });

  it('root disabled disables the trigger regardless of its own disabled prop', async () => {
    await render(<ContextMenuExample disabled />);

    expect(
      screen.getByTestId('trigger').props.accessibilityState.disabled
    ).toBe(true);

    await longPressAt('trigger', 50, 50);
    expect(screen.queryByTestId('item-edit')).toBeNull();
  });

  it('supports controlled mode via open/onOpenChange', async () => {
    const onOpenChange = jest.fn();

    function Controlled() {
      const [open, setOpen] = React.useState(false);
      return (
        <ContextMenuExample
          open={open}
          onOpenChange={(next) => {
            onOpenChange(next);
            setOpen(next);
          }}
        />
      );
    }

    await render(<Controlled />);

    await longPressAt('trigger', 10, 10);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('item-edit')).toBeTruthy();
  });

  it('exposes an imperative ref API to open(point)/close/isOpen', async () => {
    const ref = React.createRef<ContextMenuHandle>();

    await render(
      <ContextMenu.Root ref={ref}>
        <ContextMenu.Trigger testID="trigger">
          <Text>Long-press me</Text>
        </ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item testID="item-edit">
            <Text>Edit</Text>
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>
    );

    expect(ref.current?.isOpen()).toBe(false);

    React.act(() => {
      ref.current?.open({ x: 30, y: 40 });
    });
    expect(ref.current?.isOpen()).toBe(true);
    expect(screen.getByTestId('item-edit')).toBeTruthy();

    React.act(() => {
      ref.current?.close();
    });
    expect(ref.current?.isOpen()).toBe(false);
  });

  it('exposes the menu/menuitem accessibility roles', async () => {
    await render(<ContextMenuExample defaultOpen />);

    expect(screen.getByTestId('item-edit').props.accessibilityRole).toBe(
      'menuitem'
    );
  });

  it('becomes visible once its own layout is measured via onLayout', async () => {
    // Regression test mirroring the Menu bug found by manual testing: Content
    // must call `setContentSize` from `onLayout`, or the content stays
    // mounted-but-invisible (opacity 0) forever.
    const ref = React.createRef<ContextMenuHandle>();

    await render(
      <ContextMenu.Root ref={ref}>
        <ContextMenu.Content testID="content">
          <Text>Item</Text>
        </ContextMenu.Content>
      </ContextMenu.Root>
    );

    React.act(() => {
      ref.current?.open({ x: 10, y: 20 });
    });

    const content = screen.getByTestId('content');
    expect(content.props.accessibilityRole).toBe('menu');
    expect(StyleSheet.flatten(content.props.style).opacity).toBe(0);

    await fireEvent(content, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 180, height: 175 } },
    });

    expect(
      StyleSheet.flatten(screen.getByTestId('content').props.style).opacity
    ).toBe(1);
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
        return <ContextMenuExample open={controlled ? false : undefined} />;
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
