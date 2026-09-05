import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  PanResponder,
  View,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type PanResponderGestureState,
  type ViewProps,
} from 'react-native';
import {
  controlledChangeMessage,
  useWarnOnceWhen,
} from '../../internal/devWarnings';
import {
  clampDragOffset,
  offsetForOtherItem,
  reorder,
  targetIndexFromOffset,
} from '../../internal/sortableListMath';

interface SortableListContextValue {
  order: string[];
  disabled: boolean;
  draggingKey: string | null;
  dragOffset: number;
  dragFromIndex: number | null;
  dragToIndex: number | null;
  draggedHeight: number;
  setItemHeight: (key: string, height: number) => void;
  beginDrag: (key: string) => void;
  updateDrag: (dy: number) => void;
  endDrag: () => void;
  move: (fromIndex: number, toIndex: number) => void;
}

const SortableListContext = createContext<SortableListContextValue | null>(
  null
);

function useSortableListContext(component: string): SortableListContextValue {
  const context = useContext(SortableListContext);
  if (!context) {
    throw new Error(
      `SortableList.${component} must be used within a SortableList.Root`
    );
  }
  return context;
}

interface SortableListItemContextValue {
  itemKey: string;
  dragging: boolean;
  disabled: boolean;
}

const SortableListItemContext =
  createContext<SortableListItemContextValue | null>(null);

function useSortableListItemContext(
  component: string
): SortableListItemContextValue {
  const context = useContext(SortableListItemContext);
  if (!context) {
    throw new Error(
      `SortableList.${component} must be used within a SortableList.Item`
    );
  }
  return context;
}

export interface SortableListRootProps {
  /** The current order, as an array of each item's `itemKey`. */
  order?: string[];
  defaultOrder?: string[];
  onOrderChange?: (order: string[]) => void;
  /** Disables every item's drag handle, regardless of each item's own `disabled` prop. */
  disabled?: boolean;
  children: React.ReactNode;
}

export interface SortableListHandle {
  getOrder: () => string[];
  setOrder: (order: string[]) => void;
}

const Root = forwardRef<SortableListHandle, SortableListRootProps>(
  function SortableListRoot(
    { order, defaultOrder = [], onOrderChange, disabled = false, children },
    ref
  ) {
    const isControlled = order !== undefined;
    const initialIsControlled = useRef(isControlled).current;

    useWarnOnceWhen(isControlled !== initialIsControlled, () =>
      controlledChangeMessage(
        'SortableList.Root',
        initialIsControlled,
        isControlled,
        'order'
      )
    );

    const [uncontrolledOrder, setUncontrolledOrder] = useState(defaultOrder);
    const currentOrder = useMemo(
      () => (isControlled ? (order ?? []) : uncontrolledOrder),
      [isControlled, order, uncontrolledOrder]
    );

    const setOrder = useCallback(
      (next: string[]) => {
        if (!isControlled) {
          setUncontrolledOrder(next);
        }
        onOrderChange?.(next);
      },
      [isControlled, onOrderChange]
    );

    const move = useCallback(
      (fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return;
        setOrder(reorder(currentOrder, fromIndex, toIndex));
      },
      [currentOrder, setOrder]
    );

    const [itemHeights, setItemHeights] = useState<Record<string, number>>({});
    const setItemHeight = useCallback((key: string, height: number) => {
      setItemHeights((prev) =>
        prev[key] === height ? prev : { ...prev, [key]: height }
      );
    }, []);

    const [draggingKey, setDraggingKey] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState(0);

    const orderedHeights = useMemo(
      () => currentOrder.map((key) => itemHeights[key] ?? 0),
      [currentOrder, itemHeights]
    );

    const dragFromIndex =
      draggingKey === null ? null : currentOrder.indexOf(draggingKey);
    const dragToIndex =
      dragFromIndex === null
        ? null
        : targetIndexFromOffset(dragFromIndex, dragOffset, orderedHeights);
    const draggedHeight =
      dragFromIndex === null ? 0 : (orderedHeights[dragFromIndex] ?? 0);

    const beginDrag = useCallback((key: string) => {
      setDraggingKey(key);
      setDragOffset(0);
    }, []);

    const updateDrag = useCallback(
      (dy: number) => {
        if (dragFromIndex === null) return;
        setDragOffset(clampDragOffset(dy, dragFromIndex, orderedHeights));
      },
      [dragFromIndex, orderedHeights]
    );

    const endDrag = useCallback(() => {
      if (dragFromIndex !== null && dragToIndex !== null) {
        move(dragFromIndex, dragToIndex);
      }
      setDraggingKey(null);
      setDragOffset(0);
    }, [dragFromIndex, dragToIndex, move]);

    useImperativeHandle(
      ref,
      () => ({
        getOrder: () => currentOrder,
        setOrder,
      }),
      [currentOrder, setOrder]
    );

    const contextValue = useMemo(
      () => ({
        order: currentOrder,
        disabled,
        draggingKey,
        dragOffset,
        dragFromIndex,
        dragToIndex,
        draggedHeight,
        setItemHeight,
        beginDrag,
        updateDrag,
        endDrag,
        move,
      }),
      [
        currentOrder,
        disabled,
        draggingKey,
        dragOffset,
        dragFromIndex,
        dragToIndex,
        draggedHeight,
        setItemHeight,
        beginDrag,
        updateDrag,
        endDrag,
        move,
      ]
    );

    return (
      <SortableListContext.Provider value={contextValue}>
        {children}
      </SortableListContext.Provider>
    );
  }
);
Root.displayName = 'SortableList.Root';

