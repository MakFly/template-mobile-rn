import { useQuery } from '@tanstack/react-query';

import { getPost, getPosts } from './api';

/** Centralized query keys — invalidate with `postsKeys.all`. */
export const postsKeys = {
  all: ['posts'] as const,
  list: () => [...postsKeys.all, 'list'] as const,
  detail: (id: string) => [...postsKeys.all, 'detail', id] as const,
};

export function usePosts() {
  return useQuery({
    queryKey: postsKeys.list(),
    queryFn: getPosts,
  });
}

/**
 * `id` may be undefined at runtime: `useLocalSearchParams<{ id: string }>()`
 * only asserts the type, it does not guarantee the param on first render or
 * during navigation transitions. The query stays disabled until `id` exists.
 */
export function usePost(id: string | undefined) {
  return useQuery({
    queryKey: postsKeys.detail(id ?? ''),
    queryFn: () => {
      if (!id) {
        // enabled: !!id prevents this; guard kept so a manual refetch/prefetch
        // without id fails loudly instead of querying /posts/undefined.
        throw new Error('usePost: queryFn called without a post id');
      }
      return getPost(id);
    },
    enabled: !!id,
  });
}
