import { createContext, useMemo, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import {
  darkColors,
  lightColors,
  radii,
  spacing,
  typography,
  type ColorScheme,
  type Theme,
} from './tokens';

/** User-facing preference; 'system' follows the OS appearance. */
export type ThemePreference = 'system' | 'light' | 'dark';

export const ThemeContext = createContext<Theme | null>(null);

interface ThemeProviderProps extends PropsWithChildren {
  /**
   * Injected preference so core/ never depends on features/.
   * The settings feature will read its store and pass the value down
   * from the root layout (re-render on change keeps this reactive).
   */
  preference?: ThemePreference;
}

export function ThemeProvider({ preference = 'system', children }: ThemeProviderProps) {
  const systemScheme = useColorScheme();

  const scheme: ColorScheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const theme = useMemo<Theme>(
    () => ({
      scheme,
      colors: scheme === 'dark' ? darkColors : lightColors,
      spacing,
      typography,
      radii,
    }),
    [scheme],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
