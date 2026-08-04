import * as React from 'react';
import { StyleSheet, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Menu } from '../primitives/Menu';
import type { MenuHandle } from '../primitives/Menu';

function MenuExample({
  defaultOpen,
  open,
  onOpenChange,
  disabled,
  triggerDisabled,
  onSelectEdit,
  onSelectDelete,
  deleteCloseOnSelect,
}: {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  triggerDisabled?: boolean;
  onSelectEdit?: () => void;
  onSelectDelete?: () => void;
  deleteCloseOnSelect?: boolean;
}) {
  return (
    <Menu.Root
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      disabled={disabled}
    >
      <Menu.Trigger testID="trigger" disabled={triggerDisabled}>
        <Text>Options</Text>
      </Menu.Trigger>
      <Menu.Content testID="content">
        <Menu.Label testID="label">Actions</Menu.Label>
        <Menu.Item testID="item-edit" onSelect={onSelectEdit}>
          <Text>Edit</Text>
        </Menu.Item>
        <Menu.Separator testID="separator" />
        <Menu.Item
          testID="item-delete"
          onSelect={onSelectDelete}
          closeOnSelect={deleteCloseOnSelect}
        >
          <Text>Delete</Text>
        </Menu.Item>
        <Menu.Item testID="item-disabled" disabled>
          <Text>Disabled action</Text>
        </Menu.Item>
      </Menu.Content>
    </Menu.Root>
  );
}

describe('Menu', () => {
  it('does not render content until opened', async () => {
    await render(<MenuExample />);
    expect(screen.queryByTestId('item-edit')).toBeNull();
  });

  it('respects defaultOpen for uncontrolled usage', async () => {
    await render(<MenuExample defaultOpen />);
    expect(screen.getByTestId('item-edit')).toBeTruthy();
  });

  it('opens on trigger press', async () => {
    await render(<MenuExample />);

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.getByTestId('item-edit')).toBeTruthy();
  });

  it('selecting an item calls onSelect and closes the menu by default', async () => {
    const onSelectEdit = jest.fn();
    await render(<MenuExample defaultOpen onSelectEdit={onSelectEdit} />);

    await fireEvent.press(screen.getByTestId('item-edit'));
    expect(onSelectEdit).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('item-edit')).toBeNull();
  });

  it('closeOnSelect={false} keeps the menu open after selecting', async () => {
    const onSelectDelete = jest.fn();
    await render(
      <MenuExample
        defaultOpen
        onSelectDelete={onSelectDelete}
        deleteCloseOnSelect={false}
      />
    );

    await fireEvent.press(screen.getByTestId('item-delete'));
    expect(onSelectDelete).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('item-delete')).toBeTruthy();
  });

  it('does not select a disabled item', async () => {
    await render(<MenuExample defaultOpen />);

    const disabledItem = screen.getByTestId('item-disabled');
    expect(disabledItem.props.accessibilityState.disabled).toBe(true);

    await fireEvent.press(disabledItem);
    expect(screen.getByTestId('item-disabled')).toBeTruthy();
  });

  it('closes when the backdrop is pressed', async () => {
    await render(<MenuExample defaultOpen />);

    const backdrop = screen.getByTestId('anvil-menu-backdrop', {
      includeHiddenElements: true,
    });
    expect(backdrop.props.accessibilityRole).toBe('button');

    await fireEvent.press(backdrop);
    expect(screen.queryByTestId('item-edit')).toBeNull();
  });

  it('does not open when the trigger is disabled', async () => {
    await render(<MenuExample triggerDisabled />);

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.queryByTestId('item-edit')).toBeNull();
    expect(
      screen.getByTestId('trigger').props.accessibilityState.disabled
    ).toBe(true);
  });

  it('root disabled disables the trigger regardless of its own disabled prop', async () => {
    await render(<MenuExample disabled />);

    expect(
      screen.getByTestId('trigger').props.accessibilityState.disabled
    ).toBe(true);

    await fireEvent.press(screen.getByTestId('trigger'));
    expect(screen.queryByTestId('item-edit')).toBeNull();
  });

  it('supports controlled mode via open/onOpenChange', async () => {
    const onOpenChange = jest.fn();

    function Controlled() {
      const [open, setOpen] = React.useState(false);
      return (
        <MenuExample
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
    expect(screen.getByTestId('item-edit')).toBeTruthy();
  });

  it('exposes an imperative ref API to open/close/toggle/isOpen', async () => {
    const ref = React.createRef<MenuHandle>();

    await render(
      <Menu.Root ref={ref}>
        <Menu.Trigger testID="trigger">
          <Text>Options</Text>
        </Menu.Trigger>
        <Menu.Content>
          <Menu.Item testID="item-edit">
            <Text>Edit</Text>
          </Menu.Item>
        </Menu.Content>
      </Menu.Root>
    );

    expect(ref.current?.isOpen()).toBe(false);

    React.act(() => {
      ref.current?.open();
    });
    expect(ref.current?.isOpen()).toBe(true);
    expect(screen.getByTestId('item-edit')).toBeTruthy();

    React.act(() => {
      ref.current?.toggle();
    });
    expect(ref.current?.isOpen()).toBe(false);

    React.act(() => {
      ref.current?.close();
    });
    expect(ref.current?.isOpen()).toBe(false);
  });

  it('exposes the menu/menuitem accessibility roles', async () => {
    await render(<MenuExample defaultOpen />);

    expect(screen.getByTestId('item-edit').props.accessibilityRole).toBe(
      'menuitem'
    );
  });

  it('becomes visible once its own layout is measured via onLayout', async () => {
    // Regression test: Content must call `setContentSize` from `onLayout`.
    // A previous version of Menu.Content forgot to attach `onLayout` at
    // all, so `contentSize` never left `null`, `position` never resolved,
    // and the menu stayed mounted-but-invisible (opacity 0) forever — even
    // though every other assertion (querying by testID, pressing items)
    // still passed. That failure mode only showed up when actually run in
    // a browser, not in this test suite, so we pin the wiring down here.
    //
    // No Menu.Trigger is rendered on purpose: with no trigger to measure,
    // Content's anchor-measurement effect takes its synchronous fallback
    // path instead of the real (async, native-backed) `measureInWindow`,
    // which never resolves in this JS-only test environment. That keeps
    // this test deterministic while still exercising the exact `onLayout`
    // wiring that broke. The positioning math itself is covered by
    // positioning.test.ts, and the fully-resolved, anchored behavior was
    // confirmed against a real browser.
    await render(
      <Menu.Root defaultOpen>
        <Menu.Content testID="content">
          <Text>Item</Text>
        </Menu.Content>
      </Menu.Root>
    );

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
        return <MenuExample open={controlled ? false : undefined} />;
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
