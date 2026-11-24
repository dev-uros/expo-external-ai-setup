import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';

/**
 * A fresh QueryClient per hook or screen under test, without retries, so a failure shows at once.
 * `gcTime: Infinity` keeps the cache from scheduling its 5-minute clean-up timer, which would
 * otherwise hold Jest open after the last test of a file.
 */
export function queryWrapper(
  client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  })
) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}
