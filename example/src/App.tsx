import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Accordion,
  AlertDialog,
  AspectRatio,
  Checkbox,
  Collapsible,
  ContextMenu,
  Dialog,
  Label,
  Menu,
  PinInput,
  Popover,
  Progress,
  RadioGroup,
  Select,
  Separator,
  Slider,
  Switch,
  Tabs,
  Toggle,
  ToggleGroup,
  Toast,
  VisuallyHidden,
  type CheckboxHandle,
  type ToastHandle,
} from 'anvil-native';

type Align = 'left' | 'center' | 'right';

const ALIGN_OPTIONS: { value: Align; label: string }[] = [
  { value: 'left', label: 'Izq' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Der' },
];

const FRUIT_OPTIONS = [
  { value: 'apple', label: 'Manzana' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cereza' },
  { value: 'grape', label: 'Uva' },
];

const FAQ_ITEMS = [
  {
    value: 'what',
    question: '¿Qué es Anvil?',
    answer:
      'Una librería de primitivos de UI accesibles y sin estilos para React Native: vos ponés el diseño, Anvil pone la lógica y la accesibilidad.',
  },
  {
    value: 'a11y',
    question: '¿Es accesible?',
    answer:
      'Sí — cada primitivo expone los accessibilityRole/accessibilityState correctos (por ejemplo "expanded" en este Accordion) sin que tengas que pensarlo.',
  },
  {
    value: 'style',
    question: '¿Cómo le pongo mi propio estilo?',
    answer:
      'Pasando tu propio `style`, o usando los children como función para leer el estado (expanded/disabled) y decidir vos qué renderizar.',
  },
];

const CHECKLIST_ITEMS = ['Manzana', 'Banana', 'Cereza'];

const SHIPPING_OPTIONS = [
  { value: 'standard', label: 'Estándar (5-7 días)' },
  { value: 'express', label: 'Express (2-3 días)' },
  { value: 'overnight', label: 'Overnight (24hs)' },
];

export default function App() {
  const [align, setAlign] = useState<Align>('left');
  const [fruit, setFruit] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const checkedCount = CHECKLIST_ITEMS.filter(
    (item) => checkedItems[item]
  ).length;
  const allChecked = checkedCount === CHECKLIST_ITEMS.length;
  const selectAllChecked =
    checkedCount === 0 ? false : allChecked ? true : 'indeterminate';
  const [notifications, setNotifications] = useState(true);
  const [shipping, setShipping] = useState('standard');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [volume, setVolume] = useState([40]);
  const [priceRange, setPriceRange] = useState([20, 70]);
  const termsCheckboxRef = useRef<CheckboxHandle>(null);
  const toastRef = useRef<ToastHandle>(null);
  const [bold, setBold] = useState(false);
  const [pin, setPin] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDownloadProgress((prev) => (prev >= 100 ? 0 : prev + 10));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <Toast.Provider>
      <View style={styles.appRoot}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Anvil — demo de Accordion</Text>

          <Accordion.Root type="single" style={styles.accordion}>
            {FAQ_ITEMS.map((item, index) => (
              <Accordion.Item
                key={item.value}
                value={item.value}
                style={[
                  styles.item,
                  index === FAQ_ITEMS.length - 1 && styles.lastItem,
                ]}
              >
                <Accordion.Trigger style={styles.trigger}>
                  {({ expanded }) => (
                    <View style={styles.triggerRow}>
                      <Text style={styles.question}>{item.question}</Text>
                      <Text style={styles.chevron}>{expanded ? '−' : '+'}</Text>
                    </View>
                  )}
                </Accordion.Trigger>
                <Accordion.Content>
                  <Text style={styles.answer}>{item.answer}</Text>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>

          <Text style={[styles.title, styles.sectionSpacing]}>
            Anvil — demo de Tabs
          </Text>

          <Tabs.Root defaultValue="profile">
            <Tabs.List style={styles.tabsList}>
              <Tabs.Trigger value="profile" style={styles.tabTriggerHitSlop}>
                {({ selected }) => (
                  <View
                    style={[styles.tabPill, selected && styles.tabPillActive]}
                  >
                    <Text
                      style={[
                        styles.tabLabel,
                        selected && styles.tabLabelActive,
                      ]}
                    >
                      Perfil
                    </Text>
                  </View>
                )}
              </Tabs.Trigger>
              <Tabs.Trigger value="settings" style={styles.tabTriggerHitSlop}>
                {({ selected }) => (
                  <View
                    style={[styles.tabPill, selected && styles.tabPillActive]}
                  >
                    <Text
                      style={[
                        styles.tabLabel,
                        selected && styles.tabLabelActive,
                      ]}
                    >
                      Ajustes
                    </Text>
                  </View>
                )}
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="profile" style={styles.tabContent}>
              <Text style={styles.tabContentText}>
                Acá iría el contenido de "Perfil".
              </Text>
            </Tabs.Content>
            <Tabs.Content value="settings" style={styles.tabContent}>
              <Text style={styles.tabContentText}>
                Acá iría el contenido de "Ajustes".
              </Text>
            </Tabs.Content>
          </Tabs.Root>

          <Text style={[styles.title, styles.sectionSpacing]}>
            Anvil — demo de ToggleGroup
          </Text>

          <ToggleGroup.Root
            type="single"
            value={align}
            onValueChange={(next) => {
              // Ignoramos el `null` (deselección) para forzar que siempre quede
              // una opción elegida — el primitivo lo permite, nosotros decidimos
              // no usarlo acá.
              if (next) setAlign(next as Align);
            }}
            style={styles.tabsList}
          >
            {ALIGN_OPTIONS.map((option) => (
              <ToggleGroup.Item
                key={option.value}
                value={option.value}
                style={styles.tabTriggerHitSlop}
              >
                {({ selected }) => (
                  <View
                    style={[styles.tabPill, selected && styles.tabPillActive]}
                  >
                    <Text
                      style={[
                        styles.tabLabel,
                        selected && styles.tabLabelActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </View>
                )}
              </ToggleGroup.Item>
            ))}
          </ToggleGroup.Root>

          <Text style={[styles.alignPreview, { textAlign: align }]}>
            Este texto cambia de alineación según la opción elegida arriba.
          </Text>

          <Text style={[styles.title, styles.sectionSpacing]}>
            Anvil — demo de Popover
          </Text>

          <View style={styles.popoverRow}>
            <Popover.Root>
              <Popover.Trigger style={styles.popoverTrigger}>
                <Text style={styles.popoverTriggerLabel}>?</Text>
              </Popover.Trigger>
              <Popover.Content
                side="bottom"
                align="start"
                style={styles.popoverContent}
              >
                {({ side }) => (
                  <>
                    <Text style={styles.popoverText}>
                      Se posicionó del lado "{side}" — si no entraba abajo,
                      Anvil lo da vuelta solo.
                    </Text>
                    <Popover.Close style={styles.popoverCloseButton}>
                      <Text style={styles.popoverCloseLabel}>Cerrar</Text>
                    </Popover.Close>
                  </>
                )}
              </Popover.Content>
            </Popover.Root>
          </View>

          <Text style={[styles.title, styles.sectionSpacing]}>
            Anvil — demo de Dialog
          </Text>

          <Dialog.Root>
            <Dialog.Trigger style={styles.dialogTriggerButton}>
              <Text style={styles.dialogTriggerLabel}>Eliminar item</Text>
            </Dialog.Trigger>
            <Dialog.Content>
              <Dialog.Overlay style={styles.dialogOverlay} />
              <View style={styles.dialogCenterWrapper} pointerEvents="box-none">
                <View style={styles.dialogPanel}>
                  <Dialog.Title style={styles.dialogTitle}>
                    ¿Eliminar este item?
                  </Dialog.Title>
                  <Dialog.Description style={styles.dialogDescription}>
                    Esta acción no se puede deshacer.
                  </Dialog.Description>
                  <View style={styles.dialogActions}>
                    <Dialog.Close style={styles.dialogCancelButton}>
                      <Text style={styles.dialogCancelLabel}>Cancelar</Text>
                    </Dialog.Close>
                    <Dialog.Close style={styles.dialogConfirmButton}>
                      <Text style={styles.dialogConfirmLabel}>Eliminar</Text>
                    </Dialog.Close>
                  </View>
                </View>
              </View>
            </Dialog.Content>
          </Dialog.Root>

          <Text style={[styles.title, styles.sectionSpacing]}>
            Anvil — demo de Menu
          </Text>

          <View style={styles.popoverRow}>
            <Menu.Root>
              <Menu.Trigger style={styles.popoverTrigger}>
                <Text style={styles.popoverTriggerLabel}>⋮</Text>
              </Menu.Trigger>
              <Menu.Content align="start" style={styles.menuContent}>
                <Menu.Label style={styles.menuLabel}>Acciones</Menu.Label>
                <Menu.Item style={styles.menuItem}>
                  <Text style={styles.menuItemLabel}>Editar</Text>
                </Menu.Item>
                <Menu.Item style={styles.menuItem}>
                  <Text style={styles.menuItemLabel}>Duplicar</Text>
                </Menu.Item>
                <Menu.Separator style={styles.menuSeparator} />
                <Menu.Item style={styles.menuItem}>
                  <Text style={styles.menuItemDanger}>Eliminar</Text>
                </Menu.Item>
              </Menu.Content>
            </Menu.Root>
          </View>

          <Text style={[styles.title, styles.sectionSpacing]}>
            Anvil — demo de Select
          </Text>

          <Select.Root value={fruit} onValueChange={setFruit}>
            <Select.Trigger style={styles.selectTrigger}>
              {({ open }) => (
                <>
                  <Select.Value
                    style={styles.selectTriggerLabel}
                    placeholder="Elegí una fruta"
                  />
                  <Text style={styles.chevron}>{open ? '▲' : '▼'}</Text>
                </>
              )}
            </Select.Trigger>
            <Select.Content align="start" style={styles.menuContent}>
              {FRUIT_OPTIONS.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  style={styles.menuItem}
                >
                  {({ selected }) => (
                    <View style={styles.selectItemRow}>
                      <Select.ItemText style={styles.menuItemLabel}>
                        {option.label}
                      </Select.ItemText>
                      {selected && <Text style={styles.selectCheck}>✓</Text>}
                    </View>
                  )}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>

          <Text style={[styles.title, styles.sectionSpacing]}>
            Anvil — demo de Checkbox
          </Text>

          <Checkbox.Root
            testID="select-all"
            checked={selectAllChecked}
            onCheckedChange={(next) => {
              const nextChecked: Record<string, boolean> = {};
              CHECKLIST_ITEMS.forEach((item) => {
                nextChecked[item] = next;
              });
              setCheckedItems(nextChecked);
            }}
            style={styles.checkboxRow}
          >
            {({ checked }) => (
              <>
                <View
                  style={[
                    styles.checkboxBox,
                    checked && styles.checkboxBoxChecked,
                  ]}
                >
                  <Checkbox.Indicator>
                    <Text style={styles.checkboxMark}>
                      {checked === 'indeterminate' ? '−' : '✓'}
                    </Text>
                  </Checkbox.Indicator>
                </View>
                <Text style={styles.checkboxLabel}>
                  Seleccionar todas ({checkedCount}/{CHECKLIST_ITEMS.length})
                </Text>
              </>
            )}
          </Checkbox.Root>

          <View style={styles.checkboxList}>
            {CHECKLIST_ITEMS.map((item) => (
              <Checkbox.Root
                key={item}
                checked={checkedItems[item] ?? false}
                onCheckedChange={(next) =>
                  setCheckedItems((prev) => ({ ...prev, [item]: next }))
                }
                style={styles.checkboxRow}
              >
                {({ checked }) => (
                  <>
                    <View
                      style={[
                        styles.checkboxBox,
                        checked && styles.checkboxBoxChecked,
                      ]}
                    >
                      <Checkbox.Indicator>
                        <Text style={styles.checkboxMark}>✓</Text>
                      </Checkbox.Indicator>
                    </View>
                    <Text style={styles.checkboxLabel}>{item}</Text>
                  </>
                )}
              </Checkbox.Root>
            ))}
          </View>

          <Text style={[styles.title, styles.sectionSpacing]}>
            Anvil — demo de Switch
          </Text>

          <Switch.Root
            checked={notifications}
            onCheckedChange={setNotifications}
            style={styles.switchRow}
          >
            {({ checked }) => (
              <>
                <Text style={styles.switchLabel}>Notificaciones</Text>
                <View
                  style={[styles.switchTrack, checked && styles.switchTrackOn]}
                >
                  <Switch.Thumb
                    style={[
                      styles.switchThumb,
                      checked && styles.switchThumbOn,
                    ]}
                  />
                </View>
              </>
            )}
          </Switch.Root>

          <Text style={[styles.title, styles.sectionSpacing]}>
            Anvil — demo de RadioGroup
          </Text>

          <RadioGroup.Root
            value={shipping}
            onValueChange={(next) => next && setShipping(next)}
            style={styles.radioGroup}
          >
            {SHIPPING_OPTIONS.map((option) => (
              <RadioGroup.Item
                key={option.value}
                value={option.value}
                style={styles.checkboxRow}
              >
                {({ selected }) => (
                  <>
                    <View style={styles.radioOuter}>
                      <RadioGroup.Indicator>
                        <View style={styles.radioInner} />
                      </RadioGroup.Indicator>
                    </View>
                    <Text
                      style={[
                        styles.checkboxLabel,
                        selected && styles.radioLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </>
                )}
              </RadioGroup.Item>
            ))}
          </RadioGroup.Root>

          <Text style={[styles.title, styles.sectionSpacing]}>
            Anvil — demo de AlertDialog
          </Text>

          <AlertDialog.Root>
            <AlertDialog.Trigger style={styles.dialogTriggerButton}>
              <Text style={styles.dialogTriggerLabel}>Eliminar cuenta</Text>
            </AlertDialog.Trigger>
            <AlertDialog.Content>
              <AlertDialog.Overlay style={styles.dialogOverlay} />
              <View style={styles.dialogCenterWrapper} pointerEvents="box-none">
                <View style={styles.dialogPanel}>
                  <AlertDialog.Title style={styles.dialogTitle}>
                    ¿Eliminar tu cuenta?
                  </AlertDialog.Title>
                  <AlertDialog.Description style={styles.dialogDescription}>
                    Esta acción es permanente. A diferencia del Dialog de
                    arriba, tocar afuera o el botón atrás de Android no la
                    cierra — solo Cancelar o Eliminar.
                  </AlertDialog.Description>
                  <View style={styles.dialogActions}>
                    <AlertDialog.Cancel style={styles.dialogCancelButton}>
                      <Text style={styles.dialogCancelLabel}>Cancelar</Text>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action style={styles.dialogConfirmButton}>
                      <Text style={styles.dialogConfirmLabel}>Eliminar</Text>
                    </AlertDialog.Action>
                  </View>
                </View>
              </View>
            </AlertDialog.Content>
          </AlertDialog.Root>

          <Text style={[styles.title, styles.sectionSpacing]}>
            Anvil — demo de Progress
          </Text>

          <Text style={styles.progressLabel}>
            Descargando... {downloadProgress}%
          </Text>
          <Progress.Root value={downloadProgress} style={styles.progressTrack}>
            <Progress.Indicator style={styles.progressFillWrapper}>
              {({ percentage }) => (
                <View
                  style={[styles.progressFill, { width: `${percentage}%` }]}
                />
              )}
            </Progress.Indicator>
          </Progress.Root>

          <Text style={[styles.progressLabel, styles.sectionSpacing]}>
            Sincronizando (indeterminado)
          </Text>
          <Progress.Root value={null} style={styles.progressTrack}>
            <Progress.Indicator style={styles.progressIndeterminateFill} />
          </Progress.Root>

          <Text style={[styles.title, styles.sectionSpacing]}>
            Anvil — demo de Slider
          </Text>

          <Text style={styles.progressLabel}>Volumen: {volume[0]}</Text>
          <Slider.Root
            value={volume}
            onValueChange={setVolume}
            style={styles.sliderRoot}
          >
            <Slider.Track style={styles.sliderTrack}>
              <Slider.Range style={styles.sliderRange} />
              <Slider.Thumb style={styles.sliderThumb} />
            </Slider.Track>
          </Slider.Root>

          <Text style={[styles.progressLabel, styles.sectionSpacing]}>
            Precio: ${priceRange[0]} - ${priceRange[1]}
          </Text>
          <Slider.Root
            value={priceRange}
            onValueChange={setPriceRange}
            min={0}
            max={100}
            style={styles.sliderRoot}
          >
            <Slider.Track style={styles.sliderTrack}>
              <Slider.Range style={styles.sliderRange} />
              <Slider.Thumb index={0} style={styles.sliderThumb} />
              <Slider.Thumb index={1} style={styles.sliderThumb} />
            </Slider.Track>
          </Slider.Root>

          <Text style={[styles.title, styles.sectionSpacing]}>
            Anvil — demo de Separator y Collapsible
          </Text>

          <Text style={styles.checkboxLabel}>Sección uno</Text>
          <Separator style={styles.separator} />

          <Collapsible.Root style={styles.collapsibleRoot}>
            <Collapsible.Trigger style={styles.dialogCancelButton}>
              {({ open }) => (
                <Text style={styles.selectTriggerLabel}>
                  {open ? 'Ocultar detalles ▲' : 'Mostrar detalles ▼'}
                </Text>
              )}
            </Collapsible.Trigger>
            <Collapsible.Content>
              <Text style={styles.answer}>
                Este panel es un Collapsible independiente — no forma parte de
                ningún Accordion, útil para un solo "mostrar más" suelto.
              </Text>
            </Collapsible.Content>
          </Collapsible.Root>

          <Text style={[styles.title, styles.sectionSpacing]}>
            Anvil — demo de AspectRatio
          </Text>

          <AspectRatio ratio={16 / 9} style={styles.aspectRatioBox}>
            <Text style={styles.aspectRatioLabel}>16:9</Text>
          </AspectRatio>

          <Text style={[styles.title, styles.sectionSpacing]}>
            Anvil — demo de Label
          </Text>

          <Checkbox.Root
            ref={termsCheckboxRef}
            testID="terms-checkbox"
            style={styles.checkboxRow}
          >
            {({ checked }) => (
              <>
                <View
                  style={[
                    styles.checkboxBox,
                    checked && styles.checkboxBoxChecked,
                  ]}
                >
                  <Checkbox.Indicator>
                    <Text style={styles.checkboxMark}>✓</Text>
                  </Checkbox.Indicator>
                </View>
              </>
            )}
          </Checkbox.Root>
          <Label
            style={styles.checkboxLabel}
            onPress={() => termsCheckboxRef.current?.toggle()}
          >
            Acepto los términos y condiciones
          </Label>

          <Text style={[styles.title, styles.sectionSpacing]}>
            Anvil — demo de ContextMenu
          </Text>

          <ContextMenu.Root>
            <ContextMenu.Trigger style={styles.contextMenuCard}>
              <Text style={styles.checkboxLabel}>
                Mantené presionado esta tarjeta
              </Text>
            </ContextMenu.Trigger>
            <ContextMenu.Content align="start" style={styles.menuContent}>
              <ContextMenu.Label style={styles.menuLabel}>
                Acciones
              </ContextMenu.Label>
              <ContextMenu.Item style={styles.menuItem}>
                <Text style={styles.menuItemLabel}>Editar</Text>
              </ContextMenu.Item>
              <ContextMenu.Item style={styles.menuItem}>
                <Text style={styles.menuItemLabel}>Duplicar</Text>
              </ContextMenu.Item>
              <ContextMenu.Separator style={styles.menuSeparator} />
              <ContextMenu.Item style={styles.menuItem}>
                <Text style={styles.menuItemDanger}>Eliminar</Text>
              </ContextMenu.Item>
            </ContextMenu.Content>
          </ContextMenu.Root>

          <Text style={[styles.title, styles.sectionSpacing]}>
            Anvil — demo de Toggle
          </Text>

          <Toggle.Root
            pressed={bold}
            onPressedChange={setBold}
            style={styles.toggleButton}
          >
            {({ pressed }) => (
              <View
                style={[
                  styles.toggleInner,
                  pressed && styles.toggleInnerActive,
                ]}
              >
                <Text
                  style={[
                    styles.toggleLabel,
                    pressed && styles.toggleLabelActive,
                  ]}
                >
                  B
                </Text>
              </View>
            )}
          </Toggle.Root>

          <Text style={[styles.title, styles.sectionSpacing]}>
            Anvil — demo de VisuallyHidden
          </Text>

          <View style={styles.contextMenuCard}>
            <Text
              style={styles.checkboxLabel}
              accessibilityRole="button"
              onPress={() => {}}
            >
              ♥
            </Text>
            <VisuallyHidden>
              <Text>Agregar a favoritos</Text>
            </VisuallyHidden>
          </View>

          <Text style={[styles.title, styles.sectionSpacing]}>
            Anvil — demo de PinInput
          </Text>

          <Text style={styles.checkboxLabel}>Código: {pin || '(vacío)'}</Text>
          <PinInput.Root
            value={pin}
            onValueChange={setPin}
            length={4}
            accessibilityLabel="Código de verificación"
            style={styles.pinInputRow}
          >
            {[0, 1, 2, 3].map((index) => (
              <PinInput.Slot key={index} index={index}>
                {({ char, active }) => (
                  <View
                    style={[styles.pinSlot, active && styles.pinSlotActive]}
                  >
                    <Text style={styles.pinSlotText}>{char ?? ''}</Text>
                  </View>
                )}
              </PinInput.Slot>
            ))}
          </PinInput.Root>

          <Text style={[styles.title, styles.sectionSpacing]}>
            Anvil — demo de Toast
          </Text>

          <View style={styles.dialogTriggerButton}>
            <Text
              style={styles.dialogTriggerLabel}
              onPress={() => toastRef.current?.open()}
            >
              Mostrar toast
            </Text>
          </View>
        </ScrollView>

        <Toast.Viewport style={styles.toastViewport} pointerEvents="box-none">
          <Toast.Root ref={toastRef} duration={3000} style={styles.toastRoot}>
            <Toast.Title style={styles.toastTitle}>Guardado</Toast.Title>
            <Toast.Description style={styles.toastDescription}>
              Tus cambios se guardaron correctamente.
            </Toast.Description>
          </Toast.Root>
        </Toast.Viewport>
      </View>
    </Toast.Provider>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
  },
  container: {
    padding: 24,
    paddingTop: 64,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionSpacing: {
    marginTop: 40,
  },
  accordion: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 12,
    overflow: 'hidden',
  },
  item: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  trigger: {
    padding: 16,
  },
  triggerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  question: {
    fontSize: 16,
    fontWeight: '500',
    flexShrink: 1,
    paddingRight: 12,
  },
  chevron: {
    fontSize: 18,
    color: '#666',
  },
  answer: {
    padding: 16,
    paddingTop: 0,
    color: '#444',
    lineHeight: 20,
  },
  tabsList: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabTriggerHitSlop: {
    borderRadius: 999,
  },
  tabPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#eee',
  },
  tabPillActive: {
    backgroundColor: '#111',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
  },
  tabLabelActive: {
    color: '#fff',
  },
  tabContent: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 16,
  },
  tabContentText: {
    color: '#444',
    lineHeight: 20,
  },
  alignPreview: {
    marginTop: 16,
    color: '#444',
    lineHeight: 20,
  },
  popoverRow: {
    flexDirection: 'row',
  },
  popoverTrigger: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popoverTriggerLabel: {
    color: '#fff',
    fontWeight: '700',
  },
  popoverContent: {
    width: 220,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  popoverText: {
    color: '#444',
    lineHeight: 20,
  },
  popoverCloseButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  popoverCloseLabel: {
    color: '#111',
    fontWeight: '600',
  },
  dialogTriggerButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#b91c1c',
  },
  dialogTriggerLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  dialogOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  dialogCenterWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogPanel: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#fff',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  dialogDescription: {
    color: '#444',
    lineHeight: 20,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  dialogCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dialogCancelLabel: {
    color: '#444',
    fontWeight: '600',
  },
  dialogConfirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#b91c1c',
  },
  dialogConfirmLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  menuContent: {
    minWidth: 180,
    borderRadius: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  menuLabel: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  menuItemLabel: {
    color: '#111',
    fontSize: 15,
  },
  menuItemDanger: {
    color: '#b91c1c',
    fontSize: 15,
  },
  menuSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ccc',
    marginVertical: 4,
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'flex-start',
    minWidth: 200,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    gap: 12,
  },
  selectTriggerLabel: {
    color: '#111',
    fontSize: 15,
  },
  selectItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectCheck: {
    color: '#111',
    fontWeight: '700',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  checkboxList: {
    marginLeft: 16,
    marginTop: 4,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#999',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  checkboxMark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#111',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 260,
  },
  switchLabel: {
    fontSize: 15,
    color: '#111',
  },
  switchTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ccc',
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackOn: {
    backgroundColor: '#111',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  switchThumbOn: {
    alignSelf: 'flex-end',
  },
  radioGroup: {
    marginTop: 4,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#999',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#111',
  },
  radioLabelSelected: {
    fontWeight: '600',
  },
  progressLabel: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#eee',
    overflow: 'hidden',
  },
  progressFillWrapper: {
    flex: 1,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#111',
    borderRadius: 4,
  },
  progressIndeterminateFill: {
    width: '40%',
    height: '100%',
    backgroundColor: '#111',
    borderRadius: 4,
  },
  sliderRoot: {
    paddingVertical: 12,
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#eee',
  },
  sliderRange: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#111',
  },
  sliderThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#111',
    marginTop: -9,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ccc',
    marginVertical: 12,
  },
  collapsibleRoot: {
    alignItems: 'flex-start',
  },
  aspectRatioBox: {
    width: '100%',
    backgroundColor: '#eee',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aspectRatioLabel: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  contextMenuCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    backgroundColor: '#fafafa',
  },
  toastViewport: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 56,
    paddingHorizontal: 24,
  },
  toastRoot: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#111',
  },
  toastTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  toastDescription: {
    color: '#ddd',
    marginTop: 4,
  },
  toggleButton: {
    alignSelf: 'flex-start',
  },
  toggleInner: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleInnerActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  toggleLabelActive: {
    color: '#fff',
  },
  pinInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pinSlot: {
    width: 44,
    height: 52,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinSlotActive: {
    borderColor: '#111',
  },
  pinSlotText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
});
