# anvil-native

Headless, accessible UI primitives for React Native.

Anvil gives you the hard parts of building interactive components — state
management, gestures, and correct `accessibilityRole`/`accessibilityState` —
without imposing any visual style. You bring the `style`, Anvil brings the
behavior. Think of it as [Radix UI](https://www.radix-ui.com/) for React
Native.

## Installation

```sh
npm install anvil-native
```

## Usage

### Accordion

```tsx
import { Accordion } from 'anvil-native';
import { Pressable, Text, View } from 'react-native';

function FAQ() {
  return (
    <Accordion.Root type="single">
      <Accordion.Item value="what-is-anvil">
        <Accordion.Trigger>
          {({ expanded }) => (
            <View style={{ flexDirection: 'row', padding: 16 }}>
              <Text style={{ flex: 1 }}>What is Anvil?</Text>
              <Text>{expanded ? '−' : '+'}</Text>
            </View>
          )}
        </Accordion.Trigger>
        <Accordion.Content>
          <Text style={{ padding: 16, paddingTop: 0 }}>
            A headless, accessible primitives library for React Native.
          </Text>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
}
```

`Accordion.Root` accepts `type="single"` (one item open at a time, with an
optional `collapsible` prop) or `type="multiple"` (any number of items open),
and supports both controlled (`value`/`onValueChange`) and uncontrolled
(`defaultValue`) usage. `Accordion.Trigger`'s `accessibilityState.expanded` is
kept in sync automatically, and `Accordion.Content` unmounts when closed
unless you pass `forceMount` (useful when animating height yourself).

See the [example app](example/src/App.tsx) for a fully styled demo.

### Tabs

```tsx
import { Tabs } from 'anvil-native';
import { Text, View } from 'react-native';

function ProfileTabs() {
  return (
    <Tabs.Root defaultValue="profile">
      <Tabs.List style={{ flexDirection: 'row' }}>
        <Tabs.Trigger value="profile">
          {({ selected }) => (
            <Text style={{ fontWeight: selected ? '700' : '400' }}>Profile</Text>
          )}
        </Tabs.Trigger>
        <Tabs.Trigger value="settings">
          {({ selected }) => (
            <Text style={{ fontWeight: selected ? '700' : '400' }}>Settings</Text>
          )}
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="profile">
        <Text>Profile content</Text>
      </Tabs.Content>
      <Tabs.Content value="settings">
        <Text>Settings content</Text>
      </Tabs.Content>
    </Tabs.Root>
  );
}
```

`Tabs.List` gets `accessibilityRole="tablist"` and each `Tabs.Trigger` gets
`accessibilityRole="tab"` with `accessibilityState.selected` kept in sync.
Like `Accordion`, it supports controlled (`value`/`onValueChange`) and
uncontrolled (`defaultValue`) usage — note that without either, no tab starts
selected and no `Tabs.Content` renders until one is picked.

### ToggleGroup

```tsx
import { ToggleGroup } from 'anvil-native';
import { Text, View } from 'react-native';

function TextAlignPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(next) => next && onChange(next)}
      style={{ flexDirection: 'row' }}
    >
      {['left', 'center', 'right'].map((option) => (
        <ToggleGroup.Item key={option} value={option}>
          {({ selected }) => (
            <View style={{ padding: 8, opacity: selected ? 1 : 0.5 }}>
              <Text>{option}</Text>
            </View>
          )}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
```

`ToggleGroup.Root` accepts `type="single"` (`accessibilityRole="radiogroup"`
on the root, `"radio"` on each item) or `type="multiple"`
(`accessibilityRole="checkbox"` on each item), each item's
`accessibilityState.checked` kept in sync, and the same controlled/
uncontrolled support as the other primitives.

Note that `type="single"` behaves like a *toggle*, not a strict radio group:
pressing the already-selected item deselects it (`onValueChange` fires with
`null`). If you need "always exactly one selected," ignore the `null` in your
own `onValueChange` handler, as the example above does implicitly by only
calling `onChange` when `next` is truthy.

## Coming soon

More primitives (`Select`, `Popover`, `Dialog`, `Menu`) are on the roadmap,
following the same headless, compound-component pattern.

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
