import { Stack } from 'expo-router/stack';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { useState } from 'react';
import { Text } from 'react-native';

import { ErrorScreen } from '@/features/shared/components/error-screen';

/**
 * A screen that throws while rendering is replaced by `ErrorScreen`, configured on the layout
 * the way `(app)/_layout.tsx` does it, and "Pokušaj ponovo" renders the screen again.
 */

let shouldThrow = true;

function Flaky() {
  const [renders] = useState(() => 0);
  if (shouldThrow) throw new Error('Pukla je komponenta.');
  return <Text>Radi {renders}</Text>;
}

beforeEach(() => {
  shouldThrow = true;
  // React logs every caught render error; the noise says nothing here.
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

async function renderFlaky() {
  await renderRouter({
    _layout: { default: () => <Stack />, unstable_settings: { screenErrorBoundary: ErrorScreen } },
    index: Flaky,
  });
}

test('a crashing screen shows what happened instead of a blank screen', async () => {
  await renderFlaky();

  expect(screen.getByRole('header', { name: 'Nešto nije u redu' })).toBeOnTheScreen();
  // Development builds show the error itself; release builds a sentence for the user.
  expect(screen.getByText('Pukla je komponenta.')).toBeOnTheScreen();
});

test('trying again renders the screen anew', async () => {
  await renderFlaky();

  shouldThrow = false;
  await fireEvent.press(screen.getByTestId('error-screen-action'));

  expect(await screen.findByText('Radi 0')).toBeOnTheScreen();
});
