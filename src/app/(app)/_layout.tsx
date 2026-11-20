import { Stack } from 'expo-router/stack';

/**
 * The signed-in half of the app: the tabs, and the modals presented over them. A modal declared
 * here covers the tab bar; one declared inside a tab's stack would open within the tab.
 */
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="edit-profile" options={{ presentation: 'modal', headerShown: true }} />
    </Stack>
  );
}
