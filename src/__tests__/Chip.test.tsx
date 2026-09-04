import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Chip } from '../primitives/Chip';
import type { ChipHandle } from '../primitives/Chip';

describe('Chip', () => {
  it('behaves as a plain (non-selectable) tag when no selection props are given', async () => {
    const onPress = jest.fn();
    await render(
      <Chip.Root testID="chip" onPress={onPress}>
        <Text>Sports</Text>
      </Chip.Root>
    );

    const chip = screen.getByTestId('chip');
    expect(chip.props.accessibilityRole).toBe('button');
    expect(chip.props.accessibilityState.selected).toBeUndefined();

    await fireEvent.press(chip);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is selectable once defaultSelected is given, and toggles on press', async () => {
    await render(
      <Chip.Root testID="chip" defaultSelected>
        <Text>Sports</Text>
      </Chip.Root>
    );

    const chip = screen.getByTestId('chip');
    expect(chip.props.accessibilityRole).toBe('togglebutton');
    expect(chip.props.accessibilityState.selected).toBe(true);

    await fireEvent.press(chip);
    expect(screen.getByTestId('chip').props.accessibilityState.selected).toBe(
      false
    );
  });

  it('treats an explicit defaultSelected={false} as opting into selectable behavior', async () => {
    // Regression test: a filter-chip row that spreads `defaultSelected={cond}`
    // across siblings must not silently downgrade the ones where `cond` is
    // `false` into non-selectable plain tags.
    await render(
      <Chip.Root testID="chip" defaultSelected={false}>
        <Text>Sports</Text>
      </Chip.Root>
    );

    const chip = screen.getByTestId('chip');
    expect(chip.props.accessibilityRole).toBe('togglebutton');
    expect(chip.props.accessibilityState.selected).toBe(false);

    await fireEvent.press(chip);
    expect(screen.getByTestId('chip').props.accessibilityState.selected).toBe(
      true
    );
  });

  it('omits the button/togglebutton accessibilityRole when removable', async () => {
    // On react-native-web, `accessibilityRole="button"`/"togglebutton"
    // renders an HTML `<button>`. `Chip.RemoveButton` (nested inside this
    // same Pressable) is itself a `<button>`, and a `<button>` can't
    // contain another `<button>` -- so a removable chip must not claim
    // either role, regardless of whether it's also selectable.
    await render(
      <Chip.Root testID="chip" defaultSelected onRemove={() => {}}>
        <Text>Sports</Text>
        <Chip.RemoveButton testID="remove" />
      </Chip.Root>
    );

    expect(screen.getByTestId('chip').props.accessibilityRole).toBeUndefined();
  });

  it('supports controlled selection via selected/onSelectedChange', async () => {
    const onSelectedChange = jest.fn();

    function Controlled() {
      const [selected, setSelected] = React.useState(false);
      return (
        <Chip.Root
          testID="chip"
          selected={selected}
          onSelectedChange={(next) => {
            onSelectedChange(next);
            setSelected(next);
          }}
        >
          <Text>Sports</Text>
        </Chip.Root>
      );
    }

    await render(<Controlled />);

    await fireEvent.press(screen.getByTestId('chip'));
    expect(onSelectedChange).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('chip').props.accessibilityState.selected).toBe(
      true
    );
  });

  it('runs both the selection toggle and the consumer onPress', async () => {
    const onPress = jest.fn();
    const onSelectedChange = jest.fn();
    await render(
      <Chip.Root
        testID="chip"
        onPress={onPress}
        onSelectedChange={onSelectedChange}
      >
        <Text>Sports</Text>
      </Chip.Root>
    );

    await fireEvent.press(screen.getByTestId('chip'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onSelectedChange).toHaveBeenCalledWith(true);
  });

  it('does not toggle or call onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(
      <Chip.Root testID="chip" disabled defaultSelected onPress={onPress}>
        <Text>Sports</Text>
      </Chip.Root>
    );

    await fireEvent.press(screen.getByTestId('chip'));
    expect(onPress).not.toHaveBeenCalled();
    // Stays at its initial (selected) state -- the press had no effect.
    expect(screen.getByTestId('chip').props.accessibilityState.selected).toBe(
      true
    );
  });

  it('calls onRemove when RemoveButton is pressed, without toggling selection', async () => {
    const onRemove = jest.fn();
    await render(
      <Chip.Root testID="chip" defaultSelected onRemove={onRemove}>
        <Text>Sports</Text>
        <Chip.RemoveButton testID="remove" />
      </Chip.Root>
    );

    await fireEvent.press(screen.getByTestId('remove'));
    expect(onRemove).toHaveBeenCalledTimes(1);
    // Pressing the nested RemoveButton must not also toggle the chip's own
    // selection state -- React Native resolves the touch to the innermost
    // Pressable only.
    expect(screen.getByTestId('chip').props.accessibilityState.selected).toBe(
      true
    );
  });

  it('supports a custom render function via children', async () => {
    await render(
      <Chip.Root testID="chip" defaultSelected>
        {({ selected }) => (
          <Text testID="label">{selected ? 'On' : 'Off'}</Text>
        )}
      </Chip.Root>
    );

    expect(screen.getByTestId('label').props.children).toBe('On');
  });

  it('exposes an imperative ref API to toggle/setSelected/getSelected', async () => {
    const ref = React.createRef<ChipHandle>();

    await render(
      <Chip.Root ref={ref} testID="chip">
        <Text>Sports</Text>
      </Chip.Root>
    );

    expect(ref.current?.getSelected()).toBe(false);

    React.act(() => {
      ref.current?.setSelected(true);
    });
    expect(ref.current?.getSelected()).toBe(true);

    React.act(() => {
      ref.current?.toggle();
    });
    expect(ref.current?.getSelected()).toBe(false);
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
          <Chip.Root testID="chip" selected={controlled ? false : undefined}>
            <Text>Sports</Text>
          </Chip.Root>
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
