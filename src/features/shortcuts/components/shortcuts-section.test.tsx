import { Stack } from 'expo-router/stack';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { useShortcutsStore } from '@/features/shortcuts/stores/shortcuts';
import { ShortcutsSection } from '@/features/shortcuts/components/shortcuts-section';

const at = '2026-11-20T10:00:00.000Z';

async function renderSection(nameOf?: (id: number) => string | undefined) {
  await renderRouter({
    _layout: () => <Stack />,
    index: () => <ShortcutsSection nameOf={nameOf} />,
  });
}

beforeEach(() => {
  useShortcutsStore.setState({ userId: 1, visits: [] });
});

test('a fresh account is told what will appear here', async () => {
  await renderSection();

  expect(screen.getByText(/Ovde se same skupljaju ekrani/)).toBeOnTheScreen();
  expect(screen.queryByText('Obriši prečice')).not.toBeOnTheScreen();
});

test('the most visited screens, named, with their counts', async () => {
  useShortcutsStore.setState({
    visits: [
      { path: '/users/7', visits: 3, lastVisitedAt: at },
      { path: '/users', visits: 5, lastVisitedAt: at },
      { path: '/users/7/logs', visits: 2, lastVisitedAt: at },
    ],
  });

  await renderSection((id) => (id === 7 ? 'Milica Jovanović' : undefined));

  expect(screen.getByLabelText('Korisnici, 5 poseta')).toBeOnTheScreen();
  expect(screen.getByLabelText('Milica Jovanović, 3 posete')).toBeOnTheScreen();
  expect(screen.getByLabelText('Istorija izmena · Milica Jovanović, 2 posete')).toBeOnTheScreen();
});

test('until the name is known, the screen’s own title stands in', async () => {
  useShortcutsStore.setState({ visits: [{ path: '/users/7', visits: 1, lastVisitedAt: at }] });

  await renderSection(() => undefined);

  expect(screen.getByLabelText('Korisnik, 1 poseta')).toBeOnTheScreen();
});

test('at most six are shown', async () => {
  useShortcutsStore.setState({
    visits: Array.from({ length: 9 }, (_, index) => ({
      path: `/users/${index + 1}`,
      visits: 1,
      lastVisitedAt: at,
    })),
  });

  await renderSection();

  expect(screen.getAllByLabelText(/^Korisnik, 1 poseta$/)).toHaveLength(6);
});

test('a path this version no longer has is dropped, not shown as a dead link', async () => {
  useShortcutsStore.setState({ visits: [{ path: '/reports', visits: 9, lastVisitedAt: at }] });

  await renderSection();

  expect(screen.getByText(/Ovde se same skupljaju ekrani/)).toBeOnTheScreen();
});

test('"Obriši prečice" forgets them', async () => {
  useShortcutsStore.setState({ visits: [{ path: '/users', visits: 2, lastVisitedAt: at }] });
  await renderSection();

  await fireEvent.press(screen.getByText('Obriši prečice'));

  expect(screen.getByText(/Ovde se same skupljaju ekrani/)).toBeOnTheScreen();
});
