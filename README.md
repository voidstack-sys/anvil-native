# anvil-native

[![npm version](https://img.shields.io/npm/v/anvil-native.svg)](https://www.npmjs.com/package/anvil-native)
[![npm downloads](https://img.shields.io/npm/dm/anvil-native.svg)](https://www.npmjs.com/package/anvil-native)
[![CI](https://github.com/voidstack-sys/anvil-native/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/voidstack-sys/anvil-native/actions/workflows/ci.yml)
[![types](https://img.shields.io/npm/types/anvil-native.svg)](./src/index.tsx)
[![license](https://img.shields.io/npm/l/anvil-native.svg)](./LICENSE)

Headless, accessible UI primitives for React Native.

Anvil gives you the hard parts of building interactive components — state
management, gestures, and correct `accessibilityRole`/`accessibilityState` —
without imposing any visual style. You bring the `style`, Anvil brings the
behavior. Think of it as [Radix UI](https://www.radix-ui.com/) for React
Native.

## Features

- **Headless** — no rendered styles, no theme to fight. Every primitive
  accepts your `style` and exposes its state (`open`, `selected`,
  `expanded`, ...) via render-props so you decide what it looks like.
- **Accessible by default** — the correct `accessibilityRole` and
  `accessibilityState`/`accessibilityValue` are wired up for you on every
  primitive, including screen-reader-operable actions on `Slider` and
  proper focus-visible-equivalent modal semantics on overlays.
- **No extra native dependencies** — overlays use React Native's own
  `Modal`, `Slider` uses `PanResponder`. Nothing to link, no config plugins,
  works in a plain Expo managed app.
- **TypeScript-first** — every prop, render-prop, and imperative ref is
  fully typed; `.d.ts` files ship in the package.
- **Hardened for real usage** — root-level `disabled`, imperative refs
  (`open()`/`toggle()`/`getValue()`/...), and dev-mode-only
  `console.error` warnings that catch common mistakes (mismatched
  controlled/uncontrolled usage, duplicate item values, out-of-range
  values) before they ship — all stripped from production builds.
- **Touch-first, deliberately** — built for phone/tablet touchscreens.
  Keyboard and D-pad navigation are explicitly out of scope; see each
  primitive's accessibility notes for what *is* covered for screen reader
  users.

## Primitives

| Primitive | What it's for |
| --- | --- |
| [`Accordion`](#accordion) | Expand/collapse one or many labeled sections |
| [`Tabs`](#tabs) | Switch between panels sharing the same space |
| [`ToggleGroup`](#togglegroup) | A row of options, single- or multi-select |
| [`Collapsible`](#collapsible) | One standalone expand/collapse panel |
| [`Separator`](#separator) | A decorative (or semantic) dividing line |
| [`AspectRatio`](#aspectratio) | Constrain a child to a fixed width/height ratio |
| [`Label`](#label) | A pressable, `nativeID`-bearing label for a control |
| [`Popover`](#popover) | Floating, anchored content triggered by a press |
| [`Dialog`](#dialog) | A centered, blocking modal |
| [`AlertDialog`](#alertdialog) | A `Dialog` that can't be dismissed by accident, for destructive confirmations |
| [`Menu`](#menu) | A floating list of one-shot actions |
| [`ContextMenu`](#contextmenu) | A `Menu` triggered by long-press, anchored at the touch point |
| [`Select`](#select) | A floating list of choosable, stateful options |
| [`Checkbox`](#checkbox) | A boolean (or indeterminate) toggle |
| [`Switch`](#switch) | A boolean on/off control |
| [`RadioGroup`](#radiogroup) | Exactly one selection among several options |
| [`Slider`](#slider) | Drag (or single- or multi-thumb range) to pick a numeric value |
| [`Progress`](#progress) | A determinate or indeterminate progress indicator |
| [`Toast`](#toast) | A non-blocking, auto-dismissing notification |

## Installation

```sh
npm install anvil-native
```

## Requirements

- React 18 or newer (`Dialog`/`AlertDialog` use the `useId` hook).
- Any recent React Native version — Anvil only uses stable, built-in APIs
  (`Modal`, `PanResponder`, `Pressable`, the `aspectRatio` style).
- Works in Expo (managed workflow) out of the box — no native code, no
  config plugins, nothing to prebuild for.

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
that's `Select`'s job, not `Menu`'s — see below. If you need the menu
triggered by a long-press on arbitrary content instead of a dedicated
trigger button, that's `ContextMenu` (see below), not `Menu`.

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

### Slider

```tsx
import { Slider } from 'anvil-native';

function Volume({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <Slider.Root value={[value]} onValueChange={([next]) => onChange(next)}>
      <Slider.Track style={{ height: 4, borderRadius: 2, backgroundColor: '#eee' }}>
        <Slider.Range style={{ height: 4, borderRadius: 2, backgroundColor: 'black' }} />
        <Slider.Thumb
          style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: 'white', borderWidth: 1 }}
        />
      </Slider.Track>
    </Slider.Root>
  );
}
```

`Slider` uses `PanResponder` (built into React Native, no extra native
dependency) rather than a gesture library, so dragging a `Slider.Thumb`
works out of the box. `value` is an array — one entry per thumb — so a
plain slider is `[value]` and a range slider is `[low, high]`:

```tsx
<Slider.Root value={[20, 70]} onValueChange={setRange} min={0} max={100}>
  <Slider.Track>
    <Slider.Range />
    <Slider.Thumb index={0} />
    <Slider.Thumb index={1} />
  </Slider.Track>
</Slider.Root>
```

Each `Slider.Thumb` takes an explicit `index` into `value` (defaulting to
`0`, the common single-thumb case) rather than inferring it from render
order — more verbose than some slider APIs, but it can't silently break if
a thumb is ever conditionally rendered. Multi-thumb values are always
clamped against their neighbors, so thumbs can never cross each other,
whether you're dragging or setting `value` programmatically.

`Slider.Track` measures its own width (via `onLayout`) to convert drag
pixels into a value delta; `Slider.Thumb` positions itself along the track
based on `value`/`min`/`max` and its own measured width, so it's centered
correctly without you doing any math. `Slider.Range` is the optional filled
portion between the track's start and the value (or between two thumbs, for
a range).

`Slider.Thumb` also gets `accessibilityRole="adjustable"` with a proper
`accessibilityValue`, and responds to the increment/decrement accessibility
actions VoiceOver/TalkBack expose for that role — so it's fully operable by
screen reader users via swipe-up/down, not just by dragging.

Supports controlled (`value`/`onValueChange`) and uncontrolled
(`defaultValue`), `min`/`max`/`step`, `disabled`, `onValueCommit` (fires
once when a drag or accessibility adjustment ends — handy for expensive
side effects you don't want firing on every intermediate move), and an
imperative ref (`SliderHandle` — `getValue`/`setValue`).

Scope note: horizontal only for now (vertical sliders are uncommon on
touch-first mobile UIs); tapping the track to jump the thumb straight to
that position isn't implemented, only dragging the thumb itself.

**Dev-mode checks.** In development, `Slider.Root` warns if you switch
between controlled and uncontrolled `value` usage after the first render,
if `min >= max`, if `step` isn't greater than 0, or if the initial
`value`/`defaultValue` entries aren't in ascending order.

### Separator

```tsx
import { Separator } from 'anvil-native';

<Separator style={{ height: 1, backgroundColor: '#ccc' }} />
```

The simplest primitive in Anvil: a `View` that's hidden from assistive
technology by default (`decorative`, since most separators are purely
visual dividers between sections). Pass `decorative={false}` if this one
actually carries meaning that should be announced.

### Collapsible

```tsx
import { Collapsible } from 'anvil-native';
import { Text } from 'react-native';

function ShowMore() {
  return (
    <Collapsible.Root>
      <Collapsible.Trigger>
        {({ open }) => <Text>{open ? 'Show less' : 'Show more'}</Text>}
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Text>The extra detail that was hidden.</Text>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
```

A single expand/collapse panel that isn't part of a group — everything
`Accordion.Item` gives you, without needing an `Accordion.Root` around it.
Same controlled (`open`/`onOpenChange`) / uncontrolled (`defaultOpen`)
support, `disabled`, `forceMount` on `Content`, imperative ref
(`CollapsibleHandle`), and dev-mode controlled/uncontrolled warning as the
other primitives.

### AspectRatio

```tsx
import { AspectRatio } from 'anvil-native';
import { Image } from 'react-native';

<AspectRatio ratio={16 / 9}>
  <Image source={{ uri: '...' }} style={{ flex: 1 }} />
</AspectRatio>
```

A thin wrapper around React Native's own `aspectRatio` style — mostly worth
using for the self-documenting API and the dev-mode check, since RN already
supports `aspectRatio` natively (no padding-bottom-hack workaround needed,
unlike the CSS story `AspectRatio` originally solved on the web).

**Dev-mode checks.** Warns (via `console.error`, once) if `ratio` isn't
greater than 0.

### Label

```tsx
import { Label } from 'anvil-native';
import { useRef } from 'react';
import { Checkbox, type CheckboxHandle } from 'anvil-native';

function AgreeToTerms() {
  const checkboxRef = useRef<CheckboxHandle>(null);
  return (
    <>
      <Checkbox.Root ref={checkboxRef}>{/* ... */}</Checkbox.Root>
      <Label onPress={() => checkboxRef.current?.toggle()}>
        I agree to the terms
      </Label>
    </>
  );
}
```

React Native has no `<label for>` — the OS-level link between a label and
its control (`accessibilityLabelledBy`) has to be set on the *control*
itself, not inferred from nearby markup the way HTML does. `Label` can't
change that, but it gives you the two pieces you actually need: a stable
`nativeID` (pass it to your control's `accessibilityLabelledBy`, or read it
off the render-prop: `<Label>{({ id }) => ...}</Label>`), and a pressable
`Text` you can wire an `onPress` onto so tapping the label text also
activates the control — a bigger, more forgiving tap target than the
control alone, which is exactly what `Dialog.Title` already does for you
internally. `Label` makes that same pattern available in your own
compositions.

### ContextMenu

```tsx
import { ContextMenu } from 'anvil-native';
import { Text, View } from 'react-native';

function RowWithContextMenu() {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <View>
          <Text>Long-press me</Text>
        </View>
      </ContextMenu.Trigger>
      <ContextMenu.Content style={{ backgroundColor: 'white', paddingVertical: 8 }}>
        <ContextMenu.Item onSelect={() => console.log('edit')}>
          <Text>Edit</Text>
        </ContextMenu.Item>
        <ContextMenu.Item onSelect={() => console.log('delete')}>
          <Text>Delete</Text>
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
}
```

`ContextMenu` is `Menu` triggered by a long-press instead of a tap, and
anchored at the touch point instead of the trigger's bounding box —
everything else (`Item`/`Separator`/`Label`, `side`/`align`/`sideOffset`/
`alignOffset`/`avoidCollisions`/`closeOnOutsidePress`, the auto-flip-and-
clamp behavior, `accessibilityRole="menu"`/`"menuitem"`) is identical to
`Menu`. The imperative ref (`ContextMenuHandle`) is the one real API
difference: `open` takes a point (`{ x, y }`, e.g. from a
`GestureResponderEvent`'s `pageX`/`pageY`) instead of nothing, since there's
no trigger view to measure — there's also no `toggle`, since a long-press
gesture only ever means "open," never "open or close depending on state."

**Dev-mode checks.** Same controlled/uncontrolled `open` warning as `Menu`.

### Toast

```tsx
import { Toast } from 'anvil-native';
import { Text, View } from 'react-native';
import { useRef } from 'react';
import type { ToastHandle } from 'anvil-native';

function SaveButton() {
  const toastRef = useRef<ToastHandle>(null);
  return (
    <Toast.Provider>
      <Text onPress={() => toastRef.current?.open()}>Save</Text>
      <Toast.Viewport
        pointerEvents="box-none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
      >
        <Toast.Root ref={toastRef} style={{ backgroundColor: 'black', padding: 16 }}>
          <Toast.Title style={{ color: 'white' }}>Saved</Toast.Title>
          <Toast.Description style={{ color: '#ccc' }}>
            Your changes were saved.
          </Toast.Description>
        </Toast.Root>
      </Toast.Viewport>
    </Toast.Provider>
  );
}
```

React Native has no portal API, so unlike Anvil's other overlays `Toast`
doesn't use `Modal` — a `Modal` would block touches to the rest of your app,
which is exactly wrong for a non-blocking notification. `Toast.Viewport` is
just a positioning container: place it wherever you want toasts to appear —
top or bottom, it's entirely your `style` — and render your `Toast.Root`s
into it; there's no built-in queue, the same way `Dialog` doesn't manage
"only one dialog at a time" for you — track your own array of active toasts
and `.map()` over it, same as any other list of stateful items.

**Placement matters.** For the Viewport to actually float in a fixed screen
position instead of scrolling away with the rest of your content, it needs
to be a *sibling* of your `ScrollView` (or whatever scrolls), not a child of
it — e.g. both nested inside one root `View`, with the Viewport
absolutely-positioned (`position: 'absolute', top: 0` or `bottom: 0`,
`left: 0`, `right: 0`) and `pointerEvents="box-none"` so it doesn't swallow
touches to the content underneath it when no toast is showing.

`Toast.Root` auto-dismisses after `duration` (default 5000ms, or
`Toast.Provider`'s `defaultDuration` if you don't set one; pass
`duration={Infinity}` to disable auto-dismiss). The dismiss timer restarts
if `duration` changes while open. `Toast.Viewport` sets
`accessibilityLiveRegion="polite"` so Android's TalkBack announces new
toasts automatically; iOS has no equivalent view prop, so `Toast.Root`
calls `AccessibilityInfo.announceForAccessibility` itself once `Title`/
`Description`'s text is available.

Supports controlled (`open`/`onOpenChange`) and uncontrolled (`defaultOpen`)
usage, an imperative ref (`ToastHandle` — `open`/`close`/`toggle`/
`isOpen`), and `Toast.Action`/`Toast.Close` (both close by default when
pressed; `Action` additionally accepts `closeOnPress={false}` for actions
like "Undo" that need to do work before the toast disappears).

**Dev-mode checks.** Same controlled/uncontrolled `open` warning as the
other overlay primitives.

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
