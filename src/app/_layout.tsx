import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { showNotificationsInForeground } from '@/lib/notifications';
import { queryClient } from '@/lib/query-client';
import { initSentry, wrapRoot } from '@/lib/sentry';
import { applySavedTheme } from '@/features/appearance/stores/appearance';
import { ErrorScreen } from '@/features/shared/components/error-screen';
import { ToastHost } from '@/features/shared/components/toast-host';
import { installUnauthorizedHandler, restoreSession } from '@/features/auth/session';
import { useSessionStore } from '@/features/shared/stores/session';

// First, so an error in anything below is already reported.
initSentry();
// Called at module scope so it runs before the splash screen can hide on its own.
void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 300, fade: true });
installUnauthorizedHandler();
showNotificationsInForeground();
// Synchronous read, so the chosen theme is in place before the first frame.
applySavedTheme();

/**
 * The last line of defence: an error that escapes every screen boundary — in a layout or a
 * provider — replaces the app with this instead of a white screen. Screens have their own
 * boundary in `(app)/_layout.tsx`, which keeps the tab bar and headers in place.
 */
export const ErrorBoundary = ErrorScreen;

export default wrapRoot(RootLayout);

function RootLayout() {
  // Navigators (headers, screen backgrounds) take their colors from this theme, not from the
  // system — without it every stack stays light in dark mode.
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <RootNavigator />
          <ToastHost />
          <StatusBar style="auto" />
        </QueryClientProvider>
      </KeyboardProvider>
    </ThemeProvider>
  );
}

/**
 * Which half of the app exists is decided by the session alone: signed in → `(app)`, signed
 * out → `(auth)`. A protected group is unreachable, deep links included, and the navigator
 * swaps groups on its own when the status changes — no screen navigates after a login or logout.
 */
function RootNavigator() {
  const status = useSessionStore((state) => state.status);

  useEffect(() => {
    void restoreSession();
  }, []);

  useEffect(() => {
    if (status !== 'loading') SplashScreen.hide();
  }, [status]);

  // Nothing is decided while the stored token is being checked — the native splash screen covers
  // that moment. Deciding early would treat the user as signed out, redirect a launch URL
  // (`/users/7` from a link or a notification) to the login, and lose it.
  if (status === 'loading') return null;

  const signedIn = status === 'signedIn';

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* `/` belongs to (app), so a signed-out launch needs an explicit way to the login. */}
      <Stack.Protected guard={signedIn} redirectTo="/login">
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn} redirectTo="/">
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
