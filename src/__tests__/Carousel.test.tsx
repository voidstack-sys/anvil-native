import * as React from 'react';
import { StyleSheet, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Carousel } from '../primitives/Carousel';
import type { CarouselHandle } from '../primitives/Carousel';

function fireAccessibilityAction(testID: string, actionName: string) {
  return fireEvent(screen.getByTestId(testID), 'accessibilityAction', {
    nativeEvent: { actionName },
  });
}

function CarouselExample({
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
    <Carousel.Root
      page={page}
      defaultPage={defaultPage}
      onPageChange={onPageChange}
      count={count}
      disabled={disabled}
    >
      <Carousel.Viewport testID="viewport">
        <Carousel.Track testID="track">
          {Array.from({ length: count }).map((_, index) => (
            <Carousel.Slide key={index} testID={`slide-${index}`}>
              <Text>Slide {index}</Text>
            </Carousel.Slide>
          ))}
        </Carousel.Track>
      </Carousel.Viewport>
    </Carousel.Root>
  );
}

describe('Carousel', () => {
  it('starts at page 0 by default', async () => {
    await render(<CarouselExample />);
    expect(screen.getByTestId('viewport').props.accessibilityValue.now).toBe(0);
  });

  it('respects defaultPage for uncontrolled usage', async () => {
    await render(<CarouselExample defaultPage={2} />);
    expect(screen.getByTestId('viewport').props.accessibilityValue.now).toBe(2);
  });

  it('clamps defaultPage/page to [0, count - 1]', async () => {
    await render(<CarouselExample defaultPage={99} count={3} />);
    expect(screen.getByTestId('viewport').props.accessibilityValue.now).toBe(2);
  });

  it('exposes the adjustable accessibility role and responds to accessibility actions', async () => {
    const onPageChange = jest.fn();
    await render(
      <CarouselExample defaultPage={1} onPageChange={onPageChange} />
    );

    const viewport = screen.getByTestId('viewport');
    expect(viewport.props.accessibilityRole).toBe('adjustable');

    await fireAccessibilityAction('viewport', 'increment');
    expect(onPageChange).toHaveBeenCalledWith(2);

    await fireAccessibilityAction('viewport', 'decrement');
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('does not respond to accessibility actions when disabled', async () => {
    const onPageChange = jest.fn();
    await render(<CarouselExample disabled onPageChange={onPageChange} />);

    await fireAccessibilityAction('viewport', 'increment');
    expect(onPageChange).not.toHaveBeenCalled();
    expect(
      screen.getByTestId('viewport').props.accessibilityState.disabled
    ).toBe(true);
  });

  it('supports controlled mode via page/onPageChange', async () => {
    const onPageChange = jest.fn();

    function Controlled() {
      const [page, setPage] = React.useState(0);
      return (
        <CarouselExample
          page={page}
          onPageChange={(next) => {
            onPageChange(next);
            setPage(next);
          }}
        />
      );
    }

    await render(<Controlled />);

    await fireAccessibilityAction('viewport', 'increment');
    expect(onPageChange).toHaveBeenCalledWith(1);
    expect(screen.getByTestId('viewport').props.accessibilityValue.now).toBe(1);
  });

  it('exposes an imperative ref API to getPage/setPage/next/previous', async () => {
    const ref = React.createRef<CarouselHandle>();

    await render(
      <Carousel.Root ref={ref} count={3}>
        <Carousel.Viewport testID="viewport">
          <Carousel.Track>
            <Carousel.Slide>
              <Text>Slide</Text>
            </Carousel.Slide>
          </Carousel.Track>
        </Carousel.Viewport>
      </Carousel.Root>
    );

    expect(ref.current?.getPage()).toBe(0);

    React.act(() => {
      ref.current?.next();
    });
    expect(ref.current?.getPage()).toBe(1);

    React.act(() => {
      ref.current?.next();
    });
    expect(ref.current?.getPage()).toBe(2);

    // Clamped at the last page.
    React.act(() => {
      ref.current?.next();
    });
    expect(ref.current?.getPage()).toBe(2);

    React.act(() => {
      ref.current?.previous();
    });
    expect(ref.current?.getPage()).toBe(1);

    React.act(() => {
      ref.current?.setPage(0);
    });
    expect(ref.current?.getPage()).toBe(0);
  });

  it("sizes each Slide to the Viewport's measured width", async () => {
    await render(<CarouselExample count={2} />);

    React.act(() => {
      screen.getByTestId('viewport').props.onLayout({
        nativeEvent: { layout: { width: 320, height: 200 } },
      });
    });

    const flatStyle = StyleSheet.flatten(
      screen.getByTestId('slide-0').props.style
    );
    expect(flatStyle.width).toBe(320);
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
        return <CarouselExample page={controlled ? 1 : undefined} />;
      }

      const { rerender } = await render(<Wrapper controlled={false} />);
      expect(errorSpy).not.toHaveBeenCalled();

      await rerender(<Wrapper controlled />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('is changing from uncontrolled to controlled')
      );
    });

    it('warns when count is not greater than 0', async () => {
      await render(<CarouselExample count={0} />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('`count` must be greater than 0')
      );
    });
  });
});
