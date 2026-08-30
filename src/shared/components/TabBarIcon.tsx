import { Text, type ColorValue } from 'react-native';
import { SymbolView, type SFSymbol } from 'expo-symbols';

// TODO: remplacer par @expo/vector-icons (Ionicons) quand la dépendance sera installée.
// expo-symbols est déjà présent (dépendance d'expo-router) : SF Symbols natifs sur iOS,
// glyphe texte en fallback sur Android/web.
const ICONS: Record<string, { sf: SFSymbol; glyph: string }> = {
  assistant: { sf: 'sparkles', glyph: '✦' },
  posts: { sf: 'list.bullet', glyph: '☰' },
  settings: { sf: 'gearshape.fill', glyph: '⚙' },
  discussions: { sf: 'text.bubble.fill', glyph: '◫' },
};

export type TabBarIconName = 'assistant' | 'posts' | 'settings' | 'discussions';

export interface TabBarIconProps {
  name: TabBarIconName;
  color: ColorValue;
  size?: number;
}

export function TabBarIcon({ name, color, size = 24 }: TabBarIconProps) {
  const icon = ICONS[name] ?? { sf: 'circle.fill' as SFSymbol, glyph: '●' };

  return (
    <SymbolView
      name={icon.sf}
      tintColor={color}
      size={size}
      fallback={
        <Text
          allowFontScaling={false}
          style={{ color, fontSize: size - 2, lineHeight: size, textAlign: 'center' }}
        >
          {icon.glyph}
        </Text>
      }
    />
  );
}
