import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PullToRefresh } from '../primitives/PullToRefresh';

function fireAccessibilityAction(testID: string, actionName: string) {
  return fireEvent(screen.getByTestId(testID), 'accessibilityAction', {
    nativeEvent: { actionName },
  });
}

function PullToRefreshExample({
  refreshing,
  onRefresh,
  threshold,
  disabled,
}: {
  refreshing: boolean;
  onRefresh: () => void;
  threshold?: number;
  disabled?: boolean;
}) {
  return (
    <PullToRefresh.Root
      testID="root"
      refreshing={refreshing}
      onRefresh={onRefresh}
      threshold={threshold}
      disabled={disabled}
    >
      <PullToRefresh.Indicator testID="indicator">
        {({ refreshing: isRefreshing }) => (
          <Text>{isRefreshing ? 'refreshing' : 'idle'}</Text>
        )}
      </PullToRefresh.Indicator>
      <PullToRefresh.Content testID="content">
        <Text>content</Text>
      </PullToRefresh.Content>
    </PullToRefresh.Root>
  );
}

describe('PullToRefresh', () => {
  it('renders idle by default', async () => {
    await render(
      <PullToRefreshExample refreshing={false} onRefresh={jest.fn()} />
    );
    expect(screen.getByText('idle')).toBeTruthy();
  });

  it('reports refreshing via the Indicator render prop when controlled true', async () => {
    await render(<PullToRefreshExample refreshing onRefresh={jest.fn()} />);
    expect(screen.getByText('refreshing')).toBeTruthy();
  });

  it("Content's drag gesture never claims on mere touch-down", async () => {
    await render(
      <PullToRefreshExample refreshing={false} onRefresh={jest.fn()} />
    );
    expect(
      screen.getByTestId('content').props.onStartShouldSetResponder()
    ).toBe(false);
  });

  it('triggers onRefresh via the "activate" accessibility action', async () => {
    const onRefresh = jest.fn();
    await render(
      <PullToRefreshExample refreshing={false} onRefresh={onRefresh} />
    );

    await fireAccessibilityAction('root', 'activate');
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('does not trigger onRefresh via accessibility action while already refreshing', async () => {
    const onRefresh = jest.fn();
    await render(<PullToRefreshExample refreshing onRefresh={onRefresh} />);

    await fireAccessibilityAction('root', 'activate');
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('does not trigger onRefresh via accessibility action while disabled', async () => {
    const onRefresh = jest.fn();
    await render(
      <PullToRefreshExample refreshing={false} onRefresh={onRefresh} disabled />
    );

    await fireAccessibilityAction('root', 'activate');
    expect(onRefresh).not.toHaveBeenCalled();
  });

  describe('dev warnings', () => {
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
      errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    it('warns when threshold is not greater than 0', async () => {
      await render(
        <PullToRefreshExample
          refreshing={false}
          onRefresh={jest.fn()}
          threshold={0}
        />
      );

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('`threshold` must be greater than 0')
      );
    });
  });
});
