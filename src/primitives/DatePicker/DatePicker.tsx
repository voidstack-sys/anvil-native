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
  PanResponder,
  Pressable,
  View,
  type GestureResponderEvent,
  type PanResponderGestureState,
  type ViewProps,
} from 'react-native';
import {
  clampDateToRange,
  clampDay,
  daysInMonth,
} from '../../internal/dateMath';
import {
  controlledChangeMessage,
  useWarnOnceWhen,
} from '../../internal/devWarnings';
import {
  clampWheelDragOffset,
  resolveWheelIndexFromRelease,
  wheelTrackTranslateY,
} from '../../internal/wheelPickerMath';

export type DatePickerField = 'day' | 'month' | 'year';

interface DatePickerContextValue {
  day: number;
  month: number;
  year: number;
  dayValues: number[];
  monthValues: number[];
  yearValues: number[];
  disabled: boolean;
  setField: (field: DatePickerField, value: number) => void;
}

const DatePickerContext = createContext<DatePickerContextValue | null>(null);

function useDatePickerContext(component: string): DatePickerContextValue {
  const context = useContext(DatePickerContext);
  if (!context) {
    throw new Error(
      `DatePicker.${component} must be used within a DatePicker.Root`
    );
  }
  return context;
}

export interface DatePickerRootProps extends Omit<ViewProps, 'children'> {
  value?: Date;
  defaultValue?: Date;
  onValueChange?: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  children: React.ReactNode;
}

export interface DatePickerHandle {
  getValue: () => Date;
  setValue: (date: Date) => void;
}

const Root = forwardRef<DatePickerHandle, DatePickerRootProps>(
  function DatePickerRoot(
    {
      value,
      defaultValue,
      onValueChange,
      minimumDate,
      maximumDate,
      disabled = false,
      children,
      ...viewProps
    },
    ref
  ) {
    const isControlled = value !== undefined;
    const initialIsControlled = useRef(isControlled).current;

    useWarnOnceWhen(isControlled !== initialIsControlled, () =>
      controlledChangeMessage(
        'DatePicker.Root',
        initialIsControlled,
        isControlled
      )
    );
    useWarnOnceWhen(
      !!minimumDate &&
        !!maximumDate &&
        minimumDate.getTime() > maximumDate.getTime(),
      () => 'DatePicker.Root: `minimumDate` must not be after `maximumDate`.'
    );

    const [uncontrolledValue, setUncontrolledValue] = useState<Date>(
      () => defaultValue ?? new Date()
    );
    const currentValue = isControlled
      ? (value ?? uncontrolledValue)
      : uncontrolledValue;

    const commit = useCallback(
      (next: Date) => {
        const clamped = clampDateToRange(next, minimumDate, maximumDate);
        if (!isControlled) {
          setUncontrolledValue(clamped);
        }
        onValueChange?.(clamped);
      },
      [isControlled, onValueChange, minimumDate, maximumDate]
    );

    const day = currentValue.getDate();
    const month = currentValue.getMonth();
    const year = currentValue.getFullYear();

    const setField = useCallback(
      (field: DatePickerField, next: number) => {
        const nextYear = field === 'year' ? next : year;
        const nextMonth = field === 'month' ? next : month;
        const nextDay = field === 'day' ? next : day;
        const clampedDay = clampDay(nextDay, nextYear, nextMonth);
        commit(new Date(nextYear, nextMonth, clampedDay));
      },
      [year, month, day, commit]
    );

    useImperativeHandle(
      ref,
      () => ({
        getValue: () => currentValue,
        setValue: commit,
      }),
      [currentValue, commit]
    );

    const fallbackYearRef = useRef(new Date().getFullYear());
    const yearValues = useMemo(() => {
      const minYear =
        minimumDate?.getFullYear() ?? fallbackYearRef.current - 100;
      const maxYear =
        maximumDate?.getFullYear() ?? fallbackYearRef.current + 100;
      const values: number[] = [];
      for (let y = minYear; y <= maxYear; y++) values.push(y);
      return values;
    }, [minimumDate, maximumDate]);

    const monthValues = useMemo(
      () => Array.from({ length: 12 }, (_, i) => i),
      []
    );

    const dayValues = useMemo(() => {
      const count = daysInMonth(year, month);
      return Array.from({ length: count }, (_, i) => i + 1);
    }, [year, month]);

    const contextValue = useMemo(
      () => ({
        day,
        month,
        year,
        dayValues,
        monthValues,
        yearValues,
        disabled,
        setField,
      }),
      [day, month, year, dayValues, monthValues, yearValues, disabled, setField]
    );

    return (
      <DatePickerContext.Provider value={contextValue}>
        <View accessibilityState={{ disabled }} {...viewProps}>
          {children}
        </View>
      </DatePickerContext.Provider>
    );
  }
);
Root.displayName = 'DatePicker.Root';

export type DatePickerColumnRenderProps = { selected: boolean };

