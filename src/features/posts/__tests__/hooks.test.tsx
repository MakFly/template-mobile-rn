import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { ApiError } from '@/core/api';

import { usePost, usePosts } from '../hooks';
import { mockPosts } from '../mocks';

// EXPO_PUBLIC_API_URL is unset under Jest, so the feature runs on its mocks
// (300ms simulated latency), which is exactly the offline dev behavior.
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
    },
  });
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('usePosts', () => {
  it('starts pending then resolves with the fixtures', async () => {
    const { result } = await renderHook(() => usePosts(), { wrapper: createWrapper() });

    expect(result.current.isPending).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockPosts);
    expect(result.current.data).toHaveLength(9);
  });
});

describe('usePost', () => {
  it('resolves a single post by id', async () => {
    const { result } = await renderHook(() => usePost('1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockPosts[0]);
  });

  it('surfaces a 404 ApiError for an unknown id', async () => {
    const { result } = await renderHook(() => usePost('9999'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    const error = result.current.error as ApiError;
    expect(error.status).toBe(404);
    expect(error.code).toBe('http');
  });

  it('stays idle when the id is empty (enabled: false)', async () => {
    const { result } = await renderHook(() => usePost(''), { wrapper: createWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });

  it('does not fetch nor crash when the id is undefined (router params not ready)', async () => {
    // expo-router's useLocalSearchParams<{ id: string }> can yield undefined at
    // runtime (first render / transition): usePost must tolerate it.
    const { result } = await renderHook(() => usePost(undefined), { wrapper: createWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });
});
