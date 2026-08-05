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
calling `onChange` when `next` is truthy — or reach for `RadioGroup` (below),
which enforces that at the primitive level instead of leaving it to you.

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

### Dialog

```tsx
import { Dialog } from 'anvil-native';
import { Text, View } from 'react-native';

function DeleteDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <Text>Delete</Text>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Overlay style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} pointerEvents="box-none">
          <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 16 }}>
            <Dialog.Title>Delete this item?</Dialog.Title>
            <Dialog.Description>This can't be undone.</Dialog.Description>
            <Dialog.Close>
              <Text>Cancel</Text>
            </Dialog.Close>
          </View>
        </View>
      </Dialog.Content>
    </Dialog.Root>
  );
}
```

Unlike `Popover`, `Dialog.Content` isn't anchored or positioned relative to
the trigger — it's a centered, blocking overlay, so you lay out the panel
yourself (as shown above) inside `Dialog.Content`, typically with
`Dialog.Overlay` (a styleable, closes-on-press-by-default backdrop — pass
`closeOnPress={false}` to require an explicit close action instead) as its
first child and a centering wrapper with `pointerEvents="box-none"` so taps
outside your panel still reach the overlay underneath.

`Dialog.Title` and `Dialog.Description` aren't just semantic labels — they
register themselves with `Dialog.Content` so it gets a matching
`accessibilityLabelledBy` (Android) / `aria-describedby`, so a screen reader
entering the dialog announces the right name and description automatically.
Supports the same controlled (`open`/`onOpenChange`) / uncontrolled
(`defaultOpen`), `disabled`, imperative ref (`DialogHandle` — `open`/
`close`/`toggle`/`isOpen`), and dev-mode controlled/uncontrolled warning as
`Popover`.

For destructive confirmations ("delete this?") where dismissing by accident
would be a real problem, reach for `AlertDialog` (below) instead — same
shape, safer defaults.

### Menu

```tsx
import { Menu } from 'anvil-native';
import { Text, View } from 'react-native';

function RowMenu() {
  return (
    <Menu.Root>
      <Menu.Trigger>
        <Text>⋮</Text>
      </Menu.Trigger>
      <Menu.Content align="start" style={{ backgroundColor: 'white', paddingVertical: 8 }}>
        <Menu.Label>Actions</Menu.Label>
        <Menu.Item onSelect={() => console.log('edit')}>
          <Text>Edit</Text>
        </Menu.Item>
        <Menu.Separator style={{ height: 1, backgroundColor: '#ccc' }} />
        <Menu.Item onSelect={() => console.log('delete')}>
          <Text>Delete</Text>
        </Menu.Item>
      </Menu.Content>
    </Menu.Root>
  );
}
```

`Menu` is what `Popover` becomes once you add selectable actions: `Menu.Content`
is anchored and positioned relative to `Menu.Trigger` exactly like
`Popover.Content` (same `side`/`align`/`sideOffset`/`alignOffset`/
`avoidCollisions`/`closeOnOutsidePress` props, same auto-flip-and-clamp
behavior), and gets `accessibilityRole="menu"`. `Menu.Item` gets
`accessibilityRole="menuitem"`, calls its `onSelect` and then closes the menu
when pressed — pass `closeOnSelect={false}` to keep it open (handy for an
item that itself opens a submenu or a confirmation). `Menu.Separator` and
`Menu.Label` are unstyled structural helpers for grouping items. Supports the
same `disabled`, imperative ref (`MenuHandle`), and dev-mode
controlled/uncontrolled warning as `Popover`.

If you need a list of *choosable, stateful* options instead of one-shot
actions (e.g. "sort by: name/date/size" with a persisted current value),
that's `Select`'s job, not `Menu`'s — see below.

### Select

```tsx
import { Select } from 'anvil-native';
import { Text } from 'react-native';

const FRUITS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
];

function FruitSelect() {
  return (
    <Select.Root defaultValue="apple">
      <Select.Trigger>
        <Select.Value placeholder="Pick a fruit" />
      </Select.Trigger>
      <Select.Content align="start" style={{ backgroundColor: 'white', paddingVertical: 8 }}>
        {FRUITS.map((fruit) => (
          <Select.Item key={fruit.value} value={fruit.value}>
            <Select.ItemText>{fruit.label}</Select.ItemText>
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}
```

