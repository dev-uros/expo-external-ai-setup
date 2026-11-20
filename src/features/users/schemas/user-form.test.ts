import * as z from 'zod';

import { createUserSchema, updateUserSchema } from '@/features/users/schemas/user-form';

function errors(schema: z.ZodType, input: unknown) {
  const result = schema.safeParse(input);
  return result.success ? {} : z.flattenError(result.error).fieldErrors;
}

const valid = { name: 'Ana', surname: 'Anić', email: 'ana@firma.com' };

test('trimmed values that meet the backend rules pass', () => {
  expect(
    updateUserSchema.parse({ name: ' Ana ', surname: 'Anić', email: ' ana@firma.com ' })
  ).toEqual(valid);
});

test('blank, malformed and too long values get Serbian messages', () => {
  expect(errors(updateUserSchema, { name: '  ', surname: 'A'.repeat(256), email: 'ana' })).toEqual({
    name: ['Unesite ime'],
    surname: ['Najviše 255 karaktera'],
    email: ['Unesite ispravnu email adresu'],
  });
});

test('creating also needs a role the API knows', () => {
  expect(createUserSchema.safeParse({ ...valid, role: 'admin' }).success).toBe(true);
  expect(createUserSchema.safeParse({ ...valid, role: 'owner' }).success).toBe(false);
});

test('editing never carries a role — it has its own endpoint', () => {
  expect(updateUserSchema.parse({ ...valid, role: 'admin' })).not.toHaveProperty('role');
});
