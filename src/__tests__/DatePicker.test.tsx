import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { DatePicker } from '../primitives/DatePicker';
import type { DatePickerHandle } from '../primitives/DatePicker';

function fireAccessibilityAction(testID: string, actionName: string) {
  return fireEvent(screen.getByTestId(testID), 'accessibilityAction', {
    nativeEvent: { actionName },
  });
}

function DatePickerExample({
  value,
  defaultValue,
  onValueChange,
  minimumDate,
  maximumDate,
  disabled,
}: {
  value?: Date;
  defaultValue?: Date;
  onValueChange?: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
}) {
  return (
    <DatePicker.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      minimumDate={minimumDate}
      maximumDate={maximumDate}
      disabled={disabled}
    >
      <DatePicker.Column field="day" testID="day-column">
        {(day, { selected }) => (
          <Text testID={`day-${day}`}>
            {day}
            {selected ? ' (selected)' : ''}
          </Text>
        )}
      </DatePicker.Column>
      <DatePicker.Column field="month" testID="month-column">
        {(month, { selected }) => (
          <Text testID={`month-${month}`}>
            {month}
            {selected ? ' (selected)' : ''}
          </Text>
        )}
      </DatePicker.Column>
      <DatePicker.Column field="year" testID="year-column">
        {(year, { selected }) => (
          <Text testID={`year-${year}`}>
            {year}
            {selected ? ' (selected)' : ''}
          </Text>
        )}
      </DatePicker.Column>
    </DatePicker.Root>
  );
}

describe('DatePicker', () => {
  it('derives day/month/year from the initial value', async () => {
    await render(<DatePickerExample defaultValue={new Date(2026, 5, 15)} />);
    expect(screen.getByTestId('day-15').props.children.join('')).toContain(
      '(selected)'
    );
    expect(screen.getByTestId('month-5').props.children.join('')).toContain(
      '(selected)'
    );
    expect(screen.getByTestId('year-2026').props.children.join('')).toContain(
      '(selected)'
    );
  });

  it('moves the day column forward on an increment accessibility action', async () => {
    const onValueChange = jest.fn();
    await render(
      <DatePickerExample
        defaultValue={new Date(2026, 5, 15)}
        onValueChange={onValueChange}
      />
    );

    await fireAccessibilityAction('day-column', 'increment');
    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 5, 16));
  });

  it('moves the month column back on a decrement accessibility action', async () => {
    const onValueChange = jest.fn();
    await render(
      <DatePickerExample
        defaultValue={new Date(2026, 5, 15)}
        onValueChange={onValueChange}
      />
    );

    await fireAccessibilityAction('month-column', 'decrement');
    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 4, 15));
  });

  it('clamps the day when switching to a shorter month', async () => {
    const onValueChange = jest.fn();
    await render(
      // January 31st -> incrementing the month to February must clamp the day.
      <DatePickerExample
        defaultValue={new Date(2026, 0, 31)}
        onValueChange={onValueChange}
      />
    );

    await fireAccessibilityAction('month-column', 'increment');
    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 1, 28));
  });

  it('clamps a resulting date into minimumDate/maximumDate', async () => {
    const onValueChange = jest.fn();
    await render(
      <DatePickerExample
        // Already at the boundary day -- the day column's own values still
        // go past it (June has 30 days), so this exercises Root's own
        // range-clamping of the committed date, not just the column's list.
        defaultValue={new Date(2026, 5, 20)}
        minimumDate={new Date(2026, 5, 1)}
        maximumDate={new Date(2026, 5, 20)}
        onValueChange={onValueChange}
      />
    );

    await fireAccessibilityAction('day-column', 'increment');
    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 5, 20));
  });

  it('does not move via accessibility action when disabled', async () => {
    const onValueChange = jest.fn();
    await render(
      <DatePickerExample
        defaultValue={new Date(2026, 5, 15)}
        onValueChange={onValueChange}
        disabled
      />
    );

    await fireAccessibilityAction('day-column', 'increment');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('selects a nearby row on tap', async () => {
    const onValueChange = jest.fn();
    await render(
      <DatePickerExample
        defaultValue={new Date(2026, 5, 15)}
        onValueChange={onValueChange}
      />
    );

    await fireEvent.press(screen.getByTestId('day-16'));
    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 5, 16));
  });

  it('supports controlled mode via value/onValueChange', async () => {
    const onValueChange = jest.fn();

    function Controlled() {
      const [value, setValue] = React.useState(new Date(2026, 5, 15));
      return (
        <DatePickerExample
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
        />
      );
    }

    await render(<Controlled />);
    await fireAccessibilityAction('day-column', 'increment');
    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 5, 16));
    expect(screen.getByTestId('day-16').props.children.join('')).toContain(
      '(selected)'
    );
  });

  it('exposes an imperative ref API to getValue/setValue', async () => {
    const ref = React.createRef<DatePickerHandle>();
    await render(
      <DatePicker.Root ref={ref} defaultValue={new Date(2026, 5, 15)}>
        <DatePicker.Column field="day">
          {(day) => <Text>{day}</Text>}
        </DatePicker.Column>
      </DatePicker.Root>
    );

    expect(ref.current?.getValue()).toEqual(new Date(2026, 5, 15));
    React.act(() => {
      ref.current?.setValue(new Date(2026, 6, 1));
    });
    expect(ref.current?.getValue()).toEqual(new Date(2026, 6, 1));
  });

  it("Column's drag gesture never claims on mere touch-down", async () => {
    await render(<DatePickerExample defaultValue={new Date(2026, 5, 15)} />);
    const trackNode = screen.getByTestId('day-column')
      .children[0] as unknown as {
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
          <DatePickerExample
            value={controlled ? new Date(2026, 5, 15) : undefined}
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

    it('warns when minimumDate is after maximumDate', async () => {
      await render(
        <DatePickerExample
          defaultValue={new Date(2026, 5, 15)}
          minimumDate={new Date(2026, 5, 20)}
          maximumDate={new Date(2026, 5, 1)}
        />
      );

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('`minimumDate` must not be after `maximumDate`')
      );
    });
  });
});
