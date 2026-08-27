import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PageIndicator } from '../primitives/PageIndicator';
import type { PageIndicatorHandle } from '../primitives/PageIndicator';

function fireAccessibilityAction(testID: string, actionName: string) {
  return fireEvent(screen.getByTestId(testID), 'accessibilityAction', {
    nativeEvent: { actionName },
  });
}

function PageIndicatorExample({
  page,
  defaultPage,
  onPageChange,
  count = 3,
  disabled,
}: {
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  count?: number;
  disabled?: boolean;
}) {
  return (
    <PageIndicator.Root
      testID="root"
      page={page}
      defaultPage={defaultPage}
      onPageChange={onPageChange}
      count={count}
      disabled={disabled}
    >
      {Array.from({ length: count }).map((_, index) => (
        <PageIndicator.Dot key={index} index={index} testID={`dot-${index}`}>
          {({ active }) => <Text>{active ? '●' : '○'}</Text>}
        </PageIndicator.Dot>
      ))}
    </PageIndicator.Root>
  );
}

describe('PageIndicator', () => {
  it('starts at page 0 by default', async () => {
    await render(<PageIndicatorExample />);
    expect(screen.getByTestId('root').props.accessibilityValue.now).toBe(0);
  });

  it('respects defaultPage for uncontrolled usage', async () => {
    await render(<PageIndicatorExample defaultPage={2} />);
    expect(screen.getByTestId('root').props.accessibilityValue.now).toBe(2);
  });

  it('jumps to the tapped dot', async () => {
    const onPageChange = jest.fn();
    await render(<PageIndicatorExample onPageChange={onPageChange} />);

    await fireEvent.press(screen.getByTestId('dot-2'));
    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(screen.getByTestId('dot-2').props.accessibilityState.selected).toBe(
      true
    );
    expect(screen.getByTestId('dot-0').props.accessibilityState.selected).toBe(
      false
    );
  });

  it('clamps defaultPage/page to [0, count - 1]', async () => {
    await render(<PageIndicatorExample defaultPage={99} count={3} />);
    expect(screen.getByTestId('root').props.accessibilityValue.now).toBe(2);
  });

  it('does not change when disabled', async () => {
    const onPageChange = jest.fn();
    await render(<PageIndicatorExample disabled onPageChange={onPageChange} />);

    await fireEvent.press(screen.getByTestId('dot-1'));
    expect(onPageChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('dot-1').props.accessibilityState.disabled).toBe(
      true
    );
  });

  it('exposes the pager accessibility role and responds to accessibility actions', async () => {
    const onPageChange = jest.fn();
    await render(
      <PageIndicatorExample defaultPage={1} onPageChange={onPageChange} />
    );

    const root = screen.getByTestId('root');
    expect(root.props.accessibilityRole).toBe('pager');

    await fireAccessibilityAction('root', 'increment');
    expect(onPageChange).toHaveBeenCalledWith(2);

    await fireAccessibilityAction('root', 'decrement');
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('supports controlled mode via page/onPageChange', async () => {
    const onPageChange = jest.fn();

    function Controlled() {
      const [page, setPage] = React.useState(0);
      return (
        <PageIndicatorExample
          page={page}
          onPageChange={(next) => {
            onPageChange(next);
            setPage(next);
          }}
        />
      );
    }

    await render(<Controlled />);

    await fireEvent.press(screen.getByTestId('dot-2'));
    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(screen.getByTestId('root').props.accessibilityValue.now).toBe(2);
  });

  it('exposes an imperative ref API to getPage/setPage', async () => {
    const ref = React.createRef<PageIndicatorHandle>();

    await render(
      <PageIndicator.Root ref={ref} count={3}>
        <PageIndicator.Dot index={0} testID="dot-0">
          <Text>dot</Text>
        </PageIndicator.Dot>
      </PageIndicator.Root>
    );

    expect(ref.current?.getPage()).toBe(0);

    React.act(() => {
      ref.current?.setPage(2);
    });
    expect(ref.current?.getPage()).toBe(2);

    React.act(() => {
      ref.current?.setPage(99);
    });
    expect(ref.current?.getPage()).toBe(2);
  });

  describe('dev warnings', () => {
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
      errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    it('warns when switching between controlled and uncontrolled', async () => {
      function Wrapper({ controlled }: { controlled: boolean }) {
        return <PageIndicatorExample page={controlled ? 1 : undefined} />;
      }

      const { rerender } = await render(<Wrapper controlled={false} />);
      expect(errorSpy).not.toHaveBeenCalled();

      await rerender(<Wrapper controlled />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('is changing from uncontrolled to controlled')
      );
    });

    it('warns when count is not greater than 0', async () => {
      await render(<PageIndicatorExample count={0} />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('`count` must be greater than 0')
      );
    });
  });
});
