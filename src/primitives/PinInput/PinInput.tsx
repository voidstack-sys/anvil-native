import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type ViewProps,
} from 'react-native';
import {
  controlledChangeMessage,
  useWarnOnceWhen,
} from '../../internal/devWarnings';
import {
  useRegisteredValue,
  useValueRegistry,
} from '../../internal/useValueRegistry';

type TextInputRef = React.ComponentRef<typeof TextInput>;

interface PinInputContextValue {
  value: string;
  length: number;
  disabled: boolean;
  isFocused: boolean;
  focusInput: () => void;
  registerIndex: (index: string) => void;
  unregisterIndex: (index: string) => void;
}

const PinInputContext = createContext<PinInputContextValue | null>(null);

function usePinInputContext(component: string): PinInputContextValue {
  const context = useContext(PinInputContext);
  if (!context) {
    throw new Error(
      `PinInput.${component} must be used within a PinInput.Root`
    );
  }
  return context;
}

export interface PinInputRootProps extends Omit<ViewProps, 'children'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Fires once, exactly when the value transitions to `length` characters long. */
  onComplete?: (value: string) => void;
  /** How many characters/slots. Defaults to 6. */
  length?: number;
  /** `'numeric'` filters out non-digit input and shows a number pad. Defaults to `'numeric'`. */
  type?: 'numeric' | 'text';
  disabled?: boolean;
  /** Passed to the real (visually hidden) `TextInput` — the element screen readers actually interact with. */
  accessibilityLabel?: string;
  children: React.ReactNode;
}

export interface PinInputHandle {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  getValue: () => string;
  setValue: (value: string) => void;
}

const Root = forwardRef<PinInputHandle, PinInputRootProps>(
  function PinInputRoot(
    {
      value,
      defaultValue = '',
      onValueChange,
      onComplete,
      length = 6,
      type = 'numeric',
      disabled = false,
      accessibilityLabel,
      children,
      ...viewProps
    },
    ref
  ) {
    const isControlled = value !== undefined;
    const initialIsControlled = useRef(isControlled).current;

    useWarnOnceWhen(isControlled !== initialIsControlled, () =>
      controlledChangeMessage(
        'PinInput.Root',
        initialIsControlled,
        isControlled
      )
    );
    useWarnOnceWhen(
      length <= 0,
      () =>
        `PinInput.Root: \`length\` must be greater than 0, received ${length}.`
    );

    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
    const currentValue = isControlled ? (value ?? '') : uncontrolledValue;

    const setValue = useCallback(
      (next: string) => {
        const filtered =
          type === 'numeric' ? next.replace(/[^0-9]/g, '') : next;
        const truncated = filtered.slice(0, length);
        if (!isControlled) {
          setUncontrolledValue(truncated);
        }
        onValueChange?.(truncated);
      },
      [isControlled, onValueChange, type, length]
    );

    const previousValueRef = useRef(currentValue);
    useEffect(() => {
      if (
        currentValue.length >= length &&
        previousValueRef.current.length < length
      ) {
        onComplete?.(currentValue);
      }
      previousValueRef.current = currentValue;
    }, [currentValue, length, onComplete]);

    const inputRef = useRef<TextInputRef>(null);
    const [isFocused, setIsFocused] = useState(false);

    const focusInput = useCallback(() => {
      if (disabled) return;
      inputRef.current?.focus();
    }, [disabled]);

    useImperativeHandle(
      ref,
      () => ({
        focus: focusInput,
        blur: () => inputRef.current?.blur(),
        clear: () => setValue(''),
        getValue: () => currentValue,
        setValue,
      }),
      [focusInput, setValue, currentValue]
    );

    const { register: registerIndex, unregister: unregisterIndex } =
      useValueRegistry('PinInput');

    const contextValue = useMemo(
      () => ({
        value: currentValue,
        length,
        disabled,
        isFocused,
        focusInput,
        registerIndex,
        unregisterIndex,
      }),
      [
        currentValue,
        length,
        disabled,
        isFocused,
        focusInput,
        registerIndex,
        unregisterIndex,
      ]
    );

    return (
      <PinInputContext.Provider value={contextValue}>
        <View {...viewProps}>
          <TextInput
            ref={inputRef}
            testID="anvil-pin-input"
            value={currentValue}
            onChangeText={setValue}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            editable={!disabled}
            keyboardType={type === 'numeric' ? 'number-pad' : 'default'}
            textContentType="oneTimeCode"
            autoComplete={type === 'numeric' ? 'sms-otp' : 'off'}
            maxLength={length}
            caretHidden
            accessibilityLabel={accessibilityLabel}
            style={styles.hiddenInput}
          />
          {children}
        </View>
      </PinInputContext.Provider>
    );
  }
);
Root.displayName = 'PinInput.Root';

const styles = StyleSheet.create({
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});

export type PinInputSlotRenderProps = {
  char: string | undefined;
  /** Whether this is the slot that would receive the next typed character. */
  active: boolean;
};

export interface PinInputSlotProps extends Omit<ViewProps, 'children'> {
  /** This slot's position (0-based) in the code. */
  index: number;
  children?:
    React.ReactNode | ((state: PinInputSlotRenderProps) => React.ReactNode);
}

function Slot({ index, children, ...viewProps }: PinInputSlotProps) {
  const {
    value,
    length,
    disabled,
    isFocused,
    focusInput,
    registerIndex,
    unregisterIndex,
  } = usePinInputContext('Slot');

  useWarnOnceWhen(
    index < 0 || index >= length,
    () =>
      `PinInput.Slot: \`index\` (${index}) is out of range for a length of ${length}.`
  );
  useRegisteredValue(registerIndex, unregisterIndex, String(index));

  const char = value[index];
  const active = isFocused && index === Math.min(value.length, length - 1);

  return (
    <Pressable
      onPress={focusInput}
      disabled={disabled}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      {...viewProps}
    >
      {typeof children === 'function' ? children({ char, active }) : children}
    </Pressable>
  );
}
Slot.displayName = 'PinInput.Slot';

export const PinInput = {
  Root,
  Slot,
};
