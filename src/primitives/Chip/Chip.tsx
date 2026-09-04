import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Pressable, type PressableProps } from 'react-native';
import {
  controlledChangeMessage,
  useWarnOnceWhen,
} from '../../internal/devWarnings';

interface ChipContextValue {
  onRemove: (() => void) | undefined;
}

const ChipContext = createContext<ChipContextValue | null>(null);

function useChipContext(component: string): ChipContextValue {
  const context = useContext(ChipContext);
  if (!context) {
    throw new Error(`Chip.${component} must be used within a Chip.Root`);
  }
  return context;
}

export type ChipRenderProps = {
  selected: boolean;
  disabled: boolean;
};

export interface ChipRootProps extends Omit<
  PressableProps,
  'children' | 'disabled'
> {
  /**
   * Omit both `selected` and `defaultSelected` entirely for a plain
   * (non-selectable) tag -- selection is opt-in. Passing `defaultSelected`,
   * even as `false`, still opts in (it starts unselected but stays
   * toggleable).
   */
  selected?: boolean;
  defaultSelected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  disabled?: boolean;
  /**
   * Called when `Chip.RemoveButton` is pressed. Its presence is what makes a
   * chip "removable" -- omit it for a chip with no dismiss affordance.
   */
  onRemove?: () => void;
  children: React.ReactNode | ((state: ChipRenderProps) => React.ReactNode);
}

export interface ChipHandle {
  toggle: () => void;
  setSelected: (selected: boolean) => void;
  getSelected: () => boolean;
}

const Root = forwardRef<ChipHandle, ChipRootProps>(function ChipRoot(
  {
    selected,
    defaultSelected,
    onSelectedChange,
    disabled = false,
    onRemove,
    onPress,
    children,
    ...pressableProps
  },
  ref
) {
  const isControlled = selected !== undefined;
  const initialIsControlled = useRef(isControlled).current;

  useWarnOnceWhen(isControlled !== initialIsControlled, () =>
    controlledChangeMessage(
      'Chip.Root',
      initialIsControlled,
      isControlled,
      'selected'
    )
  );

  const [uncontrolledSelected, setUncontrolledSelected] = useState(
    defaultSelected ?? false
  );
  const currentSelected = isControlled
    ? (selected ?? false)
    : uncontrolledSelected;

  const setSelected = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setUncontrolledSelected(next);
      }
      onSelectedChange?.(next);
    },
    [isControlled, onSelectedChange]
  );

  const toggle = useCallback(
    () => setSelected(!currentSelected),
    [setSelected, currentSelected]
  );

  useImperativeHandle(
    ref,
    () => ({
      toggle,
      setSelected,
      getSelected: () => currentSelected,
    }),
    [toggle, setSelected, currentSelected]
  );

  // Selection is opt-in: a chip with none of `selected`, `defaultSelected`
  // (checked against the raw prop -- `defaultSelected={false}` still counts
  // as opting in), or `onSelectedChange` behaves as a plain, non-selectable
  // tag, and pressing it only runs the consumer's own `onPress` (if any).
  const isSelectable =
    isControlled ||
    defaultSelected !== undefined ||
    onSelectedChange !== undefined;
  const isRemovable = onRemove !== undefined;

  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      if (disabled) return;
      if (isSelectable) toggle();
      onPress?.(event);
    },
    [disabled, isSelectable, toggle, onPress]
  );

  const contextValue = React.useMemo(() => ({ onRemove }), [onRemove]);

  return (
    <ChipContext.Provider value={contextValue}>
      <Pressable
        // Web only: a removable chip nests `Chip.RemoveButton` (itself
        // `accessibilityRole="button"`, an HTML `<button>` on react-native-
        // web) inside this Pressable. Giving *this* Pressable a "button"/
        // "togglebutton" role would render it as a `<button>` too, and a
        // `<button>` can't contain another `<button>` -- invalid HTML that
        // React renders. Native has no such restriction (nested Pressables
        // resolve to the innermost one fine there), so this only changes
        // which host element web renders; press handling is unaffected.
        accessibilityRole={
          isRemovable ? undefined : isSelectable ? 'togglebutton' : 'button'
        }
        accessibilityState={
          isSelectable ? { selected: currentSelected, disabled } : { disabled }
        }
        disabled={disabled}
        onPress={handlePress}
        {...pressableProps}
      >
        {typeof children === 'function'
          ? children({ selected: currentSelected, disabled })
          : children}
      </Pressable>
    </ChipContext.Provider>
  );
});
Root.displayName = 'Chip.Root';

export type ChipRemoveButtonProps = PressableProps;

// Nested inside `Chip.Root`'s own Pressable. React Native's responder system
// resolves a touch to the innermost view that claims it, so pressing this
// button fires only its own `onPress` -- the outer chip's press (and any
// selection toggle) never also fires.
function RemoveButton({ onPress, ...pressableProps }: ChipRemoveButtonProps) {
  const { onRemove } = useChipContext('RemoveButton');

  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      onPress?.(event);
      onRemove?.();
    },
    [onPress, onRemove]
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      {...pressableProps}
    />
  );
}
RemoveButton.displayName = 'Chip.RemoveButton';

export const Chip = {
  Root,
  RemoveButton,
};
