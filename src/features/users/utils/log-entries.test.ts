import { changedFields, displayValue, eventLabel } from '@/features/users/utils/log-entries';

test('known events read in Serbian, unknown ones keep their name', () => {
  expect(eventLabel('user.role_changed')).toBe('Uloga promenjena');
  expect(eventLabel('user.teleported')).toBe('user.teleported');
});

test('a change lists every field from either side, in the words of the form', () => {
  expect(
    changedFields({
      old_values: { surname: 'Jovanović', role: 'user' },
      new_values: { surname: 'Jovanović Test', role: 'admin' },
    })
  ).toEqual([
    { field: 'surname', label: 'Prezime', from: 'Jovanović', to: 'Jovanović Test' },
    { field: 'role', label: 'Uloga', from: 'Korisnik', to: 'Administrator' },
  ]);
});

test('a creation has no old side; an event that changed nothing has no fields', () => {
  expect(changedFields({ old_values: null, new_values: { name: 'Ana' } })).toEqual([
    { field: 'name', label: 'Ime', from: '—', to: 'Ana' },
  ]);
  expect(changedFields({ old_values: null, new_values: null })).toEqual([]);
});

test('timestamps are formatted and unknown columns keep their name', () => {
  const [change] = changedFields({
    old_values: { deactivated_at: null },
    new_values: { deactivated_at: '2026-11-20T12:05:00+00:00' },
  });
  expect(change?.label).toBe('Isključen');
  expect(change?.from).toBe('—');
  expect(change?.to).toMatch(/2026.*:05/);

  expect(displayValue('favourite_colour', 'plava')).toBe('plava');
});
