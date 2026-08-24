import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SwipeableRow } from '../primitives/SwipeableRow';
import type { SwipeableRowHandle } from '../primitives/SwipeableRow';

function SwipeableRowExample({
  openSide,
  defaultOpenSide,
  onOpenSideChange,
  disabled,
}: {
  openSide?: 'left' | 'right' | 'none';
  defaultOpenSide?: 'left' | 'right' | 'none';
  onOpenSideChange?: (side: 'left' | 'right' | 'none') => void;
  disabled?: boolean;
}) {
  return (
    <SwipeableRow.Root
      openSide={openSide}
      defaultOpenSide={defaultOpenSide}
      onOpenSideChange={onOpenSideChange}
      disabled={disabled}
    >
      <SwipeableRow.LeftActions testID="left-actions">
        <SwipeableRow.Close testID="archive">
          <Text>Archive</Text>
        </SwipeableRow.Close>
      </SwipeableRow.LeftActions>
      <SwipeableRow.RightActions testID="right-actions">
        <SwipeableRow.Close testID="delete">
          <Text>Delete</Text>
        </SwipeableRow.Close>
      </SwipeableRow.RightActions>
      <SwipeableRow.Content testID="content">
        <Text>Row content</Text>
      </SwipeableRow.Content>
    </SwipeableRow.Root>
  );
}

describe('SwipeableRow', () => {
  it('is closed by default, with actions hidden from accessibility', async () => {
    await render(<SwipeableRowExample />);

    expect(
      screen.getByTestId('left-actions', { includeHiddenElements: true }).props
        .accessibilityElementsHidden
    ).toBe(true);
    expect(
      screen.getByTestId('right-actions', { includeHiddenElements: true }).props
        .accessibilityElementsHidden
    ).toBe(true);
    expect(screen.getByTestId('content').props.style[0]).toEqual({
      transform: [{ translateX: 0 }],
    });
  });

  it('respects defaultOpenSide for uncontrolled usage', async () => {
    await render(<SwipeableRowExample defaultOpenSide="right" />);

    expect(
      screen.getByTestId('right-actions').props.accessibilityElementsHidden
    ).toBe(false);
    expect(
      screen.getByTestId('left-actions', { includeHiddenElements: true }).props
        .accessibilityElementsHidden
    ).toBe(true);
  });

  it('closes when SwipeableRow.Close is pressed', async () => {
    const onOpenSideChange = jest.fn();
    await render(
      <SwipeableRowExample
        defaultOpenSide="right"
        onOpenSideChange={onOpenSideChange}
      />
    );

    await fireEvent.press(screen.getByTestId('delete'));
    expect(onOpenSideChange).toHaveBeenCalledWith('none');
    expect(
      screen.getByTestId('right-actions', { includeHiddenElements: true }).props
        .accessibilityElementsHidden
    ).toBe(true);
  });

  it('supports controlled mode via openSide/onOpenSideChange', async () => {
    const onOpenSideChange = jest.fn();

    function Controlled() {
      const [openSide, setOpenSide] = React.useState<'left' | 'right' | 'none'>(
        'left'
      );
      return (
        <SwipeableRowExample
          openSide={openSide}
          onOpenSideChange={(next) => {
            onOpenSideChange(next);
            setOpenSide(next);
          }}
        />
      );
    }

    await render(<Controlled />);

    // "archive" (in LeftActions) is reachable since the row starts open to 'left'.
    await fireEvent.press(screen.getByTestId('archive'));
    expect(onOpenSideChange).toHaveBeenCalledWith('none');
  });

  it('exposes an imperative ref API to open/close/getOpenSide', async () => {
    const ref = React.createRef<SwipeableRowHandle>();

    await render(
      <SwipeableRow.Root ref={ref}>
        <SwipeableRow.RightActions testID="right-actions">
          <Text>Delete</Text>
        </SwipeableRow.RightActions>
        <SwipeableRow.Content testID="content">
          <Text>Row</Text>
        </SwipeableRow.Content>
      </SwipeableRow.Root>
    );

    expect(ref.current?.getOpenSide()).toBe('none');

    React.act(() => {
      ref.current?.open('right');
    });
    expect(ref.current?.getOpenSide()).toBe('right');

    React.act(() => {
      ref.current?.close();
    });
    expect(ref.current?.getOpenSide()).toBe('none');
  });

  it('passes swipeOffset and openSide to a Content render function', async () => {
    await render(
      <SwipeableRow.Root defaultOpenSide="none">
        <SwipeableRow.Content testID="content">
          {({ openSide }) => <Text testID="label">{openSide}</Text>}
        </SwipeableRow.Content>
      </SwipeableRow.Root>
    );

    expect(screen.getByTestId('label').props.children).toBe('none');
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
          <SwipeableRowExample openSide={controlled ? 'none' : undefined} />
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