`Select` combines `Popover`'s floating, anchored `Content` (same
`side`/`align`/`sideOffset`/`alignOffset`/`avoidCollisions`/
`closeOnOutsidePress` props and auto-flip-and-clamp behavior) with a
persisted `value`, the same way `ToggleGroup` does for inline groups.
`Select.Trigger` gets `accessibilityRole="combobox"`; `Select.Item` gets
`accessibilityState={{ selected }}` and, by default, selecting it closes the
menu (`closeOnSelect={false}` to keep it open). Supports controlled
(`value`/`onValueChange`) and uncontrolled (`defaultValue`) selection,
independently controlled/uncontrolled open state
(`open`/`onOpenChange`/`defaultOpen`), root-level `disabled`, and an
imperative ref (`SelectHandle` — `open`/`close`/`toggle`/`isOpen`/
`getValue`/`setValue`).

`Select.Value` needs to know the label of whichever item is currently
selected, which it reads from `Select.ItemText` — wrap each item's visible
label in `Select.ItemText` (a plain string child) rather than putting text
directly in `Select.Item`, or `Select.Value` won't have anything to display
and dev builds will warn you about it.

**Dev-mode checks.** In development, `Select.Root` warns if you switch
between controlled and uncontrolled `value` (or `open`) usage after the
first render, if two sibling `Select.Item`s share the same `value`, or if
`Select.ItemText` doesn't receive a plain string child.

### Checkbox

```tsx
import { Checkbox } from 'anvil-native';
import { Text, View } from 'react-native';

function AgreeCheckbox() {
  return (
    <Checkbox.Root>
      {({ checked }) => (
        <>
          <View style={{ width: 20, height: 20, borderWidth: 1 }}>
            <Checkbox.Indicator>
              <Text>{checked === 'indeterminate' ? '−' : '✓'}</Text>
            </Checkbox.Indicator>
          </View>
          <Text>I agree</Text>
        </>
      )}
    </Checkbox.Root>
  );
}
```

`Checkbox.Root` is itself the pressable element (`accessibilityRole="checkbox"`)
— there's no separate `Trigger`. `checked` is `boolean | 'indeterminate'`, for
the classic "select all" case where only some of a group's items are checked;
pressing an indeterminate checkbox always moves it to `true` (never back to
`false`), matching how indeterminate checkboxes behave everywhere else.
`Checkbox.Indicator` renders its children only while `checked` isn't `false`
— pass `forceMount` to keep it mounted (e.g. to drive your own enter/exit
animation) and read `checked` yourself to decide what to show.

Supports controlled (`checked`/`onCheckedChange`) and uncontrolled
(`defaultChecked`) usage, `disabled`, and an imperative ref (`CheckboxHandle`
— `toggle`/`setChecked`/`getChecked`).

**Dev-mode checks.** In development, `Checkbox.Root` warns (via
`console.error`, once) if you switch between controlled and uncontrolled
`checked` usage after the first render. Stripped in production builds.

### Switch

```tsx
import { Switch } from 'anvil-native';
import { View } from 'react-native';

function NotificationsSwitch() {
  return (
    <Switch.Root>
      {({ checked }) => (
        <View style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: checked ? 'black' : '#ccc' }}>
          <Switch.Thumb
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: 'white',
              alignSelf: checked ? 'flex-end' : 'flex-start',
            }}
          />
        </View>
      )}
    </Switch.Root>
  );
}
```

`Switch` is `Checkbox`'s boolean-only sibling: same shape (`Switch.Root` is
the pressable itself, `accessibilityRole="switch"`), but `checked` is always
`boolean` — no `'indeterminate'`, since a physical on/off switch has no
third state. Unlike `Checkbox.Indicator`, `Switch.Thumb` always renders (in
both states) since a switch's thumb *moves* rather than appearing/
disappearing — read `checked` off `Switch.Root`'s render-prop (as shown
above) or off `Switch.Thumb`'s own render-prop to position/color it
yourself.

Supports controlled (`checked`/`onCheckedChange`) and uncontrolled
(`defaultChecked`) usage, `disabled`, and an imperative ref (`SwitchHandle`
— `toggle`/`setChecked`/`getChecked`).

**Dev-mode checks.** In development, `Switch.Root` warns (via
`console.error`, once) if you switch between controlled and uncontrolled
`checked` usage after the first render. Stripped in production builds.

### RadioGroup

```tsx
import { RadioGroup } from 'anvil-native';
import { Text, View } from 'react-native';

const SHIPPING_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'express', label: 'Express' },
];

function ShippingPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <RadioGroup.Root value={value} onValueChange={(next) => next && onChange(next)}>
      {SHIPPING_OPTIONS.map((option) => (
        <RadioGroup.Item key={option.value} value={option.value}>
          <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1 }}>
            <RadioGroup.Indicator>
              <View style={{ flex: 1, margin: 4, borderRadius: 6, backgroundColor: 'black' }} />
            </RadioGroup.Indicator>
          </View>
          <Text>{option.label}</Text>
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
```

