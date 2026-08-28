import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { DrawerContentScrollView, type DrawerContentComponentProps } from 'expo-router/drawer';

import { useTheme } from '@/core/theme';
import { TabBarIcon, type TabBarIconName } from '@/shared/components/TabBarIcon';
import { Text } from '@/shared/components/Text';

/** Route name → icon of the shared tab icon set (same glyphs as the other shells). */
const ROUTE_ICONS: Record<string, TabBarIconName> = {
  index: 'home',
  posts: 'posts',
  settings: 'settings',
};

/**
 * Route name → expo-router href. Navigation MUST go through the router
 * (linking) and not `navigation.navigate(route.name)`: the posts stack
 * declares `[id]` explicitly, which makes it the first — thus initial —
 * route for a bare React Navigation navigate, landing on the detail
 * screen without an id. The href resolves `/posts` to `posts/index`.
 */
const ROUTE_HREFS: Record<string, Href> = {
  index: '/',
  posts: '/posts',
  settings: '/settings',
};

/**
 * Custom drawer content for the ChatGPT-like sidebar layout:
 * app title on top, nav items, then a pinned profile footer.
 * Placeholder identity only — no auth feature exists yet.
 */
export function SidebarContent({ state, descriptors, navigation }: DrawerContentComponentProps) {
  const { colors, spacing, radii, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    // Plain, square surface: with `drawerType: 'back'` the panel sits STATIC
    // under the sliding scene — the rounded corners belong to the content
    // card (sceneStyle in SidebarNav), not to the panel. The root paints the
    // full drawer area (navigator drawerStyle is kept transparent) so no
    // background band can show behind the revealed sidebar.
    <View style={[styles.root, { backgroundColor: colors.sidebar }]}>
      <DrawerContentScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.xs }}
      >
        <Text
          variant="subtitle"
          style={{ paddingHorizontal: spacing.sm, paddingBottom: spacing.md }}
        >
          Template Mobile
        </Text>

        {state.routes.map((route, index) => {
          const focused = state.index === index;
          // `title` is always set by SidebarNav; route.name is a safe fallback.
          const label = descriptors[route.key]?.options.title ?? route.name;
          const icon = ROUTE_ICONS[route.name] ?? 'home';
          const tint = focused ? colors.primary : colors.textMuted;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={() => {
                navigation.closeDrawer();
                router.navigate(ROUTE_HREFS[route.name] ?? '/');
              }}
              style={({ pressed }) => [
                styles.item,
                {
                  gap: spacing.md,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.sm,
                  borderRadius: radii.md,
                  backgroundColor: focused || pressed ? colors.surfaceAlt : 'transparent',
                },
              ]}
            >
              <TabBarIcon name={icon} color={tint} size={typography.sizes.lg} />
              <Text variant="label" style={{ color: focused ? colors.primary : colors.text }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </DrawerContentScrollView>

      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.border,
            padding: spacing.lg,
            gap: spacing.md,
            paddingBottom: spacing.lg + insets.bottom,
          },
        ]}
      >
        <View
          style={[styles.avatar, { backgroundColor: colors.primary, borderRadius: radii.full }]}
        >
          <Text variant="label" tone="onPrimary">
            TM
          </Text>
        </View>
        <View style={styles.identity}>
          <Text variant="label">Guest user</Text>
          <Text variant="caption" tone="muted">
            Not signed in
          </Text>
        </View>
      </View>
    </View>
  );
}

const AVATAR_SIZE = 36;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: {
    flex: 1,
  },
});
