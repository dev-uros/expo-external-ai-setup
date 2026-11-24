import { Stack } from 'expo-router/stack';

import { usePushRegistration } from '@/features/notifications/hooks/use-push-registration';
import { ErrorScreen } from '@/features/shared/components/error-screen';

/**
 * A screen that crashes while rendering is replaced by `ErrorScreen` in place — headers and the
 * tab bar stay, so the user can retry or simply go elsewhere. Nested layouts inherit it.
 */
export const unstable_settings = {
  screenErrorBoundary: ErrorScreen,
};

/**
 * The signed-in half of the app: the tabs, and the modals presented over them. A modal declared
 * here covers the tab bar; one declared inside a tab's stack would open within the tab.
 */
export default function AppLayout() {
  // Records this phone for the session and, once allowed, its push token.
  usePushRegistration();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="edit-profile" options={{ presentation: 'modal', headerShown: true }} />
    </Stack>
  );
}
