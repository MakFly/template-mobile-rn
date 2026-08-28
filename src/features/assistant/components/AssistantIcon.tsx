import { Text, type ColorValue } from 'react-native';
import { SymbolView, type SFSymbol } from 'expo-symbols';

const ICONS = {
  compose: { sf: 'square.and.pencil', glyph: '＋' },
  add: { sf: 'plus', glyph: '＋' },
  remove: { sf: 'xmark', glyph: '×' },
  send: { sf: 'arrow.up', glyph: '↑' },
  stop: { sf: 'stop.fill', glyph: '■' },
  reload: { sf: 'arrow.clockwise', glyph: '↻' },
  chevronRight: { sf: 'chevron.right', glyph: '›' },
} satisfies Record<string, { sf: SFSymbol; glyph: string }>;

export type AssistantIconName = keyof typeof ICONS;

interface AssistantIconProps {
  name: AssistantIconName;
  color: ColorValue;
  size?: number;
}

export function AssistantIcon({ name, color, size = 20 }: AssistantIconProps) {
  const icon = ICONS[name];

  return (
    <SymbolView
      name={icon.sf}
      tintColor={color}
      size={size}
      fallback={
        <Text
          allowFontScaling={false}
          style={{ color, fontSize: size, lineHeight: size + 2, textAlign: 'center' }}
        >
          {icon.glyph}
        </Text>
      }
    />
  );
}
