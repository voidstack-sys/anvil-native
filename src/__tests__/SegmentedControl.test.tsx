import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SegmentedControl } from '../primitives/SegmentedControl';
import type { SegmentedControlHandle } from '../primitives/SegmentedControl';

function fireAccessibilityAction(testID: string, actionName: string) {
  return fireEvent(screen.getByTestId(testID), 'accessibilityAction', {
    nativeEvent: { actionName },
  });
}

function SegmentedControlExample({
  value,
  defaultValue,
  onValueChange,
  disabled,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <SegmentedControl.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SegmentedControl.List testID="list">
        <SegmentedControl.Indicator testID="indicator" />
        {['day', 'week', 'month'].map((option) => (
          <SegmentedControl.Item
            key={option}
            value={option}
            testID={`item-${option}`}
          >
            {({ selected }) => (
              <Text>
                {option}
                {selected ? ' (selected)' : ''}
              </Text>
            )}
          </SegmentedControl.Item>
        ))}
      </SegmentedControl.List>
    </SegmentedControl.Root>
  );
}

describe('SegmentedControl', () => {
  it('selects a segment on press', async () => {
    const onValueChange = jest.fn();
    await render(
      <SegmentedControlExample
        defaultValue="day"
        onValueChange={onValueChange}
      />
    );

    await fireEvent.press(screen.getByTestId('item-week'));
    expect(onValueChange).toHaveBeenCalledWith('week');
  });

  it('does not select on press when the group is disabled', async () => {
    const onValueChange = jest.fn();
    await render(
      <SegmentedControlExample
        defaultValue="day"
        onValueChange={onValueChange}
        disabled
      />
    );

    await fireEvent.press(screen.getByTestId('item-week'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('marks the active item as selected', async () => {
    await render(<SegmentedControlExample defaultValue="week" />);
    expect(screen.getByText('week (selected)')).toBeTruthy();
    expect(screen.getByText('day')).toBeTruthy();
  });

  it('supports controlled mode via value/onValueChange', async () => {
    const onValueChange = jest.fn();

    function Controlled() {
      const [value, setValue] = React.useState('day');
      return (
        <SegmentedControlExample
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
        />
      );
    }

    await render(<Controlled />);
    await fireEvent.press(screen.getByTestId('item-month'));
    expect(onValueChange).toHaveBeenCalledWith('month');
    expect(screen.getByText('month (selected)')).toBeTruthy();
  });

  it('exposes an imperative ref API to select/getValue', async () => {
    const ref = React.createRef<SegmentedControlHandle>();
    await render(
      <SegmentedControl.Root ref={ref} defaultValue="day">
        <SegmentedControl.List>
          <SegmentedControl.Item value="day">
            <Text>day</Text>
          </SegmentedControl.Item>
          <SegmentedControl.Item value="week">
            <Text>week</Text>
          </SegmentedControl.Item>
        </SegmentedControl.List>
      </SegmentedControl.Root>
    );

    expect(ref.current?.getValue()).toBe('day');
    React.act(() => {
      ref.current?.select('week');
    });
    expect(ref.current?.getValue()).toBe('week');
  });

  it('moves to the next segment on an increment accessibility action', async () => {
    const onValueChange = jest.fn();
    await render(
      <SegmentedControlExample
        defaultValue="day"
        onValueChange={onValueChange}
      />
    );

    await fireAccessibilityAction('list', 'increment');
    expect(onValueChange).toHaveBeenCalledWith('week');
  });

  it('moves to the previous segment on a decrement accessibility action', async () => {
    const onValueChange = jest.fn();
    await render(
      <SegmentedControlExample
        defaultValue="week"
        onValueChange={onValueChange}
      />
    );

    await fireAccessibilityAction('list', 'decrement');
    expect(onValueChange).toHaveBeenCalledWith('day');
  });

  it('clamps accessibility-driven moves at the first/last segment', async () => {
    const onValueChange = jest.fn();
    await render(
      <SegmentedControlExample
        defaultValue="day"
        onValueChange={onValueChange}
      />
    );

    await fireAccessibilityAction('list', 'decrement');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("List's scrub gesture never claims on mere touch-down", async () => {
    await render(<SegmentedControlExample defaultValue="day" />);
    const trackNode = screen.getByTestId('list').children[0] as unknown as {
      props: { onStartShouldSetResponder: () => boolean };
    };
    expect(trackNode.props.onStartShouldSetResponder()).toBe(false);
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
          <SegmentedControlExample value={controlled ? 'day' : undefined} />
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