`RadioGroup` is `ToggleGroup`'s `type="single"` counterpart with strict radio
semantics baked in, instead of left to the consumer: `RadioGroup.Root` gets
`accessibilityRole="radiogroup"`, each `RadioGroup.Item` gets
`accessibilityRole="radio"`, and pressing an already-selected item is always
a no-op — there's no `onValueChange(null)` to filter out, because the value
can never be cleared from the UI. `RadioGroup.Indicator` works exactly like
`Checkbox.Indicator`: it only renders while its `RadioGroup.Item` is
selected (pass `forceMount` to keep it mounted for your own animation).

Supports controlled (`value`/`onValueChange`) and uncontrolled
(`defaultValue`) selection, `disabled` (on an item, or on the whole
`RadioGroup.Root`), and an imperative ref (`RadioGroupHandle` —
`select`/`getValue`, plus `clear()` for the programmatic-only case of
resetting the selection, e.g. a "reset form" button).

**Dev-mode checks.** In development, `RadioGroup.Root` warns if you switch
between controlled and uncontrolled `value` usage after the first render, or
if two sibling `RadioGroup.Item`s share the same `value`.

### AlertDialog

```tsx
import { AlertDialog } from 'anvil-native';
import { Text, View } from 'react-native';

function DeleteAccountAlert() {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger>
        <Text>Delete account</Text>
      </AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Overlay style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} pointerEvents="box-none">
          <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 16 }}>
            <AlertDialog.Title>Delete your account?</AlertDialog.Title>
            <AlertDialog.Description>This is permanent.</AlertDialog.Description>
            <AlertDialog.Cancel>
              <Text>Cancel</Text>
            </AlertDialog.Cancel>
            <AlertDialog.Action onPress={() => deleteAccount()}>
              <Text>Delete</Text>
            </AlertDialog.Action>
          </View>
        </View>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
```

`AlertDialog` is `Dialog` with the defaults flipped for destructive
confirmations: `AlertDialog.Overlay`'s `closeOnPress` defaults to `false`
(vs. `true` on `Dialog.Overlay`), and `AlertDialog.Content`'s
`closeOnRequestClose` (the Android hardware back button) also defaults to
`false` — so it can't be dismissed by an accidental tap outside or a back
press, only by an explicit `Cancel` or `Action`. Everything else about
layout and structure (you build the panel yourself inside `Content`, same
`Title`/`Description` accessibility linking) matches `Dialog` exactly.

`AlertDialog.Cancel` and `AlertDialog.Action` both close the dialog by
default when pressed — `Action` additionally accepts `closeOnPress={false}`
for confirm actions that do async work (e.g. an API call) and need to stay
open, perhaps with a loading state, until you close it yourself via an
imperative `AlertDialogHandle.close()`.

Supports the same controlled (`open`/`onOpenChange`) / uncontrolled
(`defaultOpen`), `disabled`, imperative ref (`AlertDialogHandle`), and
dev-mode controlled/uncontrolled warning as `Dialog`.

### Progress

```tsx
import { Progress } from 'anvil-native';
import { View } from 'react-native';

function DownloadProgress({ percent }: { percent: number }) {
  return (
    <Progress.Root value={percent} style={{ height: 8, borderRadius: 4, backgroundColor: '#eee' }}>
      <Progress.Indicator style={{ flex: 1 }}>
        {({ percentage }) => (
          <View style={{ height: '100%', width: `${percentage}%`, backgroundColor: 'black' }} />
        )}
      </Progress.Indicator>
    </Progress.Root>
  );
}
```

`Progress` is display-only — there's no internal state, no `Trigger`, no
imperative ref: `value` is a number you own and pass in directly (or `null`
for an indeterminate progress bar with an unknown duration, e.g. while
syncing). `Progress.Root` computes `percentage` (`value` expressed as
0-100, clamped, or `null` while indeterminate) and hands it to both its own
render-prop and `Progress.Indicator`'s, so you can size the filled portion
yourself — Anvil doesn't render or animate anything for you.

`Progress.Root` gets `accessibilityRole="progressbar"` with a proper
`accessibilityValue` (`min`/`max`/`now`, plus a `text` — defaulting to a
rounded percentage, override via `getValueLabel`) and
`accessibilityState={{ busy: true }}` while indeterminate, so screen readers
announce it correctly with no extra work.

**Dev-mode checks.** In development, `Progress.Root` warns (via
`console.error`, once) if `value` falls outside the `0..max` range, or if
`max` isn't greater than 0.

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
