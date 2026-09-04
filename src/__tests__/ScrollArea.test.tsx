import * as React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { ScrollArea } from '../primitives/ScrollArea';
import type { ScrollAreaHandle } from '../primitives/ScrollArea';

// Scrollbar (and everything inside it, including Thumb) is decorative
// (accessibilityElementsHidden + importantForAccessibility="no-hide-
// descendants"), so it's invisible to RNTL's default queries -- same
// reasoning as Badge and SpeedDial.Backdrop's own tests.
function getHidden(testID: string) {
  return screen.getByTestId(testID, { includeHiddenElements: true });
}

function queryHidden(testID: string) {
  return screen.queryByTestId(testID, { includeHiddenElements: true });
}

function ScrollAreaExample({
  orientation,
}: {
  orientation?: 'vertical' | 'horizontal';
}) {
  return (
    <ScrollArea.Root testID="root" orientation={orientation}>
      <ScrollArea.Viewport testID="viewport">
        <Text>Content</Text>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar testID="scrollbar">
        <ScrollArea.Thumb testID="thumb">
          {({ size, offset }) => (
            <Text testID="thumb-label">{`${size}:${offset}`}</Text>
          )}
        </ScrollArea.Thumb>
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}

/**
 * Fires the layout/content-size events a real device would, in sequence.
 * `Scrollbar` only mounts once the content overflows, so its own `onLayout`
 * can only be looked up *after* the viewport's measurements have committed.
 */
function measure(
  viewport: ReturnType<typeof screen.getByTestId>,
  { viewportSize = 400, contentSize = 1000, trackSize = 400 } = {}
) {
  React.act(() => {
    viewport.props.onLayout({
      nativeEvent: { layout: { width: viewportSize, height: viewportSize } },
    });
    viewport.props.onContentSizeChange(contentSize, contentSize);
  });
  React.act(() => {
    getHidden('scrollbar').props.onLayout({
      nativeEvent: { layout: { width: trackSize, height: trackSize } },
    });
  });
}

describe('ScrollArea', () => {
  it('does not render the Scrollbar when content fits within the viewport', async () => {
    await render(<ScrollAreaExample />);

    const viewport = screen.getByTestId('viewport');
    React.act(() => {
      viewport.props.onLayout({
        nativeEvent: { layout: { width: 400, height: 400 } },
      });
      viewport.props.onContentSizeChange(400, 300);
    });

    expect(queryHidden('scrollbar')).toBeNull();
  });

  it('renders the Scrollbar once content overflows the viewport', async () => {
    await render(<ScrollAreaExample />);

    const viewport = screen.getByTestId('viewport');
    React.act(() => {
      viewport.props.onLayout({
        nativeEvent: { layout: { width: 400, height: 400 } },
      });
      viewport.props.onContentSizeChange(400, 1000);
    });

    expect(getHidden('scrollbar')).toBeTruthy();
    expect(getHidden('scrollbar').props.accessibilityElementsHidden).toBe(true);
  });

  it("computes the Thumb's size/offset render-props from measured sizes", async () => {
    await render(<ScrollAreaExample />);

    measure(screen.getByTestId('viewport'), {
      viewportSize: 400,
      contentSize: 1000,
      trackSize: 400,
    });

    // size = viewport / content = 0.4; offset starts at 0 (top).
    expect(getHidden('thumb-label').props.children).toBe('0.4:0');

    React.act(() => {
      screen.getByTestId('viewport').props.onScroll({
        nativeEvent: { contentOffset: { x: 0, y: 300 } },
      });
    });

    // offset = scrollOffset / maxOffset = 300 / (1000 - 400) = 0.5.
    expect(getHidden('thumb-label').props.children).toBe('0.4:0.5');
  });

  it('tracks the horizontal axis when orientation="horizontal"', async () => {
    await render(<ScrollAreaExample orientation="horizontal" />);

    const viewport = screen.getByTestId('viewport');
    expect(viewport.props.horizontal).toBe(true);

    measure(screen.getByTestId('viewport'));
    React.act(() => {
      viewport.props.onScroll({
        nativeEvent: { contentOffset: { x: 300, y: 9999 } },
      });
    });

    // Reads x (not y) when horizontal -- confirms the axis wiring, since y
    // was deliberately set to a value that would produce a different offset.
    expect(getHidden('thumb-label').props.children).toBe('0.4:0.5');
  });

  it('exposes an imperative ref API to scrollTo/getScrollOffset', async () => {
    const ref = React.createRef<ScrollAreaHandle>();
    await render(
      <ScrollArea.Root ref={ref} testID="root">
        <ScrollArea.Viewport testID="viewport">
          <Text>Content</Text>
        </ScrollArea.Viewport>
      </ScrollArea.Root>
    );

    const viewport = screen.getByTestId('viewport');
    React.act(() => {
      viewport.props.onLayout({
        nativeEvent: { layout: { width: 400, height: 400 } },
      });
      viewport.props.onContentSizeChange(400, 1000);
    });

    expect(ref.current?.getScrollOffset()).toBe(0);

    React.act(() => {
      ref.current?.scrollTo(9999);
    });
    // Clamped to the max scrollable offset (1000 - 400 = 600).
    expect(ref.current?.getScrollOffset()).toBe(600);
  });

  describe('dev warnings', () => {
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
      errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    it('warns when the orientation prop changes after the initial render', async () => {
      function Wrapper({
        orientation,
      }: {
        orientation: 'vertical' | 'horizontal';
      }) {
        return <ScrollAreaExample orientation={orientation} />;
      }

      const { rerender } = await render(<Wrapper orientation="vertical" />);
      expect(errorSpy).not.toHaveBeenCalled();

      await rerender(<Wrapper orientation="horizontal" />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '`orientation` prop changed from "vertical" to "horizontal"'
        )
      );
    });
  });
});
