import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Accordion,
  Dialog,
  Menu,
  Popover,
  Tabs,
  ToggleGroup,
} from 'anvil-native';

type Align = 'left' | 'center' | 'right';

const ALIGN_OPTIONS: { value: Align; label: string }[] = [
  { value: 'left', label: 'Izq' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Der' },
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

export default function App() {
  const [align, setAlign] = useState<Align>('left');

  return (
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
              <View style={[styles.tabPill, selected && styles.tabPillActive]}>
                <Text
                  style={[styles.tabLabel, selected && styles.tabLabelActive]}
                >
                  Perfil
                </Text>
              </View>
            )}
          </Tabs.Trigger>
          <Tabs.Trigger value="settings" style={styles.tabTriggerHitSlop}>
            {({ selected }) => (
              <View style={[styles.tabPill, selected && styles.tabPillActive]}>
                <Text
                  style={[styles.tabLabel, selected && styles.tabLabelActive]}
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
              <View style={[styles.tabPill, selected && styles.tabPillActive]}>
                <Text
                  style={[styles.tabLabel, selected && styles.tabLabelActive]}
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
                  Se posicionó del lado "{side}" — si no entraba abajo, Anvil lo
                  da vuelta solo.
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
});
