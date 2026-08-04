import { useRef } from 'react';

/**
 * Logs `getMessage()` via `console.error` the first time `condition` is
 * true, and never again for the lifetime of the calling component instance.
 * No-ops outside of `__DEV__`. Safe to call unconditionally on every render.
 */
export function useWarnOnceWhen(
  condition: boolean,
  getMessage: () => string
): void {
  const hasWarnedRef = useRef(false);
  if (__DEV__ && condition && !hasWarnedRef.current) {
    hasWarnedRef.current = true;
    console.error(getMessage());
  }
}

export function controlledChangeMessage(
  componentName: string,
  wasControlled: boolean,
  isControlled: boolean
): string {
  return (
    `${componentName} is changing from ${wasControlled ? 'controlled' : 'uncontrolled'} to ` +
    `${isControlled ? 'controlled' : 'uncontrolled'}. Decide between using a controlled or ` +
    'uncontrolled component for the lifetime of the component: either always pass a `value` ' +
    'prop, or never pass one and rely on `defaultValue`/internal state instead.'
  );
}

export function typeChangeMessage(
  componentName: string,
  from: string,
  to: string
): string {
  return (
    `${componentName}: the \`type\` prop changed from "${from}" to "${to}" after the initial ` +
    'render. `type` is expected to stay constant for the lifetime of the component.'
  );
}

export function duplicateValueMessage(
  componentName: string,
  value: string
): string {
  return (
    `${componentName}: found more than one item with the value "${value}". Item values must ` +
    `be unique within the same ${componentName}.Root.`
  );
}
