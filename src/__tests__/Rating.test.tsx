import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Rating } from '../primitives/Rating';
import type { RatingHandle } from '../primitives/Rating';

function fireAccessibilityAction(testID: string, actionName: string) {
  return fireEvent(screen.getByTestId(testID), 'accessibilityAction', {
    nativeEvent: { actionName },
  });
}

function getItem(testID: string) {
  return screen.getByTestId(testID, { includeHiddenElements: true });
}

function RatingExample({
  value,
  defaultValue,
  onValueChange,
  max = 5,
  disabled,
}: {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  max?: number;
  disabled?: boolean;
}) {
  return (
    <Rating.Root
      testID="root"
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      max={max}
      disabled={disabled}
    >
      {Array.from({ length: max }).map((_, index) => (
        <Rating.Item key={index} index={index} testID={`item-${index}`}>
          {({ filled }) => <Text>{filled ? '★' : '☆'}</Text>}
        </Rating.Item>
      ))}
    </Rating.Root>
  );
}

describe('Rating', () => {
  it('starts at 0 by default, with no items filled', async () => {
    await render(<RatingExample />);

    expect(
      screen.queryAllByText('★', { includeHiddenElements: true })
    ).toHaveLength(0);
    expect(
      screen.getAllByText('☆', { includeHiddenElements: true })
    ).toHaveLength(5);
    const root = screen.getByTestId('root');
    expect(root.props.accessibilityValue).toEqual({ min: 0, max: 5, now: 0 });
  });

  it('respects defaultValue for uncontrolled usage', async () => {
    await render(<RatingExample defaultValue={3} />);

    expect(screen.getByTestId('root').props.accessibilityValue.now).toBe(3);
  });

  it('marks items below the value as filled', async () => {
    await render(<RatingExample defaultValue={3} />);

    // index < value is filled: items 0, 1, 2 filled; 3, 4 not.
    expect(getItem('item-0').props.children.props.children).toBe('★');
    expect(getItem('item-2').props.children.props.children).toBe('★');
    expect(getItem('item-3').props.children.props.children).toBe('☆');
    expect(getItem('item-4').props.children.props.children).toBe('☆');
  });

  it('exposes accessibilityValue and responds to accessibility actions', async () => {
    const onValueChange = jest.fn();
    await render(
      <RatingExample defaultValue={2} onValueChange={onValueChange} />
    );

    const root = screen.getByTestId('root');
    expect(root.props.accessibilityRole).toBe('adjustable');

    await fireAccessibilityAction('root', 'increment');
    expect(onValueChange).toHaveBeenCalledWith(3);

    await fireAccessibilityAction('root', 'decrement');
    expect(onValueChange).toHaveBeenCalledWith(2);
  });

  it('does not change via accessibility actions when disabled', async () => {
    const onValueChange = jest.fn();
    await render(
      <RatingExample disabled defaultValue={2} onValueChange={onValueChange} />
    );

    await fireAccessibilityAction('root', 'increment');
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('root').props.accessibilityState.disabled).toBe(
      true
    );
  });

  it('clamps defaultValue/value to [0, max]', async () => {
    await render(<RatingExample defaultValue={99} max={5} />);
    expect(screen.getByTestId('root').props.accessibilityValue.now).toBe(5);
  });

  it('supports controlled mode via value/onValueChange', async () => {
    const onValueChange = jest.fn();

    function Controlled() {
      const [value, setValue] = React.useState(1);
      return (
        <RatingExample
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
        />
      );
    }

    await render(<Controlled />);

    await fireAccessibilityAction('root', 'increment');
    expect(onValueChange).toHaveBeenCalledWith(2);
    expect(screen.getByTestId('root').props.accessibilityValue.now).toBe(2);
  });

  it('exposes an imperative ref API to getValue/setValue', async () => {
    const ref = React.createRef<RatingHandle>();

    await render(
      <Rating.Root ref={ref} defaultValue={2}>
        <Rating.Item index={0} testID="item-0">
          <Text>star</Text>
        </Rating.Item>
      </Rating.Root>
    );

    expect(ref.current?.getValue()).toBe(2);

    React.act(() => {
      ref.current?.setValue(4);
    });
    expect(ref.current?.getValue()).toBe(4);
  });

  it('hides items from the accessibility tree (Root carries the adjustable role)', async () => {
    await render(<RatingExample defaultValue={1} />);

    expect(getItem('item-0').props.accessibilityElementsHidden).toBe(true);
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
        return <RatingExample value={controlled ? 3 : undefined} />;
      }

      const { rerender } = await render(<Wrapper controlled={false} />);
      expect(errorSpy).not.toHaveBeenCalled();

      await rerender(<Wrapper controlled />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('is changing from uncontrolled to controlled')
      );
    });

    it('warns when max is not greater than 0', async () => {
      await render(<RatingExample max={0} />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('`max` must be greater than 0')
      );
    });
  });
});
