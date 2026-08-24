import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Stepper } from '../primitives/Stepper';
import type { StepperHandle } from '../primitives/Stepper';

function fireAccessibilityAction(testID: string, actionName: string) {
  return fireEvent(screen.getByTestId(testID), 'accessibilityAction', {
    nativeEvent: { actionName },
  });
}

function StepperExample({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  step,
  disabled,
}: {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}) {
  return (
    <Stepper.Root
      testID="root"
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
    >
      <Stepper.DecrementButton testID="decrement">
        <Text>-</Text>
      </Stepper.DecrementButton>
      <Stepper.Value testID="value" />
      <Stepper.IncrementButton testID="increment">
        <Text>+</Text>
      </Stepper.IncrementButton>
    </Stepper.Root>
  );
}

describe('Stepper', () => {
  it('starts at 0 by default and displays it via Stepper.Value', async () => {
    await render(<StepperExample />);
    expect(screen.getByTestId('value').props.children).toBe('0');
  });

  it('respects defaultValue for uncontrolled usage', async () => {
    await render(<StepperExample defaultValue={5} />);
    expect(screen.getByTestId('value').props.children).toBe('5');
  });

  it('increments and decrements via button presses', async () => {
    const onValueChange = jest.fn();
    await render(
      <StepperExample defaultValue={5} onValueChange={onValueChange} />
    );

    await fireEvent.press(screen.getByTestId('increment'));
    expect(onValueChange).toHaveBeenCalledWith(6);
    expect(screen.getByTestId('value').props.children).toBe('6');

    await fireEvent.press(screen.getByTestId('decrement'));
    expect(onValueChange).toHaveBeenCalledWith(5);
  });

  it('respects a custom step', async () => {
    const onValueChange = jest.fn();
    await render(
      <StepperExample
        defaultValue={10}
        step={5}
        onValueChange={onValueChange}
      />
    );

    await fireEvent.press(screen.getByTestId('increment'));
    expect(onValueChange).toHaveBeenCalledWith(15);
  });

  it('disables DecrementButton at min and IncrementButton at max', async () => {
    const onValueChange = jest.fn();
    await render(
      <StepperExample
        defaultValue={0}
        min={0}
        max={2}
        onValueChange={onValueChange}
      />
    );

    expect(
      screen.getByTestId('decrement').props.accessibilityState.disabled
    ).toBe(true);
    await fireEvent.press(screen.getByTestId('decrement'));
    expect(onValueChange).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByTestId('increment'));
    await fireEvent.press(screen.getByTestId('increment'));
    expect(
      screen.getByTestId('increment').props.accessibilityState.disabled
    ).toBe(true);
  });

  it('does not change when disabled', async () => {
    const onValueChange = jest.fn();
    await render(
      <StepperExample disabled defaultValue={5} onValueChange={onValueChange} />
    );

    await fireEvent.press(screen.getByTestId('increment'));
    await fireEvent.press(screen.getByTestId('decrement'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('exposes accessibilityValue and responds to accessibility actions', async () => {
    const onValueChange = jest.fn();
    await render(
      <StepperExample
        defaultValue={5}
        min={0}
        max={10}
        onValueChange={onValueChange}
      />
    );

    const root = screen.getByTestId('root');
    expect(root.props.accessibilityRole).toBe('adjustable');
    expect(root.props.accessibilityValue).toEqual({ min: 0, max: 10, now: 5 });

    await fireAccessibilityAction('root', 'increment');
    expect(onValueChange).toHaveBeenCalledWith(6);

    await fireAccessibilityAction('root', 'decrement');
    expect(onValueChange).toHaveBeenCalledWith(5);
  });

  it('supports controlled mode via value/onValueChange', async () => {
    const onValueChange = jest.fn();

    function Controlled() {
      const [value, setValue] = React.useState(5);
      return (
        <StepperExample
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
        />
      );
    }

    await render(<Controlled />);

    await fireEvent.press(screen.getByTestId('increment'));
    expect(onValueChange).toHaveBeenCalledWith(6);
    expect(screen.getByTestId('value').props.children).toBe('6');
  });

  it('exposes an imperative ref API to getValue/setValue/increment/decrement', async () => {
    const ref = React.createRef<StepperHandle>();

    await render(
      <Stepper.Root ref={ref} defaultValue={5}>
        <Stepper.Value testID="value" />
      </Stepper.Root>
    );

    expect(ref.current?.getValue()).toBe(5);

    React.act(() => {
      ref.current?.increment();
    });
    expect(ref.current?.getValue()).toBe(6);

    React.act(() => {
      ref.current?.decrement();
    });
    expect(ref.current?.getValue()).toBe(5);

    React.act(() => {
      ref.current?.setValue(20);
    });
    expect(ref.current?.getValue()).toBe(20);
  });

  it('supports a custom Stepper.Value render function', async () => {
    await render(
      <Stepper.Root defaultValue={3}>
        <Stepper.Value testID="value">
          {({ value }) => `Qty: ${value}`}
        </Stepper.Value>
      </Stepper.Root>
    );

    expect(screen.getByTestId('value').props.children).toBe('Qty: 3');
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
        return <StepperExample value={controlled ? 5 : undefined} />;
      }

      const { rerender } = await render(<Wrapper controlled={false} />);
      expect(errorSpy).not.toHaveBeenCalled();

      await rerender(<Wrapper controlled />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('is changing from uncontrolled to controlled')
      );
    });

    it('warns when min >= max', async () => {
      await render(<StepperExample min={10} max={5} />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('`min` (10) must be less than `max` (5)')
      );
    });

    it('warns when step is not greater than 0', async () => {
      await render(<StepperExample step={0} />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('`step` must be greater than 0')
      );
    });
  });
});
