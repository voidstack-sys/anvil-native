import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Avatar } from '../primitives/Avatar';

function AvatarExample({
  source,
  delayMs,
  onLoadingStatusChange,
}: {
  source?: { uri: string };
  delayMs?: number;
  onLoadingStatusChange?: (status: string) => void;
}) {
  return (
    <Avatar.Root testID="root">
      <Avatar.Image
        testID="image"
        source={source ?? { uri: 'https://example.com/avatar.png' }}
        onLoadingStatusChange={onLoadingStatusChange}
      />
      <Avatar.Fallback testID="fallback" delayMs={delayMs}>
        <Text>AB</Text>
      </Avatar.Fallback>
    </Avatar.Root>
  );
}

describe('Avatar', () => {
  it('renders the image and hides the fallback once loaded', async () => {
    await render(<AvatarExample />);

    expect(screen.getByTestId('image')).toBeTruthy();
    expect(screen.getByTestId('fallback')).toBeTruthy();

    await fireEvent(screen.getByTestId('image'), 'load');

    expect(screen.queryByTestId('fallback')).toBeNull();
  });

  it('unmounts the image and keeps the fallback visible on error', async () => {
    await render(<AvatarExample />);

    await fireEvent(screen.getByTestId('image'), 'error');

    expect(screen.queryByTestId('image')).toBeNull();
    expect(screen.getByTestId('fallback')).toBeTruthy();
  });

  it('calls onLoadingStatusChange as the status transitions', async () => {
    const onLoadingStatusChange = jest.fn();
    await render(
      <AvatarExample onLoadingStatusChange={onLoadingStatusChange} />
    );

    expect(onLoadingStatusChange).toHaveBeenCalledWith('loading');

    await fireEvent(screen.getByTestId('image'), 'load');
    expect(onLoadingStatusChange).toHaveBeenCalledWith('loaded');
  });

  it('shows the fallback immediately by default (no delayMs)', async () => {
    await render(<AvatarExample />);
    expect(screen.getByTestId('fallback')).toBeTruthy();
  });

  describe('with delayMs', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('delays showing the fallback', async () => {
      await render(<AvatarExample delayMs={500} />);

      expect(screen.queryByTestId('fallback')).toBeNull();

      React.act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(screen.getByTestId('fallback')).toBeTruthy();
    });
  });

  it('re-attempts loading when `source` changes after an error', async () => {
    const { rerender } = await render(
      <AvatarExample source={{ uri: 'https://example.com/a.png' }} />
    );

    await fireEvent(screen.getByTestId('image'), 'error');
    expect(screen.queryByTestId('image')).toBeNull();

    await rerender(
      <AvatarExample source={{ uri: 'https://example.com/b.png' }} />
    );
    expect(screen.getByTestId('image')).toBeTruthy();
  });
});
