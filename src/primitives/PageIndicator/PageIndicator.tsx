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
  Pressable,
  View,
  type PressableProps,
  type ViewProps,
} from 'react-native';
import {
  controlledChangeMessage,
  useWarnOnceWhen,
} from '../../internal/devWarnings';

function clampPage(page: number, count: number): number {
  return Math.min(Math.max(page, 0), Math.max(count - 1, 0));
}

interface PageIndicatorContextValue {
  page: number;
  count: number;
  disabled: boolean;
  setPage: (page: number) => void;
}

const PageIndicatorContext = createContext<PageIndicatorContextValue | null>(
  null
);

function usePageIndicatorContext(component: string): PageIndicatorContextValue {
  const context = useContext(PageIndicatorContext);
  if (!context) {
    throw new Error(
      `PageIndicator.${component} must be used within a PageIndicator.Root`
    );
  }
  return context;
}

export interface PageIndicatorRootProps extends Omit<ViewProps, 'children'> {
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  /** Total number of pages. */
  count: number;
  disabled?: boolean;
  children: React.ReactNode;
}

export interface PageIndicatorHandle {
  getPage: () => number;
  setPage: (page: number) => void;
}

const Root = forwardRef<PageIndicatorHandle, PageIndicatorRootProps>(
  function PageIndicatorRoot(
    {
      page,
      defaultPage = 0,
      onPageChange,
      count,
      disabled = false,
      children,
      ...viewProps
    },
    ref
  ) {
    const isControlled = page !== undefined;
    const initialIsControlled = useRef(isControlled).current;

    useWarnOnceWhen(isControlled !== initialIsControlled, () =>
      controlledChangeMessage(
        'PageIndicator.Root',
        initialIsControlled,
        isControlled,
        'page'
      )
    );
    useWarnOnceWhen(
      count <= 0,
      () =>
        `PageIndicator.Root: \`count\` must be greater than 0, received ${count}.`
    );

    const [uncontrolledPage, setUncontrolledPage] = useState(() =>
      clampPage(defaultPage, count)
    );
    const currentPage = isControlled
      ? clampPage(page ?? defaultPage, count)
      : uncontrolledPage;

    const setPage = useCallback(
      (next: number) => {
        const clamped = clampPage(next, count);
        if (!isControlled) {
          setUncontrolledPage(clamped);
        }
        onPageChange?.(clamped);
      },
      [isControlled, count, onPageChange]
    );

    useImperativeHandle(
      ref,
      () => ({
        getPage: () => currentPage,
        setPage,
      }),
      [currentPage, setPage]
    );

    const contextValue = useMemo(
      () => ({ page: currentPage, count, disabled, setPage }),
      [currentPage, count, disabled, setPage]
    );

    const handleAccessibilityAction = useCallback<
      NonNullable<ViewProps['onAccessibilityAction']>
    >(
      (event) => {
        if (disabled) return;
        if (event.nativeEvent.actionName === 'increment') {
          setPage(currentPage + 1);
        } else if (event.nativeEvent.actionName === 'decrement') {
          setPage(currentPage - 1);
        }
      },
      [disabled, setPage, currentPage]
    );

    return (
      <PageIndicatorContext.Provider value={contextValue}>
        <View
          accessibilityRole="pager"
          accessibilityValue={{
            min: 0,
            max: Math.max(count - 1, 0),
            now: currentPage,
          }}
          accessibilityState={{ disabled }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={handleAccessibilityAction}
          {...viewProps}
        >
          {children}
        </View>
      </PageIndicatorContext.Provider>
    );
  }
);
Root.displayName = 'PageIndicator.Root';

export type PageIndicatorDotRenderProps = {
  active: boolean;
  index: number;
};

export interface PageIndicatorDotProps extends Omit<
  PressableProps,
  'children' | 'disabled'
> {
  index: number;
  disabled?: boolean;
  children:
    React.ReactNode | ((state: PageIndicatorDotRenderProps) => React.ReactNode);
}

function Dot({
  index,
  disabled: dotDisabled = false,
  onPress,
  children,
  ...pressableProps
}: PageIndicatorDotProps) {
  const {
    page,
    disabled: groupDisabled,
    setPage,
  } = usePageIndicatorContext('Dot');
  const disabled = dotDisabled || groupDisabled;
  const active = index === page;

  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      if (disabled) return;
      setPage(index);
      onPress?.(event);
    },
    [disabled, setPage, index, onPress]
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      disabled={disabled}
      onPress={handlePress}
      {...pressableProps}
    >
      {typeof children === 'function' ? children({ active, index }) : children}
    </Pressable>
  );
}
Dot.displayName = 'PageIndicator.Dot';

export const PageIndicator = {
  Root,
  Dot,
};
