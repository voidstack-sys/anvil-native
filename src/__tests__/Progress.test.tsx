import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Progress } from '../primitives/Progress';

describe('Progress', () => {
  it('exposes accessibilityValue with the current value, max, and a percentage label', async () => {
    await render(
      <Progress.Root testID="progress" value={30}>
        <Progress.Indicator testID="indicator">
          <Text>30%</Text>
        </Progress.Indicator>
      </Progress.Root>
    );

    expect(screen.getByTestId('progress').props.accessibilityValue).toEqual({
      min: 0,
      max: 100,
      now: 30,
      text: '30%',
    });
    expect(screen.getByTestId('progress').props.accessibilityState.busy).toBe(
      false
    );
  });

  it('respects a custom max when computing the percentage label', async () => {
    await render(<Progress.Root testID="progress" value={5} max={10} />);

    expect(screen.getByTestId('progress').props.accessibilityValue).toEqual({
      min: 0,
      max: 10,
      now: 5,
      text: '50%',
    });
  });

  it('supports a custom getValueLabel', async () => {
    await render(
      <Progress.Root
        testID="progress"
        value={3}
        max={10}
        getValueLabel={(value, max) => `${value} of ${max}`}
      />
    );

    expect(screen.getByTestId('progress').props.accessibilityValue.text).toBe(
      '3 of 10'
    );
  });

  it('is indeterminate when value is null: no `now`, and accessibilityState.busy', async () => {
    await render(<Progress.Root testID="progress" value={null} />);

    expect(screen.getByTestId('progress').props.accessibilityValue).toEqual({
      min: 0,
      max: 100,
    });
    expect(screen.getByTestId('progress').props.accessibilityState.busy).toBe(
      true
    );
  });

  it('passes value/max/percentage/complete to the Root render-prop', async () => {
    let received: unknown;
    await render(
      <Progress.Root value={25} max={50}>
        {(state) => {
          received = state;
          return null;
        }}
      </Progress.Root>
    );

    expect(received).toEqual({
      value: 25,
      max: 50,
      percentage: 50,
      complete: false,
    });
  });

  it('marks complete when value equals max', async () => {
    let received: unknown;
    await render(
      <Progress.Root value={10} max={10}>
        {(state) => {
          received = state;
          return null;
        }}
      </Progress.Root>
    );

    expect(received).toMatchObject({ complete: true, percentage: 100 });
  });

  it('passes the same state to Progress.Indicator render-prop', async () => {
    let received: unknown;
    await render(
      <Progress.Root value={20} max={40}>
        <Progress.Indicator>
          {(state) => {
            received = state;
            return null;
          }}
        </Progress.Indicator>
      </Progress.Root>
    );

    expect(received).toEqual({
      value: 20,
      max: 40,
      percentage: 50,
      complete: false,
    });
  });

  it('clamps percentage to [0, 100] even if value is out of range', async () => {
    let received: unknown;
    await render(
      <Progress.Root value={150} max={100}>
        {(state) => {
          received = state;
          return null;
        }}
      </Progress.Root>
    );

    expect((received as { percentage: number }).percentage).toBe(100);
  });

  describe('dev warnings', () => {
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
      errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    it('warns when value is outside the 0..max range', async () => {
      await render(<Progress.Root value={150} />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('is outside the valid range')
      );
    });

    it('warns when max is not greater than 0', async () => {
      await render(<Progress.Root value={0} max={0} />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('`max` must be greater than 0')
      );
    });

    it('does not warn for a valid value within range', async () => {
      await render(<Progress.Root value={50} />);

      expect(errorSpy).not.toHaveBeenCalled();
    });
  });
});
