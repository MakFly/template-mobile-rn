import type { ComponentProps } from 'react';
import { Platform, type ColorValue } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolView, type SFSymbol } from 'expo-symbols';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/**
 * SF Symbols on iOS, Material Icons everywhere else — the same split as the
 * official assistant-ui expo example (`components/ui/icon-mappings.ts`).
 * Material replaces the old text-glyph fallback, whose thin line weight
 * looked nothing like the reference icons on web/Android.
 */
const ICONS = {
  compose: { sf: 'square.and.pencil', material: 'edit' },
  add: { sf: 'plus', material: 'add' },
  remove: { sf: 'xmark', material: 'close' },
  send: { sf: 'arrow.up', material: 'arrow-upward' },
  stop: { sf: 'stop.fill', material: 'stop' },
  reload: { sf: 'arrow.clockwise', material: 'refresh' },
  copy: { sf: 'doc.on.doc', material: 'content-copy' },
  check: { sf: 'checkmark', material: 'check' },
  chevronLeft: { sf: 'chevron.left', material: 'chevron-left' },
  chevronRight: { sf: 'chevron.right', material: 'chevron-right' },
  chevronDown: { sf: 'chevron.down', material: 'keyboard-arrow-down' },
  rename: { sf: 'pencil', material: 'edit' },
  archive: { sf: 'archivebox', material: 'archive' },
  unarchive: { sf: 'tray.and.arrow.up', material: 'unarchive' },
  trash: { sf: 'trash', material: 'delete-outline' },
} satisfies Record<string, { sf: SFSymbol; material: MaterialIconName }>;

export type AssistantIconName = keyof typeof ICONS;

interface AssistantIconProps {
  name: AssistantIconName;
  color: ColorValue;
  size?: number;
}

export function AssistantIcon({ name, color, size = 20 }: AssistantIconProps) {
  const icon = ICONS[name];

  if (Platform.OS !== 'ios') {
    return <MaterialIcons name={icon.material} size={size} color={color} />;
  }

  return (
    <SymbolView
      name={icon.sf}
      tintColor={color}
      size={size}
      fallback={<MaterialIcons name={icon.material} size={size} color={color} />}
    />
  );
}
