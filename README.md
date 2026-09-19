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
| [`Toggle`](#toggle) | A single pressed/not-pressed button |
| [`Progress`](#progress) | A determinate or indeterminate progress indicator |
| [`Toast`](#toast) | A non-blocking, auto-dismissing notification |
| [`VisuallyHidden`](#visuallyhidden) | Content hidden visually but readable by screen readers |
| [`PinInput`](#pininput) | A verification-code input backed by one real, hidden `TextInput` |
| [`Tooltip`](#tooltip) | A floating hint triggered by long-press, hover, or focus |
| [`Avatar`](#avatar) | A profile image with an automatic loading/error fallback |
| [`PasswordToggleField`](#passwordtogglefield) | A password input with a show/hide toggle |
| [`Toolbar`](#toolbar) | An accessible, disable-as-a-group row of controls |
| [`BottomSheet`](#bottomsheet) | A panel that slides up from the bottom, with swipe-to-dismiss |
| [`Stepper`](#stepper) | A +/- control for picking a numeric value |
| [`Rating`](#rating) | Tap or drag across icons (stars, etc.) to pick a value |
| [`SwipeableRow`](#swipeablerow) | A list row that reveals actions when swiped, like Mail/Gmail |
| [`Badge`](#badge) | A notification-count indicator, with automatic "99+" clamping |
| [`PageIndicator`](#pageindicator) | Tappable dots for a carousel/onboarding flow |
| [`SpeedDial`](#speeddial) | A floating action button that expands into several actions |
| [`Chip`](#chip) | A selectable and/or removable tag, standalone or in a filter row |
| [`ActionSheet`](#actionsheet) | A bottom menu of one-shot actions, with a dedicated Cancel |
| [`Drawer`](#drawer) | A panel that slides in from a screen edge, with swipe-to-dismiss |
| [`ScrollArea`](#scrollarea) | A scroll container with a draggable, fully custom-styled scrollbar |
| [`Skeleton`](#skeleton) | A pulsing loading placeholder |
| [`Carousel`](#carousel) | Swipe between full-bleed pages, with snap-to-page |
| [`Combobox`](#combobox) | A text input that filters and picks from a floating list of options |
| [`SortableList`](#sortablelist) | A list reorderable by long-press-and-drag |
| [`PullToRefresh`](#pulltorefresh) | Pull-down-to-refresh gesture over any scrollable content |
| [`SegmentedControl`](#segmentedcontrol) | A single-select row with a sliding indicator, drag-to-scrub across segments |
| [`DatePicker`](#datepicker) | A wheel-style day/month/year picker |
| [`PinchZoomView`](#pinchzoomview) | Pinch-to-zoom and pan, with double-tap to toggle |

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

If you just need one standalone pressed/not-pressed button — not a group —
that's `Toggle` (below), not `ToggleGroup`.

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

### Toggle

```tsx
import { Toggle } from 'anvil-native';
import { Text } from 'react-native';

function BoldButton({
  pressed,
  onPressedChange,
}: {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
}) {
  return (
    <Toggle.Root pressed={pressed} onPressedChange={onPressedChange}>
      {({ pressed: isPressed }) => (
        <Text style={{ fontWeight: 'bold', opacity: isPressed ? 1 : 0.5 }}>B</Text>
      )}
    </Toggle.Root>
  );
}
```

A single pressed/not-pressed button — the one-off counterpart to
`ToggleGroup` (which manages a *set* of options). `Toggle.Root` gets
`accessibilityRole="togglebutton"` with `accessibilityState.selected`
tracking `pressed` (React Native's `accessibilityState` has no dedicated
"pressed" field; `selected` is the closest native-role match, the same
choice other RN UI libraries make for this role).

Supports controlled (`pressed`/`onPressedChange`) and uncontrolled
(`defaultPressed`) usage, `disabled`, and an imperative ref (`ToggleHandle`
— `toggle`/`setPressed`/`getPressed`).

**Dev-mode checks.** Same controlled/uncontrolled warning (on `pressed`) as
`Checkbox`/`Switch`.

### VisuallyHidden

```tsx
import { VisuallyHidden } from 'anvil-native';
import { Pressable, Text } from 'react-native';

function CloseIconButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Text>✕</Text>
      <VisuallyHidden>
        <Text>Close</Text>
      </VisuallyHidden>
    </Pressable>
  );
}
```

Renders `children` off-screen and zero-size instead of not rendering them
at all — unlike conditionally omitting them, assistive technology still
reads them. The canonical use case: an icon-only button that needs a real
text label for screen reader users, without that label showing up next to
the icon visually.

### PinInput

```tsx
import { PinInput } from 'anvil-native';
import { Text, View } from 'react-native';

function VerificationCode({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <PinInput.Root
      value={value}
      onValueChange={onChange}
      length={6}
      accessibilityLabel="Verification code"
      style={{ flexDirection: 'row', gap: 8 }}
    >
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <PinInput.Slot key={index} index={index}>
          {({ char, active }) => (
            <View style={{ width: 40, height: 48, borderWidth: 1, borderColor: active ? 'black' : '#ccc' }}>
              <Text>{char ?? ''}</Text>
            </View>
          )}
        </PinInput.Slot>
      ))}
    </PinInput.Root>
  );
}
```

A verification-code input (SMS, 2FA) that looks like `length` separate
boxes but is actually backed by a single, real (visually hidden)
`TextInput` — the standard, robust way to build this: one focusable field
handles the keyboard, cursor, and paste/autofill correctly, while
`PinInput.Slot`s are purely decorative (hidden from accessibility; the
`TextInput` is what screen readers interact with, via the `accessibilityLabel`
you pass to `PinInput.Root`) and just render whichever character lands at
their `index`, plus whether they're `active` (the slot that would receive
the *next* typed character). Tapping a `Slot` focuses the real input.

The hidden `TextInput` sets `textContentType="oneTimeCode"` (iOS) and
`autoComplete="sms-otp"` (Android, when `type="numeric"`, the default) so
the OS's native "autofill code from SMS" suggestion works correctly — a
real, easy-to-get-wrong detail this primitive gets right for you.
`type="numeric"` (the default) also filters out non-digit input; pass
`type="text"` to allow anything. Input is always truncated to `length`.
`onComplete` fires once, exactly when the value transitions to `length`
characters — handy for auto-submitting.

Supports controlled (`value`/`onValueChange`) and uncontrolled
(`defaultValue`) usage, `disabled`, and an imperative ref (`PinInputHandle`
— `focus`/`blur`/`clear`/`getValue`/`setValue`).

**Dev-mode checks.** In development, warns if you switch between controlled
and uncontrolled usage, if `length` isn't greater than 0, if a `Slot`'s
`index` is out of range for `length`, or if two `Slot`s share the same
`index`.

### Tooltip

```tsx
import { Tooltip } from 'anvil-native';
import { Text } from 'react-native';

function InfoButton() {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger>
        <Text>ⓘ</Text>
      </Tooltip.Trigger>
      <Tooltip.Content>
        <Text style={{ color: 'white' }}>This field is required</Text>
      </Tooltip.Content>
    </Tooltip.Root>
  );
}
```

A floating hint anchored to its trigger, positioned with the same
flip-to-fit engine as `Popover`/`Menu`/`Select`. Since touch has no
"hover", `Tooltip.Trigger` opens on **long-press** (mirroring how Android's
own tooltips work — lifting the finger closes it again), and additionally
on **mouse hover** and **keyboard focus** for desktop/web, where those
interactions exist. Focus support matters even on a phone: it's how a
connected keyboard or a screen reader's exploration model reaches content
that a touch user would otherwise have to hold down to see.

`Tooltip.Content` is deliberately non-modal — no backdrop, no dismiss on
outside press — and defaults `pointerEvents="none"` so it never intercepts
touches meant for whatever's underneath it. String children are wrapped in
a `Text` for you (`<Tooltip.Content>Save changes</Tooltip.Content>` just
works); pass an explicit `Text` child yourself for full style control.

Supports controlled (`open`/`onOpenChange`) and uncontrolled (`defaultOpen`)
usage, `disabled`, `delayDuration` (hover-open delay in ms, default 700 —
long-press and focus always open immediately), and an imperative ref
(`TooltipHandle` — `open`/`close`/`isOpen`).

**Dev-mode checks.** Same controlled/uncontrolled warning as the other
overlay primitives.

### Avatar

```tsx
import { Avatar } from 'anvil-native';
import { StyleSheet, Text } from 'react-native';

function ProfilePicture({ uri, initials }: { uri: string; initials: string }) {
  return (
    <Avatar.Root style={{ width: 48, height: 48, borderRadius: 24, overflow: 'hidden' }}>
      <Avatar.Image source={{ uri }} />
      <Avatar.Fallback delayMs={300} style={{ ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' }}>
        <Text>{initials}</Text>
      </Avatar.Fallback>
    </Avatar.Root>
  );
}
```

A profile image that handles its own loading/error states. `Avatar.Image`
tracks a real Image's `onLoad`/`onError` and unmounts itself on error, so
`Avatar.Fallback` (initials, an icon, whatever you render) is only visible
while there's no successfully-loaded image to show — you never have to
wire that logic up by hand, and you never see a broken-image icon.

`Avatar.Fallback`'s optional `delayMs` holds off rendering the fallback for
that many milliseconds, so a fast-loading image never flashes the fallback
first. `Avatar.Image` re-attempts loading whenever its `source` prop
changes identity — pass a stable reference (e.g. via `useMemo`) if you
construct it inline, so you don't trigger reloads on every render.
`onLoadingStatusChange` reports the raw `'idle' | 'loading' | 'loaded' |
'error'` status if you need it for anything else.

### PasswordToggleField

```tsx
import { PasswordToggleField } from 'anvil-native';
import { Text, View } from 'react-native';

function PasswordInput() {
  return (
    <PasswordToggleField.Root>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <PasswordToggleField.Input style={{ flex: 1 }} placeholder="Password" />
        <PasswordToggleField.Toggle>
          <PasswordToggleField.Icon visible={<Text>🙈</Text>} hidden={<Text>👁️</Text>} />
        </PasswordToggleField.Toggle>
      </View>
    </PasswordToggleField.Root>
  );
}
```

A password field with a show/hide toggle. `PasswordToggleField.Input` is a
real `TextInput` with `secureTextEntry` wired to the field's `visible`
state for you — pass every other `TextInput` prop straight through (value,
onChangeText, autoComplete, whatever your form needs). `PasswordToggleField.Toggle`
flips it, and defaults its `accessibilityLabel` to "Show password"/"Hide
password" (override it if you localize). `PasswordToggleField.Icon` is a
small convenience for picking between a `visible`/`hidden` icon based on
the current state, so you don't have to read the context yourself.

Supports controlled (`visible`/`onVisibleChange`) and uncontrolled
(`defaultVisible`) usage, `disabled` (on `Root`, disabling the `Toggle`
while leaving the `Input` itself untouched), and an imperative ref
(`PasswordToggleFieldHandle` — `toggle`/`setVisible`/`getVisible`).

**Dev-mode checks.** Same controlled/uncontrolled warning (on `visible`) as
`Toggle`/`Checkbox`/`Switch`.

### Toolbar

```tsx
import { Toolbar } from 'anvil-native';
import { Text } from 'react-native';

function FormattingToolbar() {
  return (
    <Toolbar.Root style={{ flexDirection: 'row', gap: 8 }}>
      <Toolbar.Button onPress={() => {}}>
        <Text style={{ fontWeight: 'bold' }}>B</Text>
      </Toolbar.Button>
      <Toolbar.Button onPress={() => {}}>
        <Text style={{ fontStyle: 'italic' }}>I</Text>
      </Toolbar.Button>
    </Toolbar.Root>
  );
}
```

A row of related controls, grouped for assistive technology under
`accessibilityRole="toolbar"`. `Toolbar.Root`'s `disabled` disables every
`Toolbar.Button` inside it regardless of each button's own `disabled` —
the same "group disables its items" convention `RadioGroup`/`ToggleGroup`
use. Deliberately minimal: it doesn't reimplement toggling or grouping
logic, so drop `Toggle`, `ToggleGroup`, or a plain `Separator` inside it
for those cases instead of reaching for something toolbar-specific.

### BottomSheet

```tsx
import { BottomSheet } from 'anvil-native';
import { Text, View } from 'react-native';

function FilterSheet() {
  return (
    <BottomSheet.Root>
      <BottomSheet.Trigger>
        <Text>Filters</Text>
      </BottomSheet.Trigger>
      <BottomSheet.Content>
        <BottomSheet.Overlay style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} />
        <BottomSheet.Panel style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
          <BottomSheet.Handle style={{ alignItems: 'center', padding: 12 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#ccc' }} />
          </BottomSheet.Handle>
          <BottomSheet.Title>Filters</BottomSheet.Title>
          <BottomSheet.Close>
            <Text>Close</Text>
          </BottomSheet.Close>
        </BottomSheet.Panel>
      </BottomSheet.Content>
    </BottomSheet.Root>
  );
}
```

A panel that slides up from the bottom edge — the most native-feeling
modal pattern on both iOS and Android, and one Radix doesn't have (it's
not a web pattern). `BottomSheet.Content` renders a `Modal` with
`animationType="slide"`, so the initial open/close transition comes free
from the platform; `BottomSheet.Handle` layers a swipe-to-dismiss gesture
on top of that, exposing how far it's currently been dragged to
`BottomSheet.Panel` (which auto-applies a `translateY` from it, the same
"the primitive owns the interaction, you own the look" split `Slider.Thumb`
uses for its position). Dragging past `dismissThreshold` (default 120px)
and releasing closes the sheet; releasing before that snaps it back —
either way, a stationary finger never leaves the sheet stuck mid-drag,
since `Handle` refuses to let anything else steal the gesture once it
starts.

Dragging isn't independently reachable by assistive technology, so
`BottomSheet.Close` (or `BottomSheet.Overlay`'s tap-outside-to-close) is
the accessible dismiss path — the same relationship `Dialog.Close` has
with `Dialog.Overlay`. `BottomSheet.Title`/`BottomSheet.Description` wire
up the same accessibility linking as `Dialog`'s.

Supports controlled (`open`/`onOpenChange`) and uncontrolled
(`defaultOpen`) usage, `disabled`, `dismissThreshold`, and an imperative
ref (`BottomSheetHandle` — `open`/`close`/`toggle`/`isOpen`).

**Dev-mode checks.** Same controlled/uncontrolled warning as the other
overlay primitives.

### Stepper

```tsx
import { Stepper } from 'anvil-native';
import { Text } from 'react-native';

function QuantityPicker({
  quantity,
  onQuantityChange,
}: {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}) {
  return (
    <Stepper.Root
      value={quantity}
      onValueChange={onQuantityChange}
      min={1}
      max={10}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}
    >
      <Stepper.DecrementButton>
        <Text>−</Text>
      </Stepper.DecrementButton>
      <Stepper.Value />
      <Stepper.IncrementButton>
        <Text>+</Text>
      </Stepper.IncrementButton>
    </Stepper.Root>
  );
}
```

A +/- control for picking a number within `[min, max]` — a quantity
picker being the classic case. `Stepper.DecrementButton`/`IncrementButton`
disable themselves automatically at `min`/`max`, and `Stepper.Value`
renders the current number as text by default (pass a render function for
anything fancier). `Stepper.Root` itself also carries
`accessibilityRole="adjustable"` with increment/decrement accessibility
actions, the same double coverage (buttons *and* an adjustable container)
`Slider` gives screen reader users.

Supports controlled (`value`/`onValueChange`) and uncontrolled
(`defaultValue`) usage, `min`/`max`/`step`, `disabled`, and an imperative
ref (`StepperHandle` — `getValue`/`setValue`/`increment`/`decrement`).

**Dev-mode checks.** Same controlled/uncontrolled warning as
`Slider`/`Checkbox`/`Switch`, plus warnings when `min >= max` or `step`
isn't greater than 0.

### Rating

```tsx
import { Rating } from 'anvil-native';
import { Text } from 'react-native';

function StarRating({
  value,
  onValueChange,
}: {
  value: number;
  onValueChange: (value: number) => void;
}) {
  return (
    <Rating.Root
      value={value}
      onValueChange={onValueChange}
      max={5}
      style={{ flexDirection: 'row' }}
    >
      {[0, 1, 2, 3, 4].map((index) => (
        <Rating.Item key={index} index={index}>
          {({ filled }) => <Text>{filled ? '★' : '☆'}</Text>}
        </Rating.Item>
      ))}
    </Rating.Root>
  );
}
```

Tap any item to jump straight to that rating, or drag across the row to
adjust it continuously — both go through the same `PanResponder` on
`Rating.Root`, so a plain tap is just a drag that never moved. `max` items
are assumed to be equal width with no gaps between them (the common case);
`Rating.Item`'s `filled` render-prop state is `true` when `index < value`,
so you decide what "filled" looks like (a different icon, a color change,
whatever). Items are hidden from assistive technology, since `Root` itself
carries `accessibilityRole="adjustable"` with increment/decrement
accessibility actions — the same pattern `Stepper`/`Slider` use.

Supports controlled (`value`/`onValueChange`) and uncontrolled
(`defaultValue`) usage, `disabled`, and an imperative ref (`RatingHandle`
— `getValue`/`setValue`).

**Dev-mode checks.** Same controlled/uncontrolled warning as the other
value-holding primitives, plus a warning when `max` isn't greater than 0.

### SwipeableRow

```tsx
import { SwipeableRow } from 'anvil-native';
import { Text } from 'react-native';

function EmailRow() {
  return (
    <SwipeableRow.Root style={{ borderRadius: 12, overflow: 'hidden' }}>
      <SwipeableRow.RightActions style={{ width: 100, backgroundColor: 'crimson', alignItems: 'center', justifyContent: 'center' }}>
        <SwipeableRow.Close>
          <Text style={{ color: 'white' }}>Delete</Text>
        </SwipeableRow.Close>
      </SwipeableRow.RightActions>
      <SwipeableRow.Content style={{ backgroundColor: 'white', padding: 16 }}>
        <Text>Swipe me</Text>
      </SwipeableRow.Content>
    </SwipeableRow.Root>
  );
}
```

A list row that reveals action buttons when swiped horizontally — the
Mail/Gmail pattern. `SwipeableRow.Content` carries the drag gesture and
auto-applies a `translateX` from it (the same "primitive owns the
interaction, you own the look" split `Slider.Thumb`/`BottomSheet.Panel`
use); `LeftActions`/`RightActions` sit absolutely positioned behind it and
measure their own width, which is what the drag clamps against and what a
threshold-crossing release snaps open to. A fast enough flick opens or
closes regardless of how far it dragged. `SwipeableRow.Close` (put it on
an action, or anywhere else) snaps the row shut.

Content deliberately never claims the gesture on mere touch-down — only
once a horizontal-dominant drag is detected — so a row inside a
vertically-scrolling list doesn't fight that list's own scroll gesture.
Whichever side isn't currently revealed is hidden from assistive
technology (dragging isn't independently reachable by it), so give
important actions another path to the same effect if you need one.

Supports controlled (`openSide`/`onOpenSideChange`, one of
`'left' | 'right' | 'none'`) and uncontrolled (`defaultOpenSide`) usage,
`disabled`, and an imperative ref (`SwipeableRowHandle` —
`open`/`close`/`getOpenSide`).

**Dev-mode checks.** Same controlled/uncontrolled warning (on `openSide`)
as the other stateful primitives.

### Badge

```tsx
import { Badge } from 'anvil-native';
import { Text, View } from 'react-native';

function NotificationsIcon({ unreadCount }: { unreadCount: number }) {
  return (
    <View style={{ padding: 8 }}>
      <Text style={{ fontSize: 24 }}>🔔</Text>
      <Badge
        count={unreadCount}
        max={9}
        style={{ position: 'absolute', top: 2, right: 2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: 'crimson', alignItems: 'center', justifyContent: 'center' }}
      >
        {({ displayValue }) => (
          <Text style={{ color: 'white', fontSize: 11 }}>{displayValue}</Text>
        )}
      </Badge>
    </View>
  );
}
```

A single, non-compound component (like `VisuallyHidden`/`AspectRatio`) —
you position it yourself, typically `position: 'absolute'` in a corner of
a `position: 'relative'` anchor (React Native's default, so the wrapping
`View` above doesn't need anything extra). Counts past `max` (default 99)
render as `` `${max}+` ``; `count={0}` renders nothing unless `showZero`
is set; omit `count` entirely for a plain, unstyled "dot" — just give
`Badge` a size and background color via `style` and skip `children`.
Renders `count` as plain text by default, or pass a render function (as
above) for full control over how it looks.

Hidden from assistive technology by default, since it's typically layered
on an icon that already carries its own accessible label (e.g.
`accessibilityLabel="Notifications, 4 unread"` on the icon button) —
override `accessibilityElementsHidden`/`importantForAccessibility` if
your case is different.

### PageIndicator

```tsx
import { PageIndicator } from 'anvil-native';
import { View } from 'react-native';

function CarouselDots({
  page,
  onPageChange,
}: {
  page: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <PageIndicator.Root
      page={page}
      onPageChange={onPageChange}
      count={3}
      style={{ flexDirection: 'row', gap: 8 }}
    >
      {[0, 1, 2].map((index) => (
        <PageIndicator.Dot key={index} index={index}>
          {({ active }) => (
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: active ? 'black' : '#ccc' }} />
          )}
        </PageIndicator.Dot>
      ))}
    </PageIndicator.Root>
  );
}
```

The tappable dots for a carousel or onboarding flow — pair `page` with
whatever actually drives your carousel (a `ScrollView`'s `onMomentumScrollEnd`,
a `FlatList`'s `onViewableItemsChanged`, a plain "current slide" index).
`PageIndicator.Root` carries `accessibilityRole="pager"` with
increment/decrement accessibility actions, alongside the individually
tappable/accessible `Dot`s — the same double coverage `Stepper`/`Rating`
give screen reader users.

Supports controlled (`page`/`onPageChange`) and uncontrolled
(`defaultPage`) usage, `disabled`, and an imperative ref
(`PageIndicatorHandle` — `getPage`/`setPage`).

**Dev-mode checks.** Same controlled/uncontrolled warning as the other
value-holding primitives, plus a warning when `count` isn't greater than
0.

### SpeedDial

```tsx
import { SpeedDial } from 'anvil-native';
import { Text, View } from 'react-native';

function FabMenu() {
  return (
    <SpeedDial.Root>
      <View style={{ alignItems: 'flex-end', gap: 12 }}>
        <SpeedDial.Actions style={{ alignItems: 'flex-end', gap: 8 }}>
          <SpeedDial.Action onPress={() => {}}>
            <Text>Photo</Text>
          </SpeedDial.Action>
          <SpeedDial.Action onPress={() => {}}>
            <Text>Note</Text>
          </SpeedDial.Action>
        </SpeedDial.Actions>
        <SpeedDial.Trigger>
          {({ open }) => <Text>{open ? '×' : '+'}</Text>}
        </SpeedDial.Trigger>
      </View>
    </SpeedDial.Root>
  );
}
```

A floating action button that expands into several actions — the Android
Material "speed dial" pattern. `SpeedDial.Trigger` toggles `SpeedDial.Actions`
open/closed (not rendered at all while closed, unless you pass `forceMount`
to handle your own exit animation); `SpeedDial.Action` closes the dial
after firing its `onPress` by default (`closeOnPress={false}` to opt out).
Deliberately doesn't use a `Modal` — a FAB is normally already positioned
at a fixed spot in your screen, not relative to some inline trigger buried
in scrollable content, so it doesn't need one to escape clipping.

`SpeedDial.Backdrop` is an optional, purely decorative full-screen
`Pressable` (`onPress` closes the dial) for tap-outside-to-close — place
it as a sibling of `Trigger`/`Actions` inside your own screen-root `View`,
since without a `Modal` it can only cover whatever `position: 'relative'`
ancestor you give it.

Supports controlled (`open`/`onOpenChange`) and uncontrolled
(`defaultOpen`) usage, `disabled`, and an imperative ref (`SpeedDialHandle`
— `open`/`close`/`toggle`/`isOpen`).

**Dev-mode checks.** Same controlled/uncontrolled warning as the other
overlay primitives.

### Chip

```tsx
import { Chip } from 'anvil-native';
import { Text, View } from 'react-native';

function FilterChip({ label }: { label: string }) {
  return (
    <Chip.Root defaultSelected={false}>
      {({ selected }) => (
        <View style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: selected ? 'black' : 'white', borderWidth: 1, borderColor: '#ccc' }}>
          <Text style={{ color: selected ? 'white' : 'black' }}>{label}</Text>
        </View>
      )}
    </Chip.Root>
  );
}

function RemovableChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Chip.Root onRemove={onRemove} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text>{label}</Text>
      <Chip.RemoveButton>
        <Text>×</Text>
      </Chip.RemoveButton>
    </Chip.Root>
  );
}
```

A single, non-compound-ish primitive (`Root` plus one optional subpart)
covering two related but distinct chip behaviors. **Selection** is
opt-in: pass none of `selected`, `defaultSelected`, or `onSelectedChange`
for a plain, non-selectable tag whose press only runs your own `onPress`
— pass any of them (`defaultSelected={false}` counts too, since it's
about whether the prop was given, not its value) to make it a
toggleable chip, the same controlled/uncontrolled shape as `Toggle`. For
a row of mutually-exclusive or multi-select chips, just render several
`Chip.Root`s independently (each owns its own selected state) — reach
for `ToggleGroup` instead if you need one shared value across the row.

**Removal** is opt-in via `onRemove`: give it a function and nest
`Chip.RemoveButton` to get a dismiss control. On native, nested
`Pressable`s resolve to the innermost one touched, so `RemoveButton`'s
press never also toggles the outer chip's selection. On web, though, a
`Pressable` with an interactive `accessibilityRole` renders an HTML
`<button>`, and a `<button>` can't contain another `<button>` — so a
removable `Chip.Root` deliberately omits its own `button`/`togglebutton`
role (tap handling is unaffected either way; only the host element
choice changes).

**Dev-mode checks.** Same controlled/uncontrolled warning as the other
value-holding primitives.

### ActionSheet

```tsx
import { ActionSheet } from 'anvil-native';
import { Text, View } from 'react-native';

function PostOptions() {
  return (
    <ActionSheet.Root>
      <ActionSheet.Trigger>
        <Text>Options</Text>
      </ActionSheet.Trigger>
      <ActionSheet.Content>
        <ActionSheet.Overlay style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} />
        <View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
          <ActionSheet.Title>Options</ActionSheet.Title>
          <ActionSheet.Action onPress={() => {}}>
            <Text>Edit</Text>
          </ActionSheet.Action>
          <ActionSheet.Action onPress={() => {}}>
            <Text style={{ color: 'crimson' }}>Delete</Text>
          </ActionSheet.Action>
          <ActionSheet.Cancel>
            <Text>Cancel</Text>
          </ActionSheet.Cancel>
        </View>
      </ActionSheet.Content>
    </ActionSheet.Root>
  );
}
```

The native iOS/Android "action sheet" pattern: a bottom menu of one-shot
actions plus a dedicated way out. Structurally close to `BottomSheet`
(`Content` renders a `Modal` with `animationType="slide"`) but with menu
semantics instead of freeform drag-to-dismiss content — `Content` carries
`accessibilityRole="menu"`, `ActionSheet.Action` is `"menuitem"` and
closes the sheet after firing its `onPress` by default (`closeOnPress={false}`
to opt out, same as `SpeedDial.Action`), and `ActionSheet.Cancel` always
closes regardless of `closeOnPress`. No drag gesture at all — dismissal
is tap-driven only (an `Action`, `Cancel`, or `ActionSheet.Overlay`'s
tap-outside), which is also why there's no `Handle`/`Panel` pair here
the way `BottomSheet` has one.

Supports controlled (`open`/`onOpenChange`) and uncontrolled
(`defaultOpen`) usage, `disabled`, and an imperative ref
(`ActionSheetHandle` — `open`/`close`/`toggle`/`isOpen`).

**Dev-mode checks.** Same controlled/uncontrolled warning as the other
overlay primitives.

### Drawer

```tsx
import { Drawer } from 'anvil-native';
import { Text, View } from 'react-native';

function NavDrawer() {
  return (
    <Drawer.Root side="left">
      <Drawer.Trigger>
        <Text>☰ Menu</Text>
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Overlay style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} />
        <Drawer.Panel style={{ width: 260, height: '100%', backgroundColor: 'white' }}>
          <Drawer.Title>Menu</Drawer.Title>
          <Drawer.Close>
            <Text>Close</Text>
          </Drawer.Close>
        </Drawer.Panel>
      </Drawer.Content>
    </Drawer.Root>
  );
}
```

A panel that slides in from a screen edge (`side="left"`, the default,
or `"right"`) — the standard mobile navigation-menu pattern. `Drawer`
mirrors `BottomSheet` almost exactly (same `Modal`-with-slide-animation
`Content`, same swipe-to-dismiss `Handle`/`Panel` pair, same
`Title`/`Description` accessibility linking, same "stationary finger
never leaves it stuck mid-drag" `Handle` guarantee), just along the
horizontal axis instead of vertical: `Handle`'s drag distance is
measured toward whichever edge the `side` is opposite to, and `Panel`
auto-applies the matching `translateX`.

`side` is expected to stay constant for the component's lifetime (like
`ToggleGroup`'s `type`) — switching it mid-flight is a layout change,
not a state change.

Supports controlled (`open`/`onOpenChange`) and uncontrolled
(`defaultOpen`) usage, `disabled`, `side`, `dismissThreshold`, and an
imperative ref (`DrawerHandle` — `open`/`close`/`toggle`/`isOpen`).

**Dev-mode checks.** Same controlled/uncontrolled warning as the other
overlay primitives, plus a warning if `side` changes after the initial
render.

### ScrollArea

```tsx
import { ScrollArea } from 'anvil-native';
import { Text, View } from 'react-native';

function List({ items }: { items: string[] }) {
  return (
    <ScrollArea.Root style={{ height: 200, flexDirection: 'row' }}>
      <ScrollArea.Viewport style={{ flex: 1 }}>
        {items.map((item) => (
          <Text key={item} style={{ padding: 12 }}>{item}</Text>
        ))}
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar style={{ width: 6, backgroundColor: '#eee' }}>
        <ScrollArea.Thumb style={{ flex: 1 }}>
          {({ size, offset }) => (
            <View style={{ position: 'absolute', left: 0, right: 0, backgroundColor: '#999', height: `${size * 100}%`, top: `${offset * (1 - size) * 100}%` }} />
          )}
        </ScrollArea.Thumb>
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}
```

A scroll container with a fully custom-styled scrollbar — Radix's
`ScrollArea` parity, but for a mobile-first library the interesting part
isn't the visual chrome, it's that the thumb is draggable: on a long
list, dragging it is a genuinely faster way to scroll than flicking
repeatedly. `ScrollArea.Viewport` wraps a real `ScrollView` (native
momentum scrolling still works exactly as it always did) and measures
its own size, its content's size, and the current scroll offset;
`ScrollArea.Thumb`'s render-prop turns those into a `size`/`offset` pair
(both 0–1 fractions of the track) so you draw the actual pill however
you like, and dragging the `Thumb` itself calls back into the
`Viewport`'s scroll position, scaled so the thumb tracks your finger 1:1
regardless of how much shorter it is than the track (the same
finger-tracking math `Slider.Thumb` uses, just inverted — drag distance
in, scroll offset out, instead of the other way around).

`ScrollArea.Scrollbar` only renders once the content actually overflows
the viewport (pass `forceMount` to always render it), and — like `Badge`
and `SpeedDial.Backdrop` — is hidden from assistive technology by
default: it's a visual/pointer-only echo of the `Viewport`'s own native
scrollable region, which already carries its own accessibility handling.

`orientation` (`"vertical"`, the default, or `"horizontal"`) is expected
to stay constant for the component's lifetime, like `ToggleGroup`'s
`type`. Exposes an imperative ref (`ScrollAreaHandle` —
`scrollTo`/`getScrollOffset`).

**Dev-mode checks.** A warning if `orientation` changes after the
initial render.

### Skeleton

```tsx
import { Skeleton } from 'anvil-native';
import { View } from 'react-native';

function ProfileSkeleton() {
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Skeleton style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#ccc' }} />
      <View style={{ gap: 8, flex: 1 }}>
        <Skeleton style={{ height: 14, width: '80%', borderRadius: 4, backgroundColor: '#ccc' }} />
        <Skeleton style={{ height: 14, width: '50%', borderRadius: 4, backgroundColor: '#ccc' }} />
      </View>
    </View>
  );
}
```

A single, non-compound component (like `Badge`/`AspectRatio`) whose only
job is the loop: it pulses its own opacity between 0.3 and 1 on a
700ms cycle and leaves everything else -- size, shape, color -- to your
`style`, the same "primitive owns the interaction, you own the look"
split every other primitive here follows. Set `animate={false}` for a
static placeholder instead (e.g. if you're checking a reduced-motion
preference yourself). Hidden from assistive technology by default, like
`Badge` -- a pulsing gray box has nothing to announce.

### Carousel

```tsx
import { Carousel } from 'anvil-native';
import { View } from 'react-native';

function ImageCarousel({ page, onPageChange }: { page: number; onPageChange: (page: number) => void }) {
  return (
    <Carousel.Root page={page} onPageChange={onPageChange} count={3}>
      <Carousel.Viewport style={{ height: 200, overflow: 'hidden' }}>
        <Carousel.Track>
          {[0, 1, 2].map((index) => (
            <Carousel.Slide key={index} style={{ backgroundColor: '#eee' }} />
          ))}
        </Carousel.Track>
      </Carousel.Viewport>
    </Carousel.Root>
  );
}
```

Swipeable, full-bleed pages with snap-to-page -- pair it with
`PageIndicator` (sharing the same `page`/`onPageChange`) for dots
underneath, exactly like a photo gallery or onboarding flow.
`Carousel.Viewport` measures its own width and carries the same
double accessibility coverage `PageIndicator`/`Slider`/`Stepper` give:
`accessibilityRole="adjustable"` with increment/decrement actions,
alongside the swipe gesture. `Carousel.Track` never claims the touch
responder on mere touch-down and requires the drag to be more
horizontal than vertical before claiming it -- the same guard
`SwipeableRow` uses -- so a Carousel embedded in your app's main
vertically-scrolling screen doesn't break that screen's own scroll.
`Carousel.Slide` auto-sizes to the measured viewport width; you supply
its content and look.

Supports controlled (`page`/`onPageChange`) and uncontrolled
(`defaultPage`) usage, `disabled`, and an imperative ref
(`CarouselHandle` -- `getPage`/`setPage`/`next`/`previous`).

**Dev-mode checks.** Same controlled/uncontrolled warning as the other
value-holding primitives, plus a warning when `count` isn't greater
than 0.

### Combobox

```tsx
import { Combobox } from 'anvil-native';

function FruitCombobox({
  value, onValueChange, query, onQueryChange,
}: {
  value: string | null; onValueChange: (v: string | null) => void;
  query: string; onQueryChange: (q: string) => void;
}) {
  const options = ['Apple', 'Banana', 'Cherry'].filter((label) =>
    label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Combobox.Root value={value} onValueChange={onValueChange} query={query} onQueryChange={onQueryChange}>
      <Combobox.Input placeholder="Search fruit..." />
      <Combobox.Content>
        {options.map((label) => (
          <Combobox.Item key={label} value={label}>
            <Combobox.ItemText>{label}</Combobox.ItemText>
          </Combobox.Item>
        ))}
      </Combobox.Content>
    </Combobox.Root>
  );
}
```

`Select` with a text filter -- a `TextInput` (`Combobox.Input`) stands
in for `Select.Trigger`, opening `Combobox.Content` on focus instead of
on press, over the same floating-positioning (`computePosition`) and
`Modal` machinery `Select`/`Popover` share. Filtering itself is
deliberately not the primitive's job: you own `query`/`onQueryChange`,
so you filter your own option list before mapping it to
`Combobox.Item`s -- the primitive only tracks which value is selected
and what the input currently reads, the same split `ScrollArea` uses
for scroll math versus paint. Selecting an item (via
`Combobox.ItemText`'s registered label, same mechanism as
`Select.Value`) fills the input with that option's label and closes by
default (`closeOnSelect={false}` on `Combobox.Item` to opt out, same as
`Select.Item`).

On web, closing the popover's `Modal` returns focus to `Input` --
standard modal accessibility behavior -- which would otherwise
immediately re-fire `onFocus` and reopen what selecting an item just
closed. `Combobox` absorbs exactly that one spurious refocus internally,
so selection reliably closes the popover; this surfaced only in a real
browser; RNTL's `fireEvent.press` doesn't trigger it, which is exactly
why every primitive here gets a live Playwright pass before being
called done.

Supports controlled (`value`/`onValueChange`), (`query`/`onQueryChange`),
and (`open`/`onOpenChange`) usage independently, each with matching
uncontrolled defaults, `disabled`, and an imperative ref
(`ComboboxHandle` -- `open`/`close`/`toggle`/`isOpen`/`getValue`/`setValue`/`getQuery`/`setQuery`).

**Dev-mode checks.** Independent controlled/uncontrolled warnings for
`value`, `query`, and `open`.

### SortableList

```tsx
import { SortableList } from 'anvil-native';
import { Text, View } from 'react-native';

function Tasks({ order, onOrderChange }: { order: string[]; onOrderChange: (order: string[]) => void }) {
  return (
    <SortableList.Root order={order} onOrderChange={onOrderChange}>
      {order.map((task) => (
        <SortableList.Item key={task} itemKey={task} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text>{task}</Text>
          <SortableList.Handle>
            <Text>☰</Text>
          </SortableList.Handle>
        </SortableList.Item>
      ))}
    </SortableList.Root>
  );
}
```

Drag-and-drop reordering -- the pattern iOS/Android settings screens,
notes apps, and to-do lists all use. Following `BottomSheet`/`Drawer`'s
own split, a dedicated `SortableList.Handle` (not the whole
`SortableList.Item`) carries the drag gesture, so the rest of the row
stays free for its own taps or swipes. `Item` identifies itself via a
stable `itemKey` (not an index, which would shift under it as the list
reorders) and measures its own height on layout; dragging one item
computes, via math extracted to `internal/sortableListMath.ts` and
unit-tested directly, both where the drag currently resolves to
(crossing into a neighboring slot past the halfway point of that
neighbor's height) and how far every *other* item should shift to make
room -- all applied as plain `translateY`s, no ref to a list library.

Dragging isn't independently reachable by assistive technology, so
`Item` also carries `accessibilityActions` (increment/decrement) that
move it one position at a time -- the same double coverage
`PageIndicator`/`Carousel` give screen reader users for their own
gestures.

Supports controlled (`order`/`onOrderChange`) and uncontrolled
(`defaultOrder`) usage, `disabled`, and an imperative ref
(`SortableListHandle` -- `getOrder`/`setOrder`).

**Dev-mode checks.** Same controlled/uncontrolled warning as the other
value-holding primitives.

### PullToRefresh

```tsx
import { PullToRefresh } from 'anvil-native';
import { Text } from 'react-native';

function Feed({ items }: { items: string[] }) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLatest().finally(() => setRefreshing(false));
  };

  return (
    <PullToRefresh.Root refreshing={refreshing} onRefresh={handleRefresh}>
      <PullToRefresh.Indicator>
        {({ refreshing }) => <Text>{refreshing ? 'Refreshing…' : ''}</Text>}
      </PullToRefresh.Indicator>
      <PullToRefresh.Content>
        {items.map((item) => (
          <Text key={item}>{item}</Text>
        ))}
      </PullToRefresh.Content>
    </PullToRefresh.Root>
  );
}
```

The classic mobile "swipe down to refresh" gesture, built on
`PanResponder` like the rest of the library rather than the native
`RefreshControl` -- so it composes the same way every other primitive
here does (headless, styled entirely by you). `refreshing` has no
uncontrolled mode: unlike `open`/`page`/`value` elsewhere, it always
reflects a real in-flight async operation the consumer owns, so there's
no sensible internal default to fall back to.

`Content`'s drag only engages once you're scrolled to the top of
whatever you've wrapped -- pass your own `ScrollView`/`FlatList`'s live
`contentOffset.y` in as `scrollOffset` (it defaults to `0`, correct for
content that's always at the top). Past `threshold` px (default `80`),
releasing calls `onRefresh` and pins the indicator open at `threshold`
until you flip `refreshing` back to `false`; short of that, it eases
back to `0`. The pull distance itself gets a little resistance past the
threshold (`internal/pullToRefreshMath.ts`, unit-tested directly) so a
long pull keeps giving feedback without tracking the finger 1:1
forever.

A drag gesture has no assistive-technology equivalent, so `Root` also
carries an `activate` accessibility action (VoiceOver's "magic tap")
that calls `onRefresh` directly -- the same double coverage
`Slider`/`Carousel`/`Stepper` give their own gestures. `Indicator` uses
`accessibilityLiveRegion="polite"` while refreshing, since -- unlike
`Skeleton`/`Badge`'s decorative UI -- it's actually informative.

**Dev-mode checks.** Warns if `threshold` isn't greater than `0`.

### SegmentedControl

```tsx
import { SegmentedControl } from 'anvil-native';
import { Text } from 'react-native';

function Period({ value, onValueChange }: { value: string; onValueChange: (v: string) => void }) {
  return (
    <SegmentedControl.Root value={value} onValueChange={onValueChange}>
      <SegmentedControl.List style={{ flexDirection: 'row' }}>
        <SegmentedControl.Indicator style={{ backgroundColor: '#fff' }} />
        {['day', 'week', 'month'].map((option) => (
          <SegmentedControl.Item key={option} value={option} style={{ flex: 1 }}>
            {({ selected }) => <Text style={{ fontWeight: selected ? '700' : '400' }}>{option}</Text>}
          </SegmentedControl.Item>
        ))}
      </SegmentedControl.List>
    </SegmentedControl.Root>
  );
}
```

The iOS/Android segmented control: one selection among a few options,
with a sliding indicator that animates between them (`Animated.timing`
on `translateX`/`width` -- `width` can't run on the native thread, so
this one animation runs on JS, an acceptable cost for a small,
infrequent transition). Each `Item` reports its own `x`/`width` via
`onLayout`, and `Indicator` reads whichever entry belongs to the
current value.

Beyond tapping an `Item` directly, `List` also supports dragging a
finger across the row to scrub between segments -- resolved via pure
hit-testing (`internal/segmentedControlMath.ts`, unit-tested directly)
against each `Item`'s registered layout. Like `Carousel`/`SwipeableRow`,
`List` never claims the gesture on mere touch-down, so a quick tap
still reaches each `Item`'s own `Pressable` untouched; the gesture only
engages past a real horizontal drag. That gesture-catching layer is
kept as a separate inner `View` from `List`'s own accessibility props
(same split as `Carousel.Viewport`/`Track`) -- a `View` carrying
`PanResponder`'s should-set handlers reports "wouldn't claim the touch
right now" whenever the drag gate isn't met, which would otherwise also
suppress that same element's own unrelated `accessibilityAction`.

Supports controlled (`value`/`onValueChange`) and uncontrolled
(`defaultValue`) usage, `disabled` (on the group or per-`Item`), and an
imperative ref (`SegmentedControlHandle` -- `select`/`getValue`).
`List` also carries `accessibilityRole="radiogroup"` with
increment/decrement actions cycling through segments in registration
order, and each `Item` gets `accessibilityRole="radio"`.

**Dev-mode checks.** Same controlled/uncontrolled warning as the other
value-holding primitives.

### DatePicker

```tsx
import { DatePicker } from 'anvil-native';
import { Text } from 'react-native';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function BirthDate({ value, onValueChange }: { value: Date; onValueChange: (d: Date) => void }) {
  return (
    <DatePicker.Root value={value} onValueChange={onValueChange}>
      <View style={{ flexDirection: 'row' }}>
        <DatePicker.Column field="day" style={{ height: 120, overflow: 'hidden' }}>
          {(day, { selected }) => <Text style={{ opacity: selected ? 1 : 0.4 }}>{day}</Text>}
        </DatePicker.Column>
        <DatePicker.Column field="month" style={{ height: 120, overflow: 'hidden' }}>
          {(month, { selected }) => <Text style={{ opacity: selected ? 1 : 0.4 }}>{MONTHS[month]}</Text>}
        </DatePicker.Column>
        <DatePicker.Column field="year" style={{ height: 120, overflow: 'hidden' }}>
          {(year, { selected }) => <Text style={{ opacity: selected ? 1 : 0.4 }}>{year}</Text>}
        </DatePicker.Column>
      </View>
    </DatePicker.Root>
  );
}
```

A native-feeling wheel picker for a `Date`, split across up to three
independent `Column`s (`day`/`month`/`year` -- use just the ones you
need). `Root` derives each column's valid range itself: `day`'s list
shrinks to match the actual days in the current `month`/`year` (via
`internal/dateMath.ts`'s `daysInMonth`), and picking a day that no
longer exists after changing the month clamps down automatically (Jan
31st -> February clamps to the 28th/29th). `minimumDate`/`maximumDate`
bound the `year` list and clamp the committed date into range.

Each `Column` is its own vertical, snap-to-row gesture -- drag math
extracted to `internal/wheelPickerMath.ts` and unit-tested directly,
mirroring `carouselMath.ts`'s shape (index instead of page, row height
instead of viewport width, same velocity/distance-threshold release
rule). Tapping a nearby row also jumps straight to it. As with
`SegmentedControl.List`, the gesture-catching layer is a separate inner
`View` from the one carrying `accessibilityRole="adjustable"` and
increment/decrement actions, so an assistive-technology action is never
suppressed by the drag gesture's own claim state.

Supports controlled (`value`/`onValueChange`) and uncontrolled
(`defaultValue`, defaulting to "now") usage, `disabled`, and an
imperative ref (`DatePickerHandle` -- `getValue`/`setValue`).

**Dev-mode checks.** Same controlled/uncontrolled warning as the other
value-holding primitives, plus a warning if `minimumDate` is after
`maximumDate`.

### PinchZoomView

```tsx
import { PinchZoomView } from 'anvil-native';
import { Image } from 'react-native';

function Photo({ uri }: { uri: string }) {
  return (
    <PinchZoomView style={{ height: 300 }}>
      <Image source={{ uri }} style={{ flex: 1 }} resizeMode="contain" />
    </PinchZoomView>
  );
}
```

Two-finger pinch-to-zoom and pan, plus double-tap to jump to
`doubleTapScale` (default `2`) or back to `1`. The pinch/pan math
(distance between two touches, clamping the pan translation to the
overflow scaling creates) lives in `internal/pinchZoomMath.ts`,
unit-tested directly.

Unlike every other gesture primitive here, `PinchZoomView` claims the
responder from the very first touch rather than waiting for a
qualifying drag -- it's designed as a standalone gesture surface (a
full-screen image viewer, typically inside its own `Modal`), not one
meant to be nested under another `PanResponder`-claiming parent. That
immediate claim is also what makes a plain tap and a double-tap
reliably detectable, which a deferred claim (like `Carousel`/
`SwipeableRow` use) would miss.

A single component, not a compound one -- there's no separate part that
would benefit from being independently styled or swapped. Carries
`accessibilityRole="adjustable"` with increment/decrement actions that
step the scale by `0.5`, and exposes an imperative ref
(`PinchZoomViewHandle` -- `reset`/`getScale`).

**Dev-mode checks.** Warns if `minScale` isn't less than `maxScale`.

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
