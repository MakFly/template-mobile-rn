import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';

import { useTheme } from '@/core/theme';
import { spacing } from '@/core/theme/tokens';
import { TabBarIcon, type TabBarIconName } from '@/shared/components/TabBarIcon';
import { Text } from '@/shared/components/Text';

/** Fixed height of the floating pill itself (Apple iOS 26 floating tab bar). */
export const FLOATING_TAB_BAR_HEIGHT = 52;

/**
 * Vertical space the pill occupies above the bottom safe-area inset:
 * pill height + its bottom margin. Consumers wanting a content padding
 * should add `useSafeAreaInsets().bottom` themselves.
 */
export const FLOATING_TAB_BAR_SPACE = FLOATING_TAB_BAR_HEIGHT + spacing.md;

export interface FloatingTabBarItem {
  /** Route name of the `<TabTrigger>` declared in the hidden `<TabList>`. */
  name: string;
  icon: TabBarIconName;
  label: string;
}

export interface FloatingTabBarProps {
  items: readonly FloatingTabBarItem[];
}

/**
 * Floating "island" pill tab bar. Renders on top of the current scene
 * (absolute, bottom); each item re-triggers the matching tab declared in the
 * hidden `<TabList>` of `IslandTabs` via `TabTrigger asChild`.
 * Geometry mirrors the Apple iOS 26 floating tab bar: a compact,
 * content-sized pill centered right above the home indicator — not a
 * full-width bar floating high over the scene.
 */
export function FloatingTabBar({ items }: FloatingTabBarProps) {
  const { colors, radii, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const shadowStyle: ViewStyle =
    Platform.OS === 'web'
      ? { boxShadow: `0 8px 18px ${colors.shadow}24` }
      : {
          shadowColor: colors.shadow,
          shadowOpacity: 0.14,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
        };

  return (
    <View
      // Hug the home indicator like the native bar; keep a small margin on
      // devices without one (insets.bottom === 0).
      style={[
        styles.wrapper,
        { bottom: Math.max(insets.bottom, spacing.md), pointerEvents: 'box-none' },
      ]}
    >
      {/*
        Two layers on purpose: the outer view carries the shadow (which
        `overflow: 'hidden'` would clip), the blurred view carries the rounded
        material and clips it.
      */}
      <View style={[shadowStyle, { borderRadius: radii.full }]}>
        <BlurView
          intensity={scheme === 'dark' ? 40 : 60}
          tint={scheme}
          style={[styles.pill, { borderColor: colors.border, borderRadius: radii.full }]}
        >
          {/*
            The blur alone is nearly invisible over a light page, and Android
            falls back to no blur at all — the veil is what keeps the island
            readable in both cases.
          */}
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.surfaceGlass, pointerEvents: 'none' },
            ]}
          />
          {items.map((item) => (
            <TabTrigger key={item.name} name={item.name} asChild>
              <IslandTabItem icon={item.icon} label={item.label} />
            </TabTrigger>
          ))}
        </BlurView>
      </View>
    </View>
  );
}

type IslandTabItemProps = TabTriggerSlotProps & {
  icon: TabBarIconName;
  label: string;
};

/**
 * One pill item. `isFocused` / `onPress` / `onLongPress` are injected by
 * `TabTrigger asChild` (Radix Slot). The forwarded `style` (row layout meant
 * for the default trigger) is intentionally dropped: this item owns its layout.
 */
function IslandTabItem({
  icon,
  label,
  isFocused = false,
  href,
  style,
  ...pressableProps
}: IslandTabItemProps) {
  const { colors, radii } = useTheme();

  // Sober indicator: an inner pill that fades/scales in behind the focused item.
  const focus = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    focus.set(withTiming(isFocused ? 1 : 0, { duration: 180 }));
  }, [isFocused, focus]);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: focus.get(),
    transform: [{ scale: 0.85 + focus.get() * 0.15 }],
  }));

  const tint = isFocused ? colors.primary : colors.textMuted;

  return (
    <Pressable
      {...pressableProps}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
      style={styles.item}
    >
      <Animated.View
        style={[
          styles.indicator,
          {
            backgroundColor: colors.surfaceAlt,
            borderRadius: radii.full,
            pointerEvents: 'none',
          },
          indicatorStyle,
        ]}
      />
      <TabBarIcon name={icon} color={tint} size={22} />
      <Text variant="caption" tone={isFocused ? 'primary' : 'muted'} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'stretch',
    // Content-sized (no width: '100%'): the pill hugs its items, the wrapper
    // centers it — Apple-style compact island.
    height: FLOATING_TAB_BAR_HEIGHT,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    // Required for the blur to respect the pill radius.
    overflow: 'hidden',
    // Android draws its shadow from `elevation` on the view that has a
    // background, and it is not clipped by this view's own `overflow`.
    elevation: 8,
  },
  item: {
    // Fixed-ish width per tab instead of flex: 1 — the pill stays compact.
    minWidth: 72,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    marginHorizontal: 0,
  },
});