export type SortableListItemRenderProps = {
  dragging: boolean;
  disabled: boolean;
};

export interface SortableListItemProps extends Omit<ViewProps, 'children'> {
  /** This item's stable identity within `order`. */
  itemKey: string;
  disabled?: boolean;
  children:
    React.ReactNode | ((state: SortableListItemRenderProps) => React.ReactNode);
}

function Item({
  itemKey,
  disabled: itemDisabled = false,
  style,
  onLayout,
  children,
  ...viewProps
}: SortableListItemProps) {
  const {
    order,
    disabled: groupDisabled,
    draggingKey,
    dragOffset,
    dragFromIndex,
    dragToIndex,
    draggedHeight,
    setItemHeight,
    move,
  } = useSortableListContext('Item');
  const disabled = itemDisabled || groupDisabled;
  const dragging = draggingKey === itemKey;
  const index = order.indexOf(itemKey);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      setItemHeight(itemKey, event.nativeEvent.layout.height);
      onLayout?.(event);
    },
    [itemKey, setItemHeight, onLayout]
  );

  const handleAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      if (disabled) return;
      if (event.nativeEvent.actionName === 'increment') {
        move(index, Math.min(order.length - 1, index + 1));
      } else if (event.nativeEvent.actionName === 'decrement') {
        move(index, Math.max(0, index - 1));
      }
    },
    [disabled, index, order.length, move]
  );

  const translateY = dragging
    ? dragOffset
    : dragFromIndex !== null && dragToIndex !== null
      ? offsetForOtherItem(index, dragFromIndex, dragToIndex, draggedHeight)
      : 0;

  const itemContextValue = useMemo(
    () => ({ itemKey, dragging, disabled }),
    [itemKey, dragging, disabled]
  );

  return (
    <SortableListItemContext.Provider value={itemContextValue}>
      <View
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={handleAccessibilityAction}
        onLayout={handleLayout}
        style={[
          { transform: [{ translateY }] },
          dragging && styles.dragging,
          style,
        ]}
        {...viewProps}
      >
        {typeof children === 'function'
          ? children({ dragging, disabled })
          : children}
      </View>
    </SortableListItemContext.Provider>
  );
}
Item.displayName = 'SortableList.Item';

export type SortableListHandleProps = ViewProps;

function Handle({ style, ...viewProps }: SortableListHandleProps) {
  const item = useSortableListItemContext('Handle');
  const context = useSortableListContext('Handle');

  // Keeps the PanResponder's handlers (created once) reading fresh context
  // without recreating them every render -- same technique
  // BottomSheet.Handle/Drawer.Handle use.
  const latestRef = useRef({ ...context, ...item });
  latestRef.current = { ...context, ...item };

  const panResponder = useRef(
    PanResponder.create({
      // Reads only from `latestRef` (never `item`/`context` directly) so
      // this always sees the current disabled state -- the closures here
      // are captured once, at PanResponder creation.
      onStartShouldSetPanResponder: () => !latestRef.current.disabled,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        latestRef.current.beginDrag(latestRef.current.itemKey);
      },
      onPanResponderMove: (
        _event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        latestRef.current.updateDrag(gestureState.dy);
      },
      onPanResponderRelease: () => {
        latestRef.current.endDrag();
      },
      onPanResponderTerminate: () => {
        latestRef.current.endDrag();
      },
    })
  ).current;

  return <View {...panResponder.panHandlers} style={style} {...viewProps} />;
}
Handle.displayName = 'SortableList.Handle';

const styles = { dragging: { zIndex: 1 } };

export const SortableList = {
  Root,
  Item,
  Handle,
};
