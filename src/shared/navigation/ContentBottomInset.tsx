import { createContext, useContext, type PropsWithChildren } from 'react';

/**
 * Vertical space a scrollable screen must reserve at its bottom so its last
 * item is not left under a floating chrome element.
 *
 * Zero by default: classic tabs and the sidebar lay the content out *above*
 * their chrome, so nothing needs reserving. Only the island layout, whose pill
 * floats over the scene, provides a non-zero value.
 */
const ContentBottomInsetContext = createContext(0);

export interface ContentBottomInsetProviderProps extends PropsWithChildren {
  value: number;
}

export function ContentBottomInsetProvider({ value, children }: ContentBottomInsetProviderProps) {
  return (
    <ContentBottomInsetContext.Provider value={value}>
      {children}
    </ContentBottomInsetContext.Provider>
  );
}

/** Padding to append to a `contentContainerStyle` / scroll view bottom. */
export function useContentBottomInset(): number {
  return useContext(ContentBottomInsetContext);
}
