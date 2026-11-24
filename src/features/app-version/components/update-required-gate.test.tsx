import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Linking, Text } from 'react-native';

import { installedAppVersion } from '@/lib/device';
import { ApiError } from '@/lib/http';
import { fetchAppVersionPolicy } from '@/features/app-version/api/app-version';
import { UpdateRequiredGate } from '@/features/app-version/components/update-required-gate';
import { appVersionKeys } from '@/features/app-version/query/use-app-version-query';

/**
 * The gate in front of the whole app. The installed version is 1.0.0 (jest.setup.ts); the server's
 * minimum decides whether the app runs at all.
 */

jest.mock('@/features/app-version/api/app-version', () => ({ fetchAppVersionPolicy: jest.fn() }));

const fetchPolicy = fetchAppVersionPolicy as jest.MockedFunction<typeof fetchAppVersionPolicy>;

async function renderGate() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await render(
    <QueryClientProvider client={client}>
      <UpdateRequiredGate>
        <Text>Aplikacija</Text>
      </UpdateRequiredGate>
    </QueryClientProvider>
  );
  // The app is shown while the policy is on its way; wait until the answer (or failure) is in.
  await waitFor(() =>
    expect(client.getQueryState(appVersionKeys.policy())?.status).not.toBe('pending')
  );
}

function policy(minimum: string | null, storeUrl: string | null = null) {
  return { message: 'OK', data: { minimum_version: minimum, store_url: storeUrl } };
}

beforeEach(() => {
  fetchPolicy.mockReset();
  jest.mocked(installedAppVersion).mockReturnValue('1.0.0');
});

test('an app older than the minimum shows only "update required", with a way to the store', async () => {
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  fetchPolicy.mockResolvedValue(policy('1.2.0', 'https://apps.apple.com/app/id123'));

  await renderGate();

  expect(await screen.findByRole('header', { name: 'Potrebno je ažuriranje' })).toBeOnTheScreen();
  expect(
    screen.getByText(
      'Verzija 1.0.0 se više ne može koristiti. Instalirajte najnoviju verziju da biste nastavili.'
    )
  ).toBeOnTheScreen();
  expect(screen.queryByText('Aplikacija')).not.toBeOnTheScreen();

  await fireEvent.press(screen.getByTestId('update-required-action'));
  expect(openURL).toHaveBeenCalledWith('https://apps.apple.com/app/id123');
});

test('without a store link it says the update is not out yet, and offers no button', async () => {
  fetchPolicy.mockResolvedValue(policy('1.2.0'));

  await renderGate();

  expect(
    await screen.findByText(
      'Verzija 1.0.0 se više ne može koristiti. Najnovija verzija još nije dostupna u prodavnici.'
    )
  ).toBeOnTheScreen();
  expect(screen.queryByTestId('update-required-action')).not.toBeOnTheScreen();
});

test.each([
  ['the same version', '1.0.0'],
  ['an older minimum', '0.9.0'],
  ['no minimum', null],
  ['a minimum that is not a version', 'najnovija'],
])('%s lets the app run', async (_, minimum) => {
  fetchPolicy.mockResolvedValue(policy(minimum));

  await renderGate();

  expect(screen.getByText('Aplikacija')).toBeOnTheScreen();
});

test('a server that cannot be reached does not lock anyone out', async () => {
  fetchPolicy.mockRejectedValue(new ApiError(0, 'Server trenutno nije dostupan.', 'req-1'));

  await renderGate();

  expect(screen.getByText('Aplikacija')).toBeOnTheScreen();
});
