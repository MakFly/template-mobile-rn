import { useContext } from 'react';

import { ThemeContext } from './ThemeProvider';
import type { Theme } from './tokens';

/** Returns { colors, spacing, typography, radii, scheme }. Must be used under <ThemeProvider>. */
export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (theme === null) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  return theme;
}
