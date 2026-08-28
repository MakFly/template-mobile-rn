import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Drawer, DrawerToggleButton, useDrawerProgress } from 'expo-router/drawer';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/core/theme';
import { SidebarContent } from '@/shared/navigation/SidebarContent';

/** Fixed drawer width, matching the iautos assistant drawer reference
 * (iautos-mobile src/app/(app)/assistant/_layout.tsx). Also the distance
 * the scene card travels, so the blur overlay reuses it to track the slide. */
export const SIDEBAR_WIDTH = 310;

/** Blur strength when the drawer is fully open (frosted ChatGPT-iOS look). */
const OPEN_BLUR_INTENSITY = 25;

/** Fraction of the slide at which the blur reaches full strength. A linear
 * ramp (progress × intensity) reads as "no blur" for the first half of the
 * gesture; clamping the ramp to the first 20% makes the frost visible from
 * the very start of the opening. */
const BLUR_RAMP_END = 0.2;

/** On web, react-native-drawer-layout animates the scene with a CSS
 * `transform 0.3s` transition and its drawer progress is a fake shared value
 * that JUMPS 0→1 (no per-frame animation). Mirror that transition here so the
 * overlay tracks the sliding card instead of teleporting to the open position.
 * Easing matches the CSS default `ease` curve. */
const WEB_SLIDE = { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) };

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export type DrawerProgress = Readonly<SharedValue<number>>;

/**
 * `useDrawerProgress` only works INSIDE the drawer-layout tree, but the blur
 * overlay must live OUTSIDE it (above the whole navigator) to cover the
 * header too — the elements Header has `zIndex: 1`, so nothing rendered
 * inside the scene content can paint over it. This bridge mounts inside the
 * drawer content and hoists the SharedValue (a stable object) to the shell.
 */
export function DrawerProgressBridge({ onProgress }: { onProgress: (p: DrawerProgress) => void }) {
  const progress = useDrawerProgress();

  useEffect(() => {
    onProgress(progress);
  }, [onProgress, progress]);

  return null;
}

/**
 * Full-screen frosted overlay mirroring the sliding scene card: same
 * translateX (progress × drawer width) and same rounded left corners, so it
 * stays perfectly aligned with the card and never covers the revealed
 * sidebar. Blur intensity is driven by the drawer progress (0 when closed →
 * crisp content), and `pointerEvents: 'none'` keeps every interaction
 * intact — taps go through to the content when closed, and to the drawer's
 * own tap-to-close scrim when open.
 */
export function SceneBlurOverlay({ progress }: { progress: DrawerProgress }) {
  const { radii, scheme } = useTheme();

  // Native progress is frame-accurate (gesture/animation driven); web progress
  // is binary, so smooth it with a timing that mirrors the CSS slide.
  const slide = useDerivedValue(() => {
    const target = progress.get();
    return Platform.OS === 'web' ? withTiming(target, WEB_SLIDE) : target;
  });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slide.get() * SIDEBAR_WIDTH }],
  }));

  const blurProps = useAnimatedProps(() => ({
    intensity: interpolate(
      slide.get(),
      [0, BLUR_RAMP_END],
      [0, OPEN_BLUR_INTENSITY],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <Animated.View
      style={[
        styles.overlay,
        containerStyle,
        {
          borderTopLeftRadius: radii.lg,
          borderBottomLeftRadius: radii.lg,
          overflow: 'hidden',
        },
      ]}
    >
      <AnimatedBlurView
        animatedProps={blurProps}
        tint={scheme === 'dark' ? 'dark' : 'light'}
        style={styles.blur}
      />
    </Animated.View>
  );
}

/**
 * ChatGPT-like sidebar shell — `layoutMode: 'sidebar'`.
 * Uses the drawer vendored inside expo-router (`expo-router/drawer`);
 * `drawerType: 'back'` keeps the panel STATIC underneath and slides the
 * scene to the right to reveal it — real ChatGPT-iOS behavior. The moving
 * scene is the card: its left corners are rounded via `sceneStyle`
 * (the node that both moves and clips — header included); the panel stays
 * a plain, square surface. The scrim only ever covers the sliding scene
 * (it lives inside the moving node), never the revealed sidebar. On top,
 * SceneBlurOverlay frosts the pushed content progressively as the drawer
 * opens. Rendered by src/app/(tabs)/_layout.tsx (the layout switcher).
 */
export function SidebarNav() {
  const { colors, radii } = useTheme();
  const { t } = useTranslation();
  const [progress, setProgress] = useState<DrawerProgress | null>(null);

  return (
    // Sidebar-colored backdrop: the scene's rounded-corner cutouts sit past
    // the 310pt drawer node when open, so without this wrapper they would
    // reveal the bare navigator background instead of the sidebar surface.
    <View style={{ flex: 1, backgroundColor: colors.sidebar }}>
      <Drawer
        drawerContent={(props) => (
          <>
            <DrawerProgressBridge onProgress={setProgress} />
            <SidebarContent {...props} />
          </>
        )}
        screenOptions={{
          drawerType: 'back',
          // Transparent scrim (still catches taps to close): the overlay is a
          // RECTANGLE inside the sliding node, so any tint would also paint
          // the rounded-corner cutouts — grey notches on the sidebar surface
          // (measured 194 vs 255) — and would dim the very area the 'back'
          // drawer is supposed to reveal. The frosted look comes from
          // SceneBlurOverlay instead.
          overlayColor: 'transparent',
          drawerStyle: {
            width: SIDEBAR_WIDTH,
            // Transparent on purpose: the panel surface is painted by
            // SidebarContent's root (and the backdrop above), overriding the
            // theme `card` color the navigator would inject otherwise.
            backgroundColor: 'transparent',
          },
          swipeEnabled: true,
          swipeEdgeWidth: 48,
          headerShown: true,
          // Header without a title, shadcn-style: it exists only to carry the
          // sidebar trigger. Every screen already renders its own display
          // title, so a header title would print it twice.
          headerTitle: '',
          // The header travels with the scene card, so it takes the canvas
          // color, not the sidebar's.
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerLeft: () => <DrawerToggleButton tintColor={colors.text} />,
          sceneStyle: {
            backgroundColor: colors.background,
            // Rounded left edge of the sliding content card. This node fills
            // the drawer-layout's animated content view, so the curve tracks
            // the slide exactly; overflow hidden makes it actually clip.
            // When closed the 16pt curve sits under the iPhone's own display
            // corners, so no artifact shows at rest.
            borderTopLeftRadius: radii.lg,
            borderBottomLeftRadius: radii.lg,
            overflow: 'hidden',
          },
        }}
      >
        <Drawer.Screen name="index" options={{ title: t('tabs.home') }} />
        <Drawer.Screen
          name="posts"
          options={{
            title: t('tabs.posts'),
            // `posts` is a nested Stack that owns its headers: its index hides
            // the header (the screen renders its own title, like every shell)
            // and [id] shows a native stack header (free back button + swipe).
            // Hiding the drawer header here avoids stacking two headers on the
            // detail screen; the sidebar stays reachable via the edge swipe.
            headerShown: false,
          }}
        />
        <Drawer.Screen name="settings" options={{ title: t('tabs.settings') }} />
      </Drawer>
      {progress ? <SceneBlurOverlay progress={progress} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    pointerEvents: 'none',
  },
  blur: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
});
