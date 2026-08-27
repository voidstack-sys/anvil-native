import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Badge } from '../primitives/Badge';

function getBadge(testID: string) {
  return screen.getByTestId(testID, { includeHiddenElements: true });
}

describe('Badge', () => {
  it('renders the count as text by default', async () => {
    await render(<Badge testID="badge" count={5} />);
    expect(getBadge('badge').props.children.props.children).toBe('5');
  });

  it('clamps counts above max to "max+"', async () => {
    await render(<Badge testID="badge" count={150} max={99} />);
    expect(getBadge('badge').props.children.props.children).toBe('99+');
  });

  it('does not clamp counts at or below max', async () => {
    await render(<Badge testID="badge" count={99} max={99} />);
    expect(getBadge('badge').props.children.props.children).toBe('99');
  });

  it('renders nothing (null) when count is 0 by default', async () => {
    await render(<Badge testID="badge" count={0} />);
    expect(
      screen.queryByTestId('badge', { includeHiddenElements: true })
    ).toBeNull();
  });

  it('renders when count is 0 and showZero is true', async () => {
    await render(<Badge testID="badge" count={0} showZero />);
    expect(getBadge('badge').props.children.props.children).toBe('0');
  });

  it('renders as a plain dot (no text) when count is omitted', async () => {
    await render(<Badge testID="badge" />);
    // No count -> displayValue is null -> no Text child is rendered.
    expect(getBadge('badge').props.children).toBe(false);
  });

  it('is hidden from accessibility by default', async () => {
    await render(<Badge testID="badge" count={3} />);
    const badge = getBadge('badge');
    expect(badge.props.accessibilityElementsHidden).toBe(true);
    expect(badge.props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('lets the consumer override the accessibility defaults', async () => {
    await render(
      <Badge testID="badge" count={3} accessibilityElementsHidden={false} />
    );
    expect(getBadge('badge').props.accessibilityElementsHidden).toBe(false);
  });

  it('supports a custom render function via children', async () => {
    await render(
      <Badge testID="badge" count={7}>
        {({ displayValue }) => (
          <Text testID="label">Count: {displayValue}</Text>
        )}
      </Badge>
    );
    expect(getBadge('label').props.children).toEqual(['Count: ', '7']);
  });

  it('supports a plain children override', async () => {
    await render(
      <Badge testID="badge" count={7}>
        <Text testID="custom">•</Text>
      </Badge>
    );
    expect(getBadge('custom')).toBeTruthy();
  });
});
