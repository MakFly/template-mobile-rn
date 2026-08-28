import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/core/theme';

export type TextVariant = 'display' | 'title' | 'subtitle' | 'body' | 'label' | 'caption';

export type TextTone = 'default' | 'muted' | 'primary' | 'onPrimary' | 'danger';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
}

export function Text({ variant = 'body', tone = 'default', style, ...rest }: TextProps) {
  const { colors, typography } = useTheme();

  const variants: Record<TextVariant, TextStyle> = {
    display: {
      fontSize: typography.sizes.xxl,
      lineHeight: typography.lineHeights.xxl,
      fontWeight: typography.weights.bold,
    },
    title: {
      fontSize: typography.sizes.xl,
      lineHeight: typography.lineHeights.xl,
      fontWeight: typography.weights.bold,
    },
    subtitle: {
      fontSize: typography.sizes.lg,
      lineHeight: typography.lineHeights.lg,
      fontWeight: typography.weights.semibold,
    },
    body: {
      fontSize: typography.sizes.md,
      lineHeight: typography.lineHeights.md,
      fontWeight: typography.weights.regular,
    },
    label: {
      fontSize: typography.sizes.sm,
      lineHeight: typography.lineHeights.sm,
      fontWeight: typography.weights.medium,
    },
    caption: {
      fontSize: typography.sizes.xs,
      lineHeight: typography.lineHeights.xs,
      fontWeight: typography.weights.regular,
    },
  };

  const tones: Record<TextTone, string> = {
    default: colors.text,
    muted: colors.textMuted,
    primary: colors.primary,
    onPrimary: colors.onPrimary,
    danger: colors.danger,
  };

  return <RNText style={[variants[variant], { color: tones[tone] }, style]} {...rest} />;
}
