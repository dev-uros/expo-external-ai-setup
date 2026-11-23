import NetInfo from '@react-native-community/netinfo';
import {
  MutationCache,
  QueryCache,
  QueryClient,
  focusManager,
  onlineManager,
} from '@tanstack/react-query';
import { AppState } from 'react-native';

import { ApiError } from '@/lib/http';
import { reportError } from '@/lib/sentry';

/**
 * Which failed calls are worth an error report. A 4xx is the API answering (a wrong password, a
 * 403, a 422) and status 0 is the phone's network — neither is a bug. A 5xx is, and so is
 * anything that is not an `ApiError` at all: a response the Zod schema rejected, or a throw in
 * our own code. The request id leads from the report to the backend's log lines.
 */
export function reportQueryError(error: unknown): void {
  if (error instanceof ApiError) {
    if (error.status >= 500) reportError(error, { request_id: error.requestId });
    return;
  }
  reportError(error);
}

/**
 * The single QueryClient. Global defaults live here; tune individual queries at the call site.
 *
 * A 4xx is an answer, not a hiccup — retrying a 401, 403 or 422 only repeats it, so only
 * network failures and 5xx are retried.
 */
export const queryClient = new QueryClient({
  // Once per call, after the last retry.
  queryCache: new QueryCache({ onError: reportQueryError }),
  mutationCache: new MutationCache({ onError: reportQueryError }),
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
