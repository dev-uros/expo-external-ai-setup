import { changeLanguage } from '@/lib/i18n';
import {
  emailSchema,
  registrationProfileSchema,
  suggestUsername,
} from '@/features/auth/schemas/sign-in';
import { emailFromToken } from '@/features/auth/hooks/use-welcome';

afterEach(() => changeLanguage('sr'));

test('an address is trimmed and lower-cased, as the server stores it', () => {
  expect(emailSchema.parse('  Ana@Example.COM ')).toBe('ana@example.com');
});

test('messages are in the app language at the moment of failing', () => {
  expect(emailSchema.safeParse('nope').error?.issues[0]?.message).toBe(
    'Email adresa nije ispravna.'
  );
  changeLanguage('en');
  expect(emailSchema.safeParse('nope').error?.issues[0]?.message).toBe(
    'This email address is not valid.'
  );
});

test('the profile follows the backend rules: username format, optional names', () => {
  expect(
    registrationProfileSchema.parse({
      username: ' Ana.N ',
      first_name: ' ',
      last_name: 'Anić',
      display_personal_name: false,
    })
  ).toEqual({
    username: 'ana.n',
    first_name: null,
    last_name: 'Anić',
    display_personal_name: false,
  });

  expect(
    registrationProfileSchema.safeParse({
      username: 'ne valja!',
      first_name: '',
      last_name: '',
      display_personal_name: false,
    }).success
  ).toBe(false);
});

test('a username is suggested from the address, without the +tag', () => {
  expect(suggestUsername('Jovana.Petrovic+test@gmail.com')).toBe('jovana.petrovic');
  expect(suggestUsername('ana-marija@example.com')).toBe('anamarija');
});

test('the address can be read from an Apple token for display', () => {
  const payload = btoa(JSON.stringify({ email: 'x7f@privaterelay.appleid.com' }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  expect(emailFromToken(`header.${payload}.signature`)).toBe('x7f@privaterelay.appleid.com');
  expect(emailFromToken('garbage')).toBe('');
});