export interface DatePickerColumnProps extends Omit<ViewProps, 'children'> {
  field: DatePickerField;
  /** The rendered height of each row, in px. Every row must actually render at this height for the gesture math to line up. Defaults to `40`. */
  itemHeight?: number;
  children: (
    value: number,
    state: DatePickerColumnRenderProps
  ) => React.ReactNode;
}

function Column({
  field,
  itemHeight = 40,
  style,
  children,
  ...viewProps
}: DatePickerColumnProps) {
  const context = useDatePickerContext('Column');
  const { disabled, setField } = context;
  const values =
    field === 'day'
      ? context.dayValues
      : field === 'month'
        ? context.monthValues
        : context.yearValues;
  const currentValue =
    field === 'day'
      ? context.day
      : field === 'month'
        ? context.month
        : context.year;
  const index = Math.max(0, values.indexOf(currentValue));

  const [dragOffset, setDragOffset] = useState(0);
  const isDraggingRef = useRef(false);

  // Keeps the wheel snapped to the committed index whenever it changes
  // from the outside -- but never while a drag is actively in progress,
  // the same guard Carousel.Track/SwipeableRow.Content use.
  useEffect(() => {
    if (isDraggingRef.current) return;
    setDragOffset(0);
  }, [index]);

  // Keeps the PanResponder's handlers (created once) reading fresh state
  // without recreating them every render -- same technique Carousel.Track
  // uses. Reads exclusively from `latestRef.current`, never a destructured
  // render-scope variable, since these closures are captured once.
  const columnState = {
    field,
    values,
    index,
    disabled,
    setField,
    dragOffset,
    setDragOffset,
  };
  const latestRef = useRef(columnState);
  latestRef.current = columnState;
  const offsetAtGrantRef = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (
        _event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) =>
        !latestRef.current.disabled &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx) &&
        Math.abs(gestureState.dy) > 4,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        isDraggingRef.current = true;
        offsetAtGrantRef.current = latestRef.current.dragOffset;
      },
      onPanResponderMove: (
        _event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        const current = latestRef.current;
        current.setDragOffset(
          clampWheelDragOffset(
            offsetAtGrantRef.current + gestureState.dy,
            current.index,
            current.values.length,
            itemHeight
          )
        );
      },
      onPanResponderRelease: (
        _event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        const current = latestRef.current;
        isDraggingRef.current = false;
        const nextIndex = resolveWheelIndexFromRelease(
          current.index,
          current.values.length,
          current.dragOffset,
          gestureState.vy,
          itemHeight
        );
        current.setDragOffset(0);
        const nextValue = current.values[nextIndex];
        if (nextValue !== undefined) {
          current.setField(current.field, nextValue);
        }
      },
      onPanResponderTerminate: () => {
        isDraggingRef.current = false;
        latestRef.current.setDragOffset(0);
      },
    })
  ).current;

  const handleAccessibilityAction = useCallback<
    NonNullable<ViewProps['onAccessibilityAction']>
  >((event) => {
    const current = latestRef.current;
    if (current.disabled) return;
    const delta =
      event.nativeEvent.actionName === 'increment'
        ? 1
        : event.nativeEvent.actionName === 'decrement'
          ? -1
          : 0;
    if (delta === 0) return;
    const nextIndex = Math.min(
      current.values.length - 1,
      Math.max(0, current.index + delta)
    );
    const nextValue = current.values[nextIndex];
    if (nextValue !== undefined) {
      current.setField(current.field, nextValue);
    }
  }, []);

  return (
    // The gesture-catching layer is a separate inner View from this one --
    // same split as Carousel.Viewport/Track and SegmentedControl.List. An
    // element carrying PanResponder's onStartShouldSetResponder/
    // onMoveShouldSetResponder reports "wouldn't claim the touch right now"
    // to testing tools (and, on Android, to the native responder system)
    // whenever the drag gate isn't currently satisfied, which would
    // otherwise also suppress this element's own unrelated
    // accessibilityAction.
    <View
      accessibilityRole="adjustable"
      accessibilityState={{ disabled }}
      accessibilityValue={{ min: 0, max: values.length - 1, now: index }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={handleAccessibilityAction}
      style={[styles.column, { height: itemHeight * 3 }, style]}
      {...viewProps}
    >
      <View
        {...panResponder.panHandlers}
        style={{
          transform: [
            {
              translateY:
                itemHeight +
                wheelTrackTranslateY(index, itemHeight, dragOffset),
            },
          ],
        }}
      >
        {values.map((rowValue, rowIndex) => (
          <Pressable
            key={rowValue}
            disabled={disabled}
            onPress={() => {
              if (rowIndex !== index) setField(field, rowValue);
            }}
            style={[styles.row, { height: itemHeight }]}
          >
            {children(rowValue, { selected: rowIndex === index })}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
Column.displayName = 'DatePicker.Column';

const styles = {
  column: { overflow: 'hidden' as const },
  row: { justifyContent: 'center' as const, alignItems: 'center' as const },
};

export const DatePicker = {
  Root,
  Column,
};
