import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Slider } from '../primitives/Slider';
import type { SliderHandle } from '../primitives/Slider';

// Dragging itself (PanResponder) has no real touch pipeline in Jest/RNTL, so
// it's verified manually against the running example app instead (same
// practice used for Popover/Menu positioning). What's covered here: the
// pure math (sliderMath.test.ts), the accessibility increment/decrement
// path (a real alternative input method, not just a test hook), controlled/
// uncontrolled state, the imperative ref, and dev warnings.

function increment(testID: string) {
  return fireEvent(screen.getByTestId(testID), 'accessibilityAction', {
    nativeEvent: { actionName: 'increment' },
  });
}

function decrement(testID: string) {
  return fireEvent(screen.getByTestId(testID), 'accessibilityAction', {
    nativeEvent: { actionName: 'decrement' },
  });
}

describe('Slider', () => {
  it('exposes accessibilityValue and the adjustable role on its thumb', async () => {
    await render(
      <Slider.Root defaultValue={[30]} min={0} max={100}>
        <Slider.Track>
          <Slider.Thumb testID="thumb" />
        </Slider.Track>
      </Slider.Root>
    );

    const thumb = screen.getByTestId('thumb');
    expect(thumb.props.accessibilityRole).toBe('adjustable');
    expect(thumb.props.accessibilityValue).toEqual({
      min: 0,
      max: 100,
      now: 30,
    });
  });

  it('increments and decrements via accessibility actions, respecting step', async () => {
    const onValueChange = jest.fn();
    await render(
      <Slider.Root defaultValue={[30]} step={5} onValueChange={onValueChange}>
        <Slider.Track>
          <Slider.Thumb testID="thumb" />
        </Slider.Track>
      </Slider.Root>
    );

    await increment('thumb');
    expect(onValueChange).toHaveBeenCalledWith([35]);
    expect(screen.getByTestId('thumb').props.accessibilityValue.now).toBe(35);

    await decrement('thumb');
    await decrement('thumb');
    expect(onValueChange).toHaveBeenLastCalledWith([25]);
  });

  it('clamps at min/max via accessibility actions', async () => {
    const onValueChange = jest.fn();
    await render(
      <Slider.Root defaultValue={[98]} step={5} onValueChange={onValueChange}>
        <Slider.Track>
          <Slider.Thumb testID="thumb" />
        </Slider.Track>
      </Slider.Root>
    );

    await increment('thumb');
    expect(onValueChange).toHaveBeenCalledWith([100]);

    await increment('thumb');
    // Value stays at max: setValueAtIndex is a no-op when the value doesn't change.
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it('does not move on accessibility action when disabled', async () => {
    const onValueChange = jest.fn();
    await render(
      <Slider.Root defaultValue={[30]} disabled onValueChange={onValueChange}>
        <Slider.Track>
          <Slider.Thumb testID="thumb" />
        </Slider.Track>
      </Slider.Root>
    );

    expect(screen.getByTestId('thumb').props.accessibilityState.disabled).toBe(
      true
    );

    await increment('thumb');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('never lets two thumbs cross when driven via accessibility actions', async () => {
    const onValueChange = jest.fn();
    await render(
      <Slider.Root
        defaultValue={[40, 50]}
        step={5}
        onValueChange={onValueChange}
      >
        <Slider.Track>
          <Slider.Thumb testID="thumb-0" index={0} />
          <Slider.Thumb testID="thumb-1" index={1} />
        </Slider.Track>
      </Slider.Root>
    );

    // Push the low thumb up repeatedly — it should stop at the high thumb's value, not cross it.
    for (let i = 0; i < 5; i++) {
      await increment('thumb-0');
    }

    expect(onValueChange).toHaveBeenLastCalledWith([50, 50]);
  });

  it('supports controlled mode via value/onValueChange', async () => {
    const onValueChange = jest.fn();

    function Controlled() {
      const [value, setValue] = React.useState([20]);
      return (
        <Slider.Root
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
        >
          <Slider.Track>
            <Slider.Thumb testID="thumb" />
          </Slider.Track>
        </Slider.Root>
      );
    }

    await render(<Controlled />);

    await increment('thumb');
    expect(onValueChange).toHaveBeenCalledWith([21]);
    expect(screen.getByTestId('thumb').props.accessibilityValue.now).toBe(21);
  });

  it('exposes an imperative ref API to getValue/setValue', async () => {
    const ref = React.createRef<SliderHandle>();

    await render(
      <Slider.Root ref={ref} defaultValue={[10]}>
        <Slider.Track>
          <Slider.Thumb testID="thumb" />
        </Slider.Track>
      </Slider.Root>
    );

    expect(ref.current?.getValue()).toEqual([10]);

    React.act(() => {
      ref.current?.setValue([60]);
    });
    expect(ref.current?.getValue()).toEqual([60]);
    expect(screen.getByTestId('thumb').props.accessibilityValue.now).toBe(60);
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
          <Slider.Root
            value={controlled ? [10] : undefined}
            defaultValue={[10]}
          >
            <Slider.Track>
              <Slider.Thumb />
            </Slider.Track>
          </Slider.Root>
        );
      }

      const { rerender } = await render(<Wrapper controlled={false} />);
      expect(errorSpy).not.toHaveBeenCalled();

      await rerender(<Wrapper controlled />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('is changing from uncontrolled to controlled')
      );
    });

    it('warns when min >= max', async () => {
      await render(
        <Slider.Root min={10} max={5}>
          <Slider.Track>
            <Slider.Thumb />
          </Slider.Track>
        </Slider.Root>
      );

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('`min` (10) must be less than `max` (5)')
      );
    });

    it('warns when step is not greater than 0', async () => {
      await render(
        <Slider.Root step={0}>
          <Slider.Track>
            <Slider.Thumb />
          </Slider.Track>
        </Slider.Root>
      );

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('`step` must be greater than 0')
      );
    });

    it('warns when initial values are not in ascending order', async () => {
      await render(
        <Slider.Root defaultValue={[50, 10]}>
          <Slider.Track>
            <Slider.Thumb index={0} />
            <Slider.Thumb index={1} />
          </Slider.Track>
        </Slider.Root>
      );

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('must be in ascending order')
      );
    });
  });
});
