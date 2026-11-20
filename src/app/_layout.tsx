import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { queryClient } from '@/lib/query-client';
import { ToastHost } from '@/features/shared/components/toast-host';
import { installUnauthorizedHandler, restoreSession } from '@/features/auth/session';
import { useSessionStore } from '@/features/shared/stores/session';

// Called at module scope so it runs before the splash screen can hide on its own.
void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 300, fade: true });
installUnauthorizedHandler();

export default function RootLayout() {
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

  // The navigator always renders, so the router can resolve the launch URL. While the stored
  // token is being checked the user counts as signed out — the native splash screen covers that
  // moment, and a valid token then swaps the groups before anything is shown.
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
