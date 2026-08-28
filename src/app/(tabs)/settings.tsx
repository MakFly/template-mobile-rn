import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme, type ThemePreference } from '@/core/theme';
import {
  useSettingsStore,
  type LayoutMode,
  type LocalePreference,
} from '@/features/settings/store';
import { Card } from '@/shared/components/Card';
import { Screen } from '@/shared/components/Screen';
import { Text } from '@/shared/components/Text';
import { useContentBottomInset } from '@/shared/navigation/ContentBottomInset';

const THEME_OPTIONS: ThemePreference[] = ['system', 'light', 'dark'];
const LOCALE_OPTIONS: LocalePreference[] = ['system', 'en', 'fr'];
const LAYOUT_OPTIONS: LayoutMode[] = ['tabs', 'island', 'sidebar', 'assistant'];

interface ChoiceChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function ChoiceChip({ label, selected, onPress }: ChoiceChipProps) {
  const { colors, spacing, radii } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      style={({ pressed }) => ({
        minHeight: 44, // comfortable touch target
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
        // shadcn buttons are rounded-md, never pills.
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected
          ? pressed
            ? colors.primaryPressed
            : colors.primary
          : pressed
            ? colors.surfaceAlt
            : 'transparent',
      })}
    >
      <Text variant="label" tone={selected ? 'onPrimary' : 'default'}>
        {label}
      </Text>
    </Pressable>
  );
}

interface ChoiceGroupProps<Option extends string> {
  options: readonly Option[];
  value: Option;
  labelFor: (option: Option) => string;
  onChange: (option: Option) => void;
}

function ChoiceGroup<Option extends string>({
  options,
  value,
  labelFor,
  onChange,
}: ChoiceGroupProps<Option>) {
  const { spacing } = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}
    >
      {options.map((option) => (
        <ChoiceChip
          key={option}
          label={labelFor(option)}
          selected={option === value}
          onPress={() => onChange(option)}
        />
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const { spacing } = useTheme();
  const { t } = useTranslation();
  const themePreference = useSettingsStore((state) => state.themePreference);
  const locale = useSettingsStore((state) => state.locale);
  const layoutMode = useSettingsStore((state) => state.layoutMode);
  const setThemePreference = useSettingsStore((state) => state.setThemePreference);
  const setLocale = useSettingsStore((state) => state.setLocale);
  const setLayoutMode = useSettingsStore((state) => state.setLayoutMode);
  const bottomInset = useContentBottomInset();

  return (
    <Screen padded={false}>
      {/* Scrollable: with large Dynamic Type the last group would otherwise
          end up under the floating pill, out of reach. */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xl + bottomInset,
          gap: spacing.lg,
        }}
      >
        <Text variant="display" style={{ marginBottom: spacing.sm }}>
          {t('settings.title')}
        </Text>
        <Card style={{ gap: spacing.md }}>
          <View style={{ gap: spacing.xs }}>
            <Text variant="label">{t('settings.appearance')}</Text>
            <Text variant="caption" tone="muted">
              {t('settings.appearanceHint')}
            </Text>
          </View>
          <ChoiceGroup
            options={THEME_OPTIONS}
            value={themePreference}
            labelFor={(option) => t(`settings.theme.${option}`)}
            onChange={setThemePreference}
          />
        </Card>
        <Card style={{ gap: spacing.md }}>
          <View style={{ gap: spacing.xs }}>
            <Text variant="label">{t('settings.language')}</Text>
            <Text variant="caption" tone="muted">
              {t('settings.languageHint')}
            </Text>
          </View>
          <ChoiceGroup
            options={LOCALE_OPTIONS}
            value={locale}
            labelFor={(option) => t(`settings.locale.${option}`)}
            onChange={setLocale}
          />
        </Card>
        <Card style={{ gap: spacing.md }}>
          <View style={{ gap: spacing.xs }}>
            <Text variant="label">{t('settings.layout.label')}</Text>
            <Text variant="caption" tone="muted">
              {t('settings.layout.hint')}
            </Text>
          </View>
          <ChoiceGroup
            options={LAYOUT_OPTIONS}
            value={layoutMode}
            labelFor={(option) => t(`settings.layout.${option}`)}
            onChange={setLayoutMode}
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}
