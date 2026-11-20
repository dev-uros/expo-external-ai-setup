import * as z from 'zod';

import { profileFormSchema } from '@/features/profile/schemas/profile-form';

const valid = { name: 'Ana', surname: 'Anić', email: 'ana@firma.com' };

function errorsFor(input: unknown) {
  const result = profileFormSchema.safeParse(input);
  return result.success ? {} : z.flattenError(result.error).fieldErrors;
}

test('accepts what the backend accepts, trimmed the way the backend trims', () => {
  expect(
    profileFormSchema.parse({ name: ' Ana ', surname: 'Anić ', email: ' ana@firma.com' })
  ).toEqual(valid);
});

test('every field is required — blank counts as empty', () => {
  expect(errorsFor({ name: '  ', surname: '', email: '' })).toEqual({
    name: ['Unesite ime'],
    surname: ['Unesite prezime'],
    email: ['Unesite ispravnu email adresu'],
  });
});

test('the email must be an email', () => {
  expect(errorsFor({ ...valid, email: 'ana' }).email).toEqual(['Unesite ispravnu email adresu']);
});

test('255 characters is the limit on every field, as on the server', () => {
  const at = 'a'.repeat(255);
  const over = 'a'.repeat(256);
  const emailOver = `${'a'.repeat(246)}@firma.com`; // 256 characters

  expect(errorsFor({ ...valid, name: at })).toEqual({});
  expect(errorsFor({ ...valid, name: over }).name).toEqual(['Najviše 255 karaktera']);
  expect(errorsFor({ ...valid, surname: over }).surname).toEqual(['Najviše 255 karaktera']);
  expect(errorsFor({ ...valid, email: emailOver }).email).toEqual(['Najviše 255 karaktera']);
});
