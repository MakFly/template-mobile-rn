import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './errors';

function isRetryable(error: unknown): boolean {
  if (error instanceof ApiError) {
    // 4xx will fail the same way on retry; config/parse/abort are not transient.
    if (error.status !== undefined && error.status >= 400 && error.status < 500) return false;
    if (error.code === 'config' || error.code === 'parse' || error.code === 'aborted') return false;
  }
  return true;
}

/** Exported for tests that need an isolated client with the same defaults. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => failureCount < 2 && isRetryable(error),
      },
    },
  });
}

/** App-wide singleton, wired in src/app/_layout.tsx. */
export const queryClient = createQueryClient();
