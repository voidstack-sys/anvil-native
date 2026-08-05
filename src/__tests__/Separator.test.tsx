import { render, screen } from '@testing-library/react-native';
import { Separator } from '../primitives/Separator';

describe('Separator', () => {
  it('is hidden from accessibility by default (decorative)', async () => {
    await render(<Separator testID="separator" />);

    const separator = screen.getByTestId('separator', {
      includeHiddenElements: true,
    });
    expect(separator.props.accessibilityElementsHidden).toBe(true);
    expect(separator.props.importantForAccessibility).toBe(
      'no-hide-descendants'
    );
  });

  it('is exposed to accessibility when decorative is false', async () => {
    await render(<Separator testID="separator" decorative={false} />);

    const separator = screen.getByTestId('separator');
    expect(separator.props.accessibilityElementsHidden).toBe(false);
    expect(separator.props.importantForAccessibility).toBe('auto');
  });
});
