import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PinInput } from '../primitives/PinInput';
import type { PinInputHandle } from '../primitives/PinInput';

function PinInputExample({
  value,
  defaultValue,
  onValueChange,
  onComplete,
  length = 4,
  type,
  disabled,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  type?: 'numeric' | 'text';
  disabled?: boolean;
}) {
  return (
    <PinInput.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      onComplete={onComplete}
      length={length}
      type={type}
      disabled={disabled}
    >
      {Array.from({ length }).map((_, index) => (
        <PinInput.Slot key={index} index={index} testID={`slot-${index}`}>
          {({ char, active }) => (
            <Text testID={`slot-${index}-text`}>
              {char ?? (active ? '|' : '_')}
            </Text>
          )}
        </PinInput.Slot>
      ))}
    </PinInput.Root>
  );
}

function typeInto(text: string) {
  return fireEvent.changeText(screen.getByTestId('anvil-pin-input'), text);
}

// Slots are `accessibilityElementsHidden` (purely decorative — the real
// TextInput is the accessible element), so RNTL's default queries skip them.
function getSlot(testID: string) {
  return screen.getByTestId(testID, { includeHiddenElements: true });
}

describe('PinInput', () => {
  it('shows empty slots by default', async () => {
    await render(<PinInputExample />);

    expect(getSlot('slot-0-text').props.children).toBe('_');
    expect(getSlot('slot-3-text').props.children).toBe('_');
  });

  it('reflects typed characters in the matching slots and calls onValueChange', async () => {
    const onValueChange = jest.fn();
    await render(<PinInputExample onValueChange={onValueChange} />);

    await typeInto('12');
    expect(onValueChange).toHaveBeenCalledWith('12');
    expect(getSlot('slot-0-text').props.children).toBe('1');
    expect(getSlot('slot-1-text').props.children).toBe('2');
  });

  it('filters non-numeric characters by default (type="numeric")', async () => {
    const onValueChange = jest.fn();
    await render(<PinInputExample onValueChange={onValueChange} />);

    await typeInto('1a2b');
    expect(onValueChange).toHaveBeenCalledWith('12');
  });

  it('allows any character when type="text"', async () => {
    const onValueChange = jest.fn();
    await render(<PinInputExample type="text" onValueChange={onValueChange} />);

    await typeInto('a1b2');
    expect(onValueChange).toHaveBeenCalledWith('a1b2');
  });

  it('truncates input to `length`', async () => {
    const onValueChange = jest.fn();
    await render(<PinInputExample length={4} onValueChange={onValueChange} />);

    await typeInto('123456');
    expect(onValueChange).toHaveBeenCalledWith('1234');
  });

  it('calls onComplete exactly once when the value reaches `length`', async () => {
    const onComplete = jest.fn();
    await render(<PinInputExample length={4} onComplete={onComplete} />);

    await typeInto('123');
    expect(onComplete).not.toHaveBeenCalled();

    await typeInto('1234');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('1234');

    // Re-rendering with the same complete value shouldn't fire it again.
    await typeInto('1234');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('marks the next-empty slot as active while focused', async () => {
    await render(<PinInputExample />);

    await fireEvent(screen.getByTestId('anvil-pin-input'), 'focus');
    await typeInto('1');

    expect(getSlot('slot-1-text').props.children).toBe('|');
    expect(getSlot('slot-2-text').props.children).toBe('_');
  });

  it('pressing a slot focuses the underlying input without throwing', async () => {
    await render(<PinInputExample />);

    await expect(fireEvent.press(getSlot('slot-2'))).resolves.not.toThrow();
  });

  it('supports controlled mode via value/onValueChange', async () => {
    const onValueChange = jest.fn();

    function Controlled() {
      const [value, setValue] = React.useState('');
      return (
        <PinInputExample
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
        />
      );
    }

    await render(<Controlled />);

    await typeInto('99');
    expect(onValueChange).toHaveBeenCalledWith('99');
    expect(getSlot('slot-0-text').props.children).toBe('9');
  });

  it('exposes an imperative ref API to focus/blur/clear/getValue/setValue', async () => {
    const ref = React.createRef<PinInputHandle>();

    await render(
      <PinInput.Root ref={ref} defaultValue="12" length={4}>
        <PinInput.Slot index={0} testID="slot-0">
          <Text>slot</Text>
        </PinInput.Slot>
      </PinInput.Root>
    );

    expect(ref.current?.getValue()).toBe('12');

    React.act(() => {
      ref.current?.setValue('99');
    });
    expect(ref.current?.getValue()).toBe('99');

    React.act(() => {
      ref.current?.clear();
    });
    expect(ref.current?.getValue()).toBe('');

    await expect(
      new Promise<void>((resolve) => {
        React.act(() => {
          ref.current?.focus();
          ref.current?.blur();
        });
        resolve();
      })
    ).resolves.not.toThrow();
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
        return <PinInputExample value={controlled ? '' : undefined} />;
      }

      const { rerender } = await render(<Wrapper controlled={false} />);
      expect(errorSpy).not.toHaveBeenCalled();

      await rerender(<Wrapper controlled />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('is changing from uncontrolled to controlled')
      );
    });

    it('warns when length is not greater than 0', async () => {
      await render(<PinInputExample length={0} />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('`length` must be greater than 0')
      );
    });

    it('warns when a Slot index is out of range', async () => {
      await render(
        <PinInput.Root length={4}>
          <PinInput.Slot index={9} testID="bad-slot">
            <Text>x</Text>
          </PinInput.Slot>
        </PinInput.Root>
      );

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('is out of range')
      );
    });

    it('warns when two Slots share the same index', async () => {
      await render(
        <PinInput.Root length={4}>
          <PinInput.Slot index={0} testID="slot-a">
            <Text>a</Text>
          </PinInput.Slot>
          <PinInput.Slot index={0} testID="slot-b">
            <Text>b</Text>
          </PinInput.Slot>
        </PinInput.Root>
      );

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('found more than one item with the value')
      );
    });
  });
});
