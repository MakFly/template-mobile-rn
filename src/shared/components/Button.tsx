import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/core/theme';
import { Text } from '@/shared/components/Text';

export type ButtonVariant = 'primary' | 'secondary';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: ButtonProps) {
  const { colors, spacing, radii } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      hitSlop={spacing.xs}
      style={({ pressed }) => [
        {
          minHeight: 48, // comfortable touch target (>= 44pt)
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
          borderRadius: radii.md,
        },
        variant === 'primary' && {
          backgroundColor: pressed ? colors.primaryPressed : colors.primary,
        },
        variant === 'secondary' && {
          backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
        },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      <Text variant="label" tone={variant === 'primary' ? 'onPrimary' : 'default'}>
        {label}
      </Text>
    </Pressable>
  );
}
