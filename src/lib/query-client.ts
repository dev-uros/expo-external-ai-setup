import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/lib/http';

/**
 * The single QueryClient. Global defaults live here; tune individual queries at the call site.
 *
 * A 4xx is an answer, not a hiccup — retrying a 401, 403 or 422 only repeats it, so only
 * network failures and 5xx are retried.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
