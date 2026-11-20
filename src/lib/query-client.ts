import NetInfo from '@react-native-community/netinfo';
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { AppState } from 'react-native';

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

/**
 * TanStack Query learns about focus and connectivity from the browser; React Native has neither
 * event, so without these two listeners stale data is never refetched when the app comes back
 * to the foreground or the phone gets its connection back, and requests made offline fail
 * instead of waiting.
 *
 * `isConnected` is `null` until NetInfo has looked — treated as online, so the first queries of
 * a launch are not paused for nothing.
 */
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(state.isConnected !== false))
);

focusManager.setEventListener((setFocused) => {
  const subscription = AppState.addEventListener('change', (status) =>
    setFocused(status === 'active')
  );
  return () => subscription.remove();
});
