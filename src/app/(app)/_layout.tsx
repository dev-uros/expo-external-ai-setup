import { Stack } from 'expo-router/stack';

import { ErrorScreen } from '@/features/shared/components/error-screen';
import { useTrackVisits } from '@/features/shortcuts/hooks/use-track-visits';

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
  // Every screen of the signed-in app counts towards the home screen's shortcuts.
  useTrackVisits();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      {/* Creating a user, and editing one — one's own profile included. */}
      <Stack.Screen name="user-form/new" options={{ presentation: 'modal', headerShown: true }} />
      <Stack.Screen name="user-form/[id]" options={{ presentation: 'modal', headerShown: true }} />
    </Stack>
  );
}
