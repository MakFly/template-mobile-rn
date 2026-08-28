/**
 * Design tokens — single source of truth for the UI.
 * No component should ever hardcode a color, size or radius.
 */

export type ColorScheme = 'light' | 'dark';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export type Spacing = typeof spacing;

export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
  full: 999,
} as const;

export type Radii = typeof radii;

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  // Paired with sizes: same key means "line height for that font size".
  lineHeights: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 40,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export type Typography = typeof typography;

export interface ThemeColors {
  /** Root background of every screen. */
  background: string;
  /** Cards, tab bar, headers. */
  surface: string;
  /**
   * Navigation chrome that frames the app rather than living in it:
   * the sidebar panel. Kept apart from `surface` because shadcn gives the
   * sidebar its own scale — one step off the canvas, so the panel reads as
   * a distinct region even when cards and canvas share a color.
   */
  sidebar: string;
  /** Subtle emphasis inside a surface (pressed secondary, badges). */
  surfaceAlt: string;
  /**
   * Translucent veil laid over a blurred backdrop (floating island, popovers).
   * Must stay semi-transparent: it is what makes the blur readable while
   * keeping the material legible on Android, where the blur may not render.
   */
  surfaceGlass: string;
  text: string;
  textMuted: string;
  primary: string;
  /** Pressed state of primary interactive elements. */
  primaryPressed: string;
  /** Text/icon rendered on top of `primary`. */
  onPrimary: string;
  border: string;
  danger: string;
  success: string;
  /** Scrim behind drawers / modals (semi-transparent, covers the screen). */
  overlay: string;
  /** Shadow color for floating elements (island pill, popovers). */
  shadow: string;
}

/**
 * shadcn/ui default theme, zinc base. Values are the Tailwind zinc scale the
 * shadcn CSS variables resolve to, so light and dark stay the same system.
 * Two consequences worth knowing before changing anything here:
 * - `primary` is near-black (light) / near-white (dark), not a hue. shadcn
 *   spends no color on emphasis; contrast does that job, and `danger` stays
 *   the only saturated accent.
 * - `surface` equals `background` in light on purpose: a shadcn card is a
 *   white plane separated by its 1px border, not by a fill.
 */
export const lightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  sidebar: '#FAFAFA',
  surfaceAlt: '#F4F4F5',
  surfaceGlass: 'rgba(255, 255, 255, 0.80)',
  text: '#09090B',
  textMuted: '#71717A',
  primary: '#18181B',
  primaryPressed: '#27272A',
  onPrimary: '#FAFAFA',
  border: '#E4E4E7',
  danger: '#EF4444',
  success: '#059669',
  overlay: 'rgba(9, 9, 11, 0.80)',
  shadow: '#09090B',
};

/**
 * Dark side of the same theme. Unlike light, `surface` lifts one step above
 * `background` (zinc-900 over zinc-950): a border alone does not carry
 * elevation once the canvas is near-black.
 */
export const darkColors: ThemeColors = {
  background: '#09090B',
  surface: '#18181B',
  sidebar: '#18181B',
  surfaceAlt: '#27272A',
  surfaceGlass: 'rgba(24, 24, 27, 0.80)',
  text: '#FAFAFA',
  textMuted: '#A1A1AA',
  primary: '#FAFAFA',
  primaryPressed: '#E4E4E7',
  onPrimary: '#18181B',
  border: '#27272A',
  danger: '#F87171',
  success: '#34D399',
  overlay: 'rgba(0, 0, 0, 0.80)',
  shadow: '#000000',
};

export interface Theme {
  scheme: ColorScheme;
  colors: ThemeColors;
  spacing: Spacing;
  typography: Typography;
  radii: Radii;
}
