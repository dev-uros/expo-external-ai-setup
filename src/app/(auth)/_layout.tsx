import { Stack } from 'expo-router/stack';

/** The signed-out half: the welcome screen, then the code or registration pushed over it. */
export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="code" options={{ headerBackButtonDisplayMode: 'minimal' }} />
      <Stack.Screen name="register" options={{ headerBackButtonDisplayMode: 'minimal' }} />
    </Stack>
  );
}
