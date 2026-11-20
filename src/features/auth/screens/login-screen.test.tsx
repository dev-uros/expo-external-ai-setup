import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';

import { LoginScreen } from '@/features/auth/screens/login-screen';

/**
 * What the screen shows. Typing into the native `@expo/ui` fields cannot be simulated under
 * Jest — that path is covered by `useLoginForm`'s tests and the Maestro flows in
 * `.maestro/auth/`.
 */
async function renderScreen() {
  await render(
    <QueryClientProvider client={new QueryClient()}>
      <LoginScreen />
    </QueryClientProvider>
  );
}

test('shows the logo, then offers exactly email and password', async () => {
  await renderScreen();

  expect(screen.getByLabelText('Logo')).toBeOnTheScreen();
  expect(screen.getByRole('header', { name: 'Prijava' })).toBeOnTheScreen();
  expect(screen.getByText('Email')).toBeOnTheScreen();
  expect(screen.getByText('Lozinka')).toBeOnTheScreen();
});

test('has no password recovery — that happens on the web', async () => {
  await renderScreen();

  expect(screen.queryByText(/zaboravil/i)).not.toBeOnTheScreen();
  expect(screen.queryByText(/resetuj/i)).not.toBeOnTheScreen();
});

test('shows no error before anything was submitted', async () => {
  await renderScreen();

  expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
});
