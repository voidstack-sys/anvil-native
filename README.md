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
unless you pass `forceMount` (useful when animating height yourself). Pass
`disabled` on an `Accordion.Item` to disable just that item, or on
`Accordion.Root` to disable the whole group at once.

**Imperative control.** Attach a ref to `Accordion.Root` to open/close items
from outside without owning the state yourself:

```tsx
import { useRef } from 'react';
import { Accordion, type AccordionHandle } from 'anvil-native';

function Example() {
  const accordionRef = useRef<AccordionHandle>(null);
  // accordionRef.current?.open('section-1')
  // accordionRef.current?.close('section-1')
  // accordionRef.current?.toggle('section-1')
  // accordionRef.current?.getValue() // -> string[]
  return <Accordion.Root ref={accordionRef} type="single">{/* ... */}</Accordion.Root>;
}
```

In controlled mode, `open`/`close`/`toggle` call your `onValueChange` instead
of mutating anything internally — same as pressing a trigger would.

**Dev-mode checks.** In development, `Accordion.Root` warns (via
`console.error`, once) if you switch between controlled and uncontrolled
usage after the first render, if `type` changes after mount, or if two
`Accordion.Item`s share the same `value`. These checks are stripped in
production builds.

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
selected and no `Tabs.Content` renders until one is picked. Pass `disabled`
on a `Tabs.Trigger` to disable just that tab, or on `Tabs.Root` to disable
the whole group at once.

**Imperative control.** Attach a ref to `Tabs.Root` to switch tabs from
outside without owning the state yourself:

```tsx
import { useRef } from 'react';
import { Tabs, type TabsHandle } from 'anvil-native';

function Example() {
  const tabsRef = useRef<TabsHandle>(null);
  // tabsRef.current?.select('settings')
  // tabsRef.current?.getValue() // -> string | null
  return <Tabs.Root ref={tabsRef}>{/* ... */}</Tabs.Root>;
}
```

**Dev-mode checks.** In development, `Tabs.Root` warns (via `console.error`,
once) if you switch between controlled and uncontrolled usage after the
first render, or if two `Tabs.Trigger`s share the same `value`. Stripped in
production builds.

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

Pass `disabled` on a `ToggleGroup.Item` to disable just that item, or on
`ToggleGroup.Root` to disable the whole group at once.

**Imperative control.** Attach a ref to `ToggleGroup.Root` to select/deselect
items from outside without owning the state yourself:

```tsx
import { useRef } from 'react';
import { ToggleGroup, type ToggleGroupHandle } from 'anvil-native';

function Example() {
  const groupRef = useRef<ToggleGroupHandle>(null);
  // groupRef.current?.select('bold')
  // groupRef.current?.deselect('bold')
  // groupRef.current?.toggle('bold')
  // groupRef.current?.getValue() // -> string[]
  return <ToggleGroup.Root ref={groupRef} type="multiple">{/* ... */}</ToggleGroup.Root>;
}
```

**Dev-mode checks.** In development, `ToggleGroup.Root` warns (via
`console.error`, once) if you switch between controlled and uncontrolled
usage after the first render, if `type` changes after mount, or if two
`ToggleGroup.Item`s share the same `value`. Stripped in production builds.

### Popover

```tsx
import { Popover } from 'anvil-native';
import { Text, View } from 'react-native';

function InfoPopover() {
  return (
    <Popover.Root>
      <Popover.Trigger>
        <Text>?</Text>
      </Popover.Trigger>
      <Popover.Content side="bottom" align="start" style={{ padding: 16, backgroundColor: 'white' }}>
        <Text>Some helpful info.</Text>
        <Popover.Close>
          <Text>Close</Text>
        </Popover.Close>
      </Popover.Content>
    </Popover.Root>
  );
}
```

`Popover.Content` renders inside React Native's own `Modal` (no extra native
dependencies), positioned relative to `Popover.Trigger` — or to
`Popover.Anchor` instead, if you want the floating content anchored to a
different element than the one that opens it (use one or the other, not
both). Position it with `side` (`'top' | 'bottom' | 'left' | 'right'`,
default `'bottom'`), `align` (`'start' | 'center' | 'end'`, default
`'center'`), and `sideOffset`/`alignOffset`. With `avoidCollisions` (default
`true`), it automatically flips to the opposite side and clamps its
cross-axis position so it never renders off-screen — the render-prop form
(`{ side }` shown above) tells you which side it actually landed on, handy
for pointing an arrow/caret at the trigger.

Pressing the backdrop closes the popover by default; set
`closeOnOutsidePress={false}` to require an explicit `Popover.Close` (or
imperative `.close()`) instead. Supports controlled (`open`/`onOpenChange`)
and uncontrolled (`defaultOpen`) usage, and `disabled` on `Popover.Root`
disables the trigger.

**Imperative control.**

```tsx
import { useRef } from 'react';
import { Popover, type PopoverHandle } from 'anvil-native';

function Example() {
  const popoverRef = useRef<PopoverHandle>(null);
  // popoverRef.current?.open()
  // popoverRef.current?.close()
  // popoverRef.current?.toggle()
  // popoverRef.current?.isOpen() // -> boolean
  return <Popover.Root ref={popoverRef}>{/* ... */}</Popover.Root>;
}
```

**Dev-mode checks.** In development, `Popover.Root` warns (via
`console.error`, once) if you switch between controlled and uncontrolled
`open` usage after the first render. Stripped in production builds.

## Coming soon

More primitives (`Select`, `Dialog`, `Menu`) are on the roadmap, following
the same headless, compound-component pattern — likely built on top of
`Popover`, which already solves positioning and the overlay.

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
