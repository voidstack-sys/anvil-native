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
  AccessibilityInfo,
  Platform,
  Pressable,
  Text,
  View,
  type PressableProps,
  type TextProps,
  type ViewProps,
} from 'react-native';
import {
  controlledChangeMessage,
  useWarnOnceWhen,
} from '../../internal/devWarnings';

const DEFAULT_DURATION = 5000;

interface ProviderContextValue {
  defaultDuration: number;
}

const ProviderContext = createContext<ProviderContextValue>({
  defaultDuration: DEFAULT_DURATION,
});

export interface ToastProviderProps {
  /** Fallback `duration` for any `Toast.Root` that doesn't set its own. Defaults to 5000ms. */
  defaultDuration?: number;
  children: React.ReactNode;
}

function Provider({
  defaultDuration = DEFAULT_DURATION,
  children,
}: ToastProviderProps) {
  const value = useMemo(() => ({ defaultDuration }), [defaultDuration]);
  return (
    <ProviderContext.Provider value={value}>
      {children}
    </ProviderContext.Provider>
  );
}
Provider.displayName = 'Toast.Provider';

export type ToastViewportProps = ViewProps;

/**
 * There's no portal API in React Native, so unlike Anvil's other overlays
 * this isn't a `Modal` — it's just a positioning container you place near
 * the root of your app (e.g. `position: 'absolute', bottom: 0`) and render
 * your open `Toast.Root`s into. Its real job is accessibility: it marks
 * itself as a live region so assistive technology announces new toasts
 * automatically (Android via `accessibilityLiveRegion`; iOS has no
 * equivalent view prop, so `Toast.Root` calls
 * `AccessibilityInfo.announceForAccessibility` itself when it opens).
 */
function Viewport({ ...viewProps }: ToastViewportProps) {
  return (
    <View
      accessibilityLiveRegion="polite"
      importantForAccessibility="yes"
      {...viewProps}
    />
  );
}
Viewport.displayName = 'Toast.Viewport';

interface ToastContextValue {
  open: boolean;
  setTitleText: (text: string | undefined) => void;
  setDescriptionText: (text: string | undefined) => void;
  closeToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function useToastContext(component: string): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error(`Toast.${component} must be used within a Toast.Root`);
  }
  return context;
}

export interface ToastRootProps extends Omit<ViewProps, 'children'> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Milliseconds before the toast auto-dismisses. Pass `Infinity` to disable
   * auto-dismiss entirely. Defaults to `Toast.Provider`'s `defaultDuration`
   * (5000ms if there's no Provider).
   */
  duration?: number;
  children: React.ReactNode;
}

export interface ToastHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
}

const Root = forwardRef<ToastHandle, ToastRootProps>(function ToastRoot(
  { open, defaultOpen = false, onOpenChange, duration, children, ...viewProps },
  ref
) {
  const { defaultDuration } = useContext(ProviderContext);
  const effectiveDuration = duration ?? defaultDuration;

  const isControlled = open !== undefined;
  const initialIsControlled = useRef(isControlled).current;

  useWarnOnceWhen(isControlled !== initialIsControlled, () =>
    controlledChangeMessage(
      'Toast.Root',
      initialIsControlled,
      isControlled,
      'open'
    )
  );

  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = isControlled ? (open ?? false) : uncontrolledOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  const openToast = useCallback(() => setOpen(true), [setOpen]);
  const closeToast = useCallback(() => setOpen(false), [setOpen]);
  const toggleToast = useCallback(() => setOpen(!isOpen), [setOpen, isOpen]);

  useImperativeHandle(
    ref,
    () => ({
      open: openToast,
      close: closeToast,
      toggle: toggleToast,
      isOpen: () => isOpen,
    }),
    [openToast, closeToast, toggleToast, isOpen]
  );

  // Auto-dismiss: (re)started whenever the toast opens or `duration` changes.
  useEffect(() => {
    if (!isOpen || !Number.isFinite(effectiveDuration)) {
      return;
    }
    const timeout = setTimeout(closeToast, effectiveDuration);
    return () => clearTimeout(timeout);
  }, [isOpen, effectiveDuration, closeToast]);

  const [titleText, setTitleText] = useState<string | undefined>(undefined);
  const [descriptionText, setDescriptionText] = useState<string | undefined>(
    undefined
  );

  // Android gets this for free from Toast.Viewport's accessibilityLiveRegion;
  // iOS has no view-level live-region equivalent, so announce explicitly.
  // Title/Description register their text via their own effects, one commit
  // after this one opens, so this waits for that text instead of assuming
  // it's already there — and only announces once per open, via the ref.
  const announcedRef = useRef(false);
  useEffect(() => {
    if (!isOpen) {
      announcedRef.current = false;
      return;
    }
    if (Platform.OS !== 'ios' || announcedRef.current) return;
    const message = [titleText, descriptionText].filter(Boolean).join('. ');
    if (message) {
      AccessibilityInfo.announceForAccessibility(message);
      announcedRef.current = true;
    }
  }, [isOpen, titleText, descriptionText]);

  const contextValue = useMemo(
    () => ({
      open: isOpen,
      setTitleText,
      setDescriptionText,
      closeToast,
    }),
    [isOpen, closeToast]
  );

  if (!isOpen) {
    return null;
  }

  return (
    <ToastContext.Provider value={contextValue}>
      <View accessibilityRole="alert" {...viewProps}>
        {children}
      </View>
    </ToastContext.Provider>
  );
});
Root.displayName = 'Toast.Root';

export type ToastTitleProps = TextProps;

function Title({ children, ...textProps }: ToastTitleProps) {
  const { setTitleText } = useToastContext('Title');
  const text = typeof children === 'string' ? children : undefined;

  useEffect(() => {
    setTitleText(text);
    return () => setTitleText(undefined);
  }, [text, setTitleText]);

  return <Text {...textProps}>{children}</Text>;
}
Title.displayName = 'Toast.Title';

export type ToastDescriptionProps = TextProps;

function Description({ children, ...textProps }: ToastDescriptionProps) {
  const { setDescriptionText } = useToastContext('Description');
  const text = typeof children === 'string' ? children : undefined;

  useEffect(() => {
    setDescriptionText(text);
    return () => setDescriptionText(undefined);
  }, [text, setDescriptionText]);

  return <Text {...textProps}>{children}</Text>;
}
Description.displayName = 'Toast.Description';

export interface ToastActionProps extends PressableProps {
  /** Close the toast after this is pressed. Defaults to true. */
  closeOnPress?: boolean;
}

function Action({
  closeOnPress = true,
  onPress,
  ...pressableProps
}: ToastActionProps) {
  const { closeToast } = useToastContext('Action');

  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      onPress?.(event);
      if (closeOnPress) closeToast();
    },
    [closeOnPress, closeToast, onPress]
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      {...pressableProps}
    />
  );
}
Action.displayName = 'Toast.Action';

export type ToastCloseProps = PressableProps;

function Close({ onPress, ...pressableProps }: ToastCloseProps) {
  const { closeToast } = useToastContext('Close');

  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      closeToast();
      onPress?.(event);
    },
    [closeToast, onPress]
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      {...pressableProps}
    />
  );
}
Close.displayName = 'Toast.Close';

export const Toast = {
  Provider,
  Viewport,
  Root,
  Title,
  Description,
  Action,
  Close,
};
