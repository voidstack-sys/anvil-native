import { useCallback, useEffect, useRef } from 'react';
import { duplicateValueMessage } from './devWarnings';

/**
 * Dev-only bookkeeping so a Root can warn when two of its items share the
 * same `value`. Registration is a no-op outside of `__DEV__`.
 */
export function useValueRegistry(componentName: string) {
  const countsRef = useRef<Map<string, number>>(new Map());

  const register = useCallback(
    (value: string) => {
      const counts = countsRef.current;
      const next = (counts.get(value) ?? 0) + 1;
      counts.set(value, next);
      if (__DEV__ && next > 1) {
        console.error(duplicateValueMessage(componentName, value));
      }
    },
    [componentName]
  );

  const unregister = useCallback((value: string) => {
    const counts = countsRef.current;
    const next = (counts.get(value) ?? 1) - 1;
    if (next <= 0) {
      counts.delete(value);
    } else {
      counts.set(value, next);
    }
  }, []);

  return { register, unregister };
}

/**
 * Registers `value` with a registry obtained from `useValueRegistry` for as
 * long as the calling component is mounted (and whenever `value` changes).
 */
export function useRegisteredValue(
  register: (value: string) => void,
  unregister: (value: string) => void,
  value: string
): void {
  useEffect(() => {
    if (!__DEV__) return;
    register(value);
    return () => unregister(value);
  }, [register, unregister, value]);
}
