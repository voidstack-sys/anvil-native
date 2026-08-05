import { StyleSheet, Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { VisuallyHidden } from '../primitives/VisuallyHidden';

describe('VisuallyHidden', () => {
  it('renders its children', async () => {
    await render(
      <VisuallyHidden>
        <Text>Close</Text>
      </VisuallyHidden>
    );

    expect(screen.getByText('Close')).toBeTruthy();
  });

  it('remains reachable by accessibility queries (not accessibilityElementsHidden)', async () => {
    await render(
      <VisuallyHidden testID="hidden">
        <Text>Close</Text>
      </VisuallyHidden>
    );

    const hidden = screen.getByTestId('hidden');
    expect(hidden.props.accessibilityElementsHidden).toBeFalsy();
    expect(hidden.props.importantForAccessibility).not.toBe(
      'no-hide-descendants'
    );
  });

  it('is visually zero-size and transparent', async () => {
    await render(
      <VisuallyHidden testID="hidden">
        <Text>Close</Text>
      </VisuallyHidden>
    );

    const style = StyleSheet.flatten(screen.getByTestId('hidden').props.style);
    expect(style.width).toBe(1);
    expect(style.height).toBe(1);
    expect(style.opacity).toBe(0);
  });

  it('merges a caller-provided style on top of its own', async () => {
    await render(
      <VisuallyHidden testID="hidden" style={{ backgroundColor: 'red' }}>
        <Text>Close</Text>
      </VisuallyHidden>
    );

    const style = StyleSheet.flatten(screen.getByTestId('hidden').props.style);
    expect(style.backgroundColor).toBe('red');
    expect(style.opacity).toBe(0);
  });
});
