import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Skeleton } from '../primitives/Skeleton';

describe('Skeleton', () => {
  it('is hidden from accessibility by default', async () => {
    await render(<Skeleton testID="skeleton" />);
    const skeleton = screen.getByTestId('skeleton', {
      includeHiddenElements: true,
    });
    expect(skeleton.props.accessibilityElementsHidden).toBe(true);
    expect(skeleton.props.importantForAccessibility).toBe(
      'no-hide-descendants'
    );
  });

  it('lets the consumer override the accessibility defaults', async () => {
    await render(
      <Skeleton testID="skeleton" accessibilityElementsHidden={false} />
    );
    expect(
      screen.getByTestId('skeleton', { includeHiddenElements: true }).props
        .accessibilityElementsHidden
    ).toBe(false);
  });

  it('starts the opacity animation at 0.3 by default', async () => {
    await render(<Skeleton testID="skeleton" />);
    const skeleton = screen.getByTestId('skeleton', {
      includeHiddenElements: true,
    });
    const flatStyle = StyleSheet.flatten(skeleton.props.style);
    expect(flatStyle.opacity).toBeCloseTo(0.3);
  });

  it('holds a static opacity when animate is false', async () => {
    await render(<Skeleton testID="skeleton" animate={false} />);
    const skeleton = screen.getByTestId('skeleton', {
      includeHiddenElements: true,
    });
    const flatStyle = StyleSheet.flatten(skeleton.props.style);
    expect(flatStyle.opacity).toBeCloseTo(0.3);
  });

  it('merges the consumer style alongside the animated opacity', async () => {
    await render(
      <Skeleton
        testID="skeleton"
        style={{ width: 100, height: 20, backgroundColor: '#eee' }}
      />
    );
    const skeleton = screen.getByTestId('skeleton', {
      includeHiddenElements: true,
    });
    const flatStyle = StyleSheet.flatten(skeleton.props.style);
    expect(flatStyle.width).toBe(100);
    expect(flatStyle.height).toBe(20);
    expect(flatStyle.backgroundColor).toBe('#eee');
  });
});
