import * as z from 'zod';

import { credentialsSchema } from '@/features/auth/schemas/credentials';

function errorsFor(input: unknown) {
  const result = credentialsSchema.safeParse(input);
  return result.success ? {} : z.flattenError(result.error).fieldErrors;
}

test('accepts what the backend accepts', () => {
  expect(credentialsSchema.safeParse({ email: 'ana@firma.com', password: 'x' }).success).toBe(true);
});

test('requires a valid email, in Serbian', () => {
  expect(errorsFor({ email: '', password: 'x' }).email).toEqual(['Unesite ispravnu email adresu']);
  expect(errorsFor({ email: 'ana', password: 'x' }).email).toEqual([
    'Unesite ispravnu email adresu',
  ]);
});

test('requires a password but imposes no policy on it', () => {
  expect(errorsFor({ email: 'ana@firma.com', password: '' }).password).toEqual(['Unesite lozinku']);
  expect(errorsFor({ email: 'ana@firma.com', password: '1' }).password).toBeUndefined();
});
