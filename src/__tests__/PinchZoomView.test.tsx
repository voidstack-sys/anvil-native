import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PinchZoomView } from '../primitives/PinchZoomView';
import type { PinchZoomViewHandle } from '../primitives/PinchZoomView';

function fireAccessibilityAction(testID: string, actionName: string) {
  return fireEvent(screen.getByTestId(testID), 'accessibilityAction', {
    nativeEvent: { actionName },
  });
}

describe('PinchZoomView', () => {
  it('starts at scale 1', async () => {
    await render(
      <PinchZoomView testID="view">
        <Text>content</Text>
      </PinchZoomView>
    );
    expect(screen.getByTestId('view').props.accessibilityValue.now).toBe(1);
  });

  it('zooms in on an increment accessibility action', async () => {
    const onScaleChange = jest.fn();
    await render(
      <PinchZoomView testID="view" onScaleChange={onScaleChange}>
        <Text>content</Text>
      </PinchZoomView>
    );

    await fireAccessibilityAction('view', 'increment');
    expect(onScaleChange).toHaveBeenCalledWith(1.5);
  });

  it('zooms out on a decrement accessibility action, clamped to minScale', async () => {
    const onScaleChange = jest.fn();
    await render(
      <PinchZoomView testID="view" onScaleChange={onScaleChange}>
        <Text>content</Text>
      </PinchZoomView>
    );

    await fireAccessibilityAction('view', 'decrement');
    expect(onScaleChange).toHaveBeenCalledWith(1);
  });

  it('clamps zooming in at maxScale', async () => {
    const onScaleChange = jest.fn();
    await render(
      <PinchZoomView testID="view" maxScale={2} onScaleChange={onScaleChange}>
        <Text>content</Text>
      </PinchZoomView>
    );

    await fireAccessibilityAction('view', 'increment');
    await fireAccessibilityAction('view', 'increment');
    await fireAccessibilityAction('view', 'increment');
    expect(onScaleChange).toHaveBeenLastCalledWith(2);
  });

  it('does not zoom via accessibility action when disabled', async () => {
    const onScaleChange = jest.fn();
    await render(
      <PinchZoomView testID="view" disabled onScaleChange={onScaleChange}>
        <Text>content</Text>
      </PinchZoomView>
    );

    await fireAccessibilityAction('view', 'increment');
    expect(onScaleChange).not.toHaveBeenCalled();
  });

  it('exposes an imperative ref API to reset/getScale', async () => {
    const ref = React.createRef<PinchZoomViewHandle>();
    await render(
      <PinchZoomView ref={ref} testID="view" onScaleChange={jest.fn()}>
        <Text>content</Text>
      </PinchZoomView>
    );

    expect(ref.current?.getScale()).toBe(1);
    await fireAccessibilityAction('view', 'increment');
    expect(ref.current?.getScale()).toBe(1.5);

    React.act(() => {
      ref.current?.reset();
    });
    expect(ref.current?.getScale()).toBe(1);
  });

  it('claims the responder from the very first touch (single standalone gesture surface)', async () => {
    await render(
      <PinchZoomView testID="view">
        <Text>content</Text>
      </PinchZoomView>
    );
    expect(screen.getByTestId('view').props.onStartShouldSetResponder()).toBe(
      true
    );
  });

  it('does not claim the responder when disabled', async () => {
    await render(
      <PinchZoomView testID="view" disabled>
        <Text>content</Text>
      </PinchZoomView>
    );
    expect(screen.getByTestId('view').props.onStartShouldSetResponder()).toBe(
      false
    );
  });

  describe('dev warnings', () => {
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
      errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    it('warns when minScale is not less than maxScale', async () => {
      await render(
        <PinchZoomView testID="view" minScale={2} maxScale={2}>
          <Text>content</Text>
        </PinchZoomView>
      );

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '`minScale` (2) must be less than `maxScale` (2)'
        )
      );
    });
  });
});
