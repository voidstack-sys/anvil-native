import { StyleSheet, Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { AspectRatio } from '../primitives/AspectRatio';

describe('AspectRatio', () => {
  it('applies the ratio as a style, defaulting to 1 (square)', async () => {
    await render(
      <AspectRatio testID="box">
        <Text>content</Text>
      </AspectRatio>
    );

    expect(
      StyleSheet.flatten(screen.getByTestId('box').props.style)
    ).toMatchObject({ aspectRatio: 1 });
  });

  it('applies a custom ratio', async () => {
    await render(
      <AspectRatio testID="box" ratio={16 / 9}>
        <Text>content</Text>
      </AspectRatio>
    );

    expect(
      StyleSheet.flatten(screen.getByTestId('box').props.style).aspectRatio
    ).toBeCloseTo(16 / 9);
  });

  it('renders children', async () => {
    await render(
      <AspectRatio>
        <Text>content</Text>
      </AspectRatio>
    );

    expect(screen.getByText('content')).toBeTruthy();
  });

  describe('dev warnings', () => {
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
      errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    it('warns when ratio is not greater than 0', async () => {
      await render(
        <AspectRatio ratio={0}>
          <Text>content</Text>
        </AspectRatio>
      );

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('`ratio` must be greater than 0')
      );
    });
  });
});
