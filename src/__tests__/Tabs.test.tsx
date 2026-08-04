import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Tabs } from '../primitives/Tabs';
import type { TabsHandle } from '../primitives/Tabs';

function TabsExample({
  defaultValue,
  value,
  onValueChange,
  disabledValue,
  disabled,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabledValue?: string;
  disabled?: boolean;
}) {
  return (
    <Tabs.Root
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <Tabs.List>
        <Tabs.Trigger value="profile" testID="trigger-profile">
          <Text>Profile</Text>
        </Tabs.Trigger>
        <Tabs.Trigger
          value="settings"
          testID="trigger-settings"
          disabled={disabledValue === 'settings'}
        >
          <Text>Settings</Text>
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="profile" testID="content-profile">
        <Text>Profile content</Text>
      </Tabs.Content>
      <Tabs.Content value="settings" testID="content-settings">
        <Text>Settings content</Text>
      </Tabs.Content>
    </Tabs.Root>
  );
}

describe('Tabs', () => {
  it('shows no content until a tab is selected when there is no defaultValue', async () => {
    await render(<TabsExample />);

    expect(screen.queryByTestId('content-profile')).toBeNull();
    expect(screen.queryByTestId('content-settings')).toBeNull();
  });

  it('respects defaultValue for uncontrolled usage', async () => {
    await render(<TabsExample defaultValue="profile" />);

    expect(screen.getByTestId('content-profile')).toBeTruthy();
    expect(screen.queryByTestId('content-settings')).toBeNull();
  });

  it('switches tabs on press, showing only the active content', async () => {
    await render(<TabsExample defaultValue="profile" />);

    await fireEvent.press(screen.getByTestId('trigger-settings'));

    expect(screen.queryByTestId('content-profile')).toBeNull();
    expect(screen.getByTestId('content-settings')).toBeTruthy();
  });

  it('supports controlled mode via value/onValueChange', async () => {
    const onValueChange = jest.fn();

    function Controlled() {
      const [value, setValue] = React.useState('profile');
      return (
        <TabsExample
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue(next);
          }}
        />
      );
    }

    await render(<Controlled />);

    await fireEvent.press(screen.getByTestId('trigger-settings'));
    expect(onValueChange).toHaveBeenCalledWith('settings');
    expect(screen.getByTestId('content-settings')).toBeTruthy();
  });

  it('does not switch to a disabled tab', async () => {
    await render(
      <TabsExample defaultValue="profile" disabledValue="settings" />
    );

    await fireEvent.press(screen.getByTestId('trigger-settings'));
    expect(screen.getByTestId('content-profile')).toBeTruthy();
    expect(screen.queryByTestId('content-settings')).toBeNull();
  });

  it('exposes accessibilityState.selected and the tab/tablist roles', async () => {
    await render(<TabsExample defaultValue="profile" />);

    const profileTrigger = screen.getByTestId('trigger-profile');
    const settingsTrigger = screen.getByTestId('trigger-settings');

    expect(profileTrigger.props.accessibilityRole).toBe('tab');
    expect(profileTrigger.props.accessibilityState).toEqual({
      selected: true,
      disabled: false,
    });
    expect(settingsTrigger.props.accessibilityState).toEqual({
      selected: false,
      disabled: false,
    });

    await fireEvent.press(settingsTrigger);

    expect(
      screen.getByTestId('trigger-profile').props.accessibilityState
    ).toEqual({
      selected: false,
      disabled: false,
    });
  });

  it('root disabled disables every trigger regardless of its own disabled prop', async () => {
    await render(<TabsExample defaultValue="profile" disabled />);

    const settingsTrigger = screen.getByTestId('trigger-settings');
    expect(settingsTrigger.props.accessibilityState.disabled).toBe(true);

    await fireEvent.press(settingsTrigger);
    expect(screen.getByTestId('content-profile')).toBeTruthy();
    expect(screen.queryByTestId('content-settings')).toBeNull();
  });

  it('exposes an imperative ref API to select tabs and read the value', async () => {
    const ref = React.createRef<TabsHandle>();

    await render(
      <Tabs.Root ref={ref}>
        <Tabs.List>
          <Tabs.Trigger value="profile" testID="trigger-profile">
            <Text>Profile</Text>
          </Tabs.Trigger>
          <Tabs.Trigger value="settings" testID="trigger-settings">
            <Text>Settings</Text>
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="profile" testID="content-profile">
          <Text>Profile content</Text>
        </Tabs.Content>
        <Tabs.Content value="settings" testID="content-settings">
          <Text>Settings content</Text>
        </Tabs.Content>
      </Tabs.Root>
    );

    expect(ref.current?.getValue()).toBeNull();

    React.act(() => {
      ref.current?.select('settings');
    });

    expect(ref.current?.getValue()).toBe('settings');
    expect(screen.getByTestId('content-settings')).toBeTruthy();
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
        return <TabsExample value={controlled ? 'profile' : undefined} />;
      }

      const { rerender } = await render(<Wrapper controlled={false} />);
      expect(errorSpy).not.toHaveBeenCalled();

      await rerender(<Wrapper controlled />);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('is changing from uncontrolled to controlled')
      );
    });

    it('warns when two triggers share the same value', async () => {
      await render(
        <Tabs.Root defaultValue="profile">
          <Tabs.List>
            <Tabs.Trigger value="profile" testID="trigger-a">
              <Text>Profile</Text>
            </Tabs.Trigger>
            <Tabs.Trigger value="profile" testID="trigger-b">
              <Text>Profile duplicate</Text>
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      );

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'found more than one item with the value "profile"'
        )
      );
    });
  });
});
