import { useContext } from 'react';
// expo-router vendors React Navigation and does not re-export the `elements`
// entry, so the context is reached by path. It is the only per-screen source
// of truth for "is a navigator header already on top of me": a shell-level
// provider cannot answer it, because a single shell shows a header on some of
// its screens and not on others (the sidebar hides it for the posts stack).
import { HeaderHeightContext } from 'expo-router/build/react-navigation/elements';

/**
 * Height of the navigator header rendered above the current screen, or 0 when
 * the screen owns its whole viewport. A non-zero value means the header has
 * already consumed the top safe-area inset.
 */
export function useShellHeaderHeight(): number {
  return useContext(HeaderHeightContext) ?? 0;
}
