import * as React from 'react';
import { StyleSheet, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SortableList } from '../primitives/SortableList';
import type { SortableListHandle } from '../primitives/SortableList';

function fireAccessibilityAction(testID: string, actionName: string) {
  return fireEvent(screen.getByTestId(testID), 'accessibilityAction', {
    nativeEvent: { actionName },
  });
}

function SortableListExample({
  order,
  defaultOrder,
  onOrderChange,
  disabled,
}: {
  order?: string[];
  defaultOrder?: string[];
  onOrderChange?: (order: string[]) => void;
  disabled?: boolean;
}) {
  return (
    <SortableList.Root
      order={order}
      defaultOrder={defaultOrder}
      onOrderChange={onOrderChange}
      disabled={disabled}
    >
      {['a', 'b', 'c'].map((key) => (
        <SortableList.Item key={key} itemKey={key} testID={`item-${key}`}>
          <Text>{key}</Text>
          <SortableList.Handle testID={`handle-${key}`} />
        </SortableList.Item>
      ))}
    </SortableList.Root>
  );
}

describe('SortableList', () => {
  it('renders every item with no offset when nothing is dragging', async () => {
    await render(<SortableListExample defaultOrder={['a', 'b', 'c']} />);

    for (const key of ['a', 'b', 'c']) {
      const flat = StyleSheet.flatten(
        screen.getByTestId(`item-${key}`).props.style
      );
      expect(flat.transform).toEqual([{ translateY: 0 }]);
    }
  });

  it('reports dragging=false via the render-prop children by default', async () => {
    function Example() {
      return (
        <SortableList.Root defaultOrder={['a']}>
          <SortableList.Item itemKey="a" testID="item-a">
            {({ dragging }) => <Text>{dragging ? 'dragging' : 'idle'}</Text>}
          </SortableList.Item>
        </SortableList.Root>
      );
    }
    await render(<Example />);
    expect(screen.getByText('idle')).toBeTruthy();
  });

  it('moves an item down one slot on an increment accessibility action', async () => {
    const onOrderChange = jest.fn();
    await render(
      <SortableListExample
        defaultOrder={['a', 'b', 'c']}
        onOrderChange={onOrderChange}
      />
    );

    await fireAccessibilityAction('item-a', 'increment');
    expect(onOrderChange).toHaveBeenCalledWith(['b', 'a', 'c']);
  });

  it('moves an item up one slot on a decrement accessibility action', async () => {
    const onOrderChange = jest.fn();
    await render(
      <SortableListExample
        defaultOrder={['a', 'b', 'c']}
        onOrderChange={onOrderChange}
      />
    );

    await fireAccessibilityAction('item-c', 'decrement');
    expect(onOrderChange).toHaveBeenCalledWith(['a', 'c', 'b']);
  });

  it('clamps accessibility-driven moves at the first/last position', async () => {
    const onOrderChange = jest.fn();
    await render(
      <SortableListExample
        defaultOrder={['a', 'b', 'c']}
        onOrderChange={onOrderChange}
      />
    );

    await fireAccessibilityAction('item-a', 'decrement');
    expect(onOrderChange).not.toHaveBeenCalled();
  });

  it('does not reorder via accessibility actions when disabled', async () => {
    const onOrderChange = jest.fn();
    await render(
      <SortableListExample
        defaultOrder={['a', 'b', 'c']}
        onOrderChange={onOrderChange}
        disabled
      />
    );

    await fireAccessibilityAction('item-a', 'increment');
    expect(onOrderChange).not.toHaveBeenCalled();
  });

  it('supports controlled mode via order/onOrderChange', async () => {
    const onOrderChange = jest.fn();

    function Controlled() {
      const [order, setOrder] = React.useState(['a', 'b', 'c']);
      return (
        <SortableListExample
          order={order}
          onOrderChange={(next) => {
            onOrderChange(next);
            setOrder(next);
          }}
        />
      );
    }

    await render(<Controlled />);
    await fireAccessibilityAction('item-a', 'increment');
    expect(onOrderChange).toHaveBeenCalledWith(['b', 'a', 'c']);
  });

  it('exposes an imperative ref API to getOrder/setOrder', async () => {
    const ref = React.createRef<SortableListHandle>();

    await render(
      <SortableList.Root ref={ref} defaultOrder={['a', 'b']}>
        <SortableList.Item itemKey="a" testID="item-a">
          <Text>a</Text>
        </SortableList.Item>
        <SortableList.Item itemKey="b" testID="item-b">
          <Text>b</Text>
        </SortableList.Item>
      </SortableList.Root>
    );

    expect(ref.current?.getOrder()).toEqual(['a', 'b']);

    React.act(() => {
      ref.current?.setOrder(['b', 'a']);
    });
    expect(ref.current?.getOrder()).toEqual(['b', 'a']);
  });

  it("Handle's drag start is disabled when the item or group is disabled", async () => {
    await render(<SortableListExample defaultOrder={['a']} disabled />);
    const handle = screen.getByTestId('handle-a');
    expect(handle.props.onStartShouldSetResponder()).toBe(false);
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
          <SortableListExample
            order={controlled ? ['a', 'b', 'c'] : undefined}
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
