import * as React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Tabs } from '../primitives/Tabs';

function TabsExample({
  defaultValue,
  value,
  onValueChange,
  disabledValue,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabledValue?: string;
}) {
  return (
    <Tabs.Root
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
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
});
