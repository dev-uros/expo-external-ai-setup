import { request } from '@/lib/http';
import { avatarPart } from '@/features/shared/api/avatar';
import { devicePayload } from '@/features/shared/api/device';
import type { AvatarAsset } from '@/features/shared/schemas/avatar';
import { apiResponseSchema } from '@/features/shared/schemas/api';
import { authenticatedUserSchema } from '@/features/shared/schemas/user';
import { codeRequestSchema, registrationCodeSchema } from '@/features/auth/schemas/responses';
import type { RegistrationProfile } from '@/features/auth/schemas/sign-in';

/**
 * The external app's front door (`/mobile/v1/auth/*`). Every way in ends with `{ user, token }`.
 * Each sign-in carries the phone, so the backend binds it to the session it hands back; reading
 * the handset never blocks a sign-in — the next launch registers it through `PUT /device`.
 */

async function withDevice<T extends Record<string, unknown>>(body: T) {
  const device = await devicePayload().catch(() => undefined);
  return device === undefined ? body : { ...body, device };
}

const authenticated = apiResponseSchema(authenticatedUserSchema);

/** `POST email/sign-in-code` — `account_exists: false` means "go register"; nothing was mailed. */
export async function requestSignInCode(email: string) {
  const body = await request('/mobile/v1/auth/email/sign-in-code', {
    method: 'POST',
    body: { email },
  });
  return apiResponseSchema(codeRequestSchema).parse(body);
}

/** `POST email/sign-in` — 422 for a wrong, expired or used-up code; five tries per code. */
export async function signInWithCode(email: string, code: string) {
  const body = await request('/mobile/v1/auth/email/sign-in', {
    method: 'POST',
    body: await withDevice({ email, code }),
  });
  return authenticated.parse(body);
}

/** `POST email/registration-code` — 422 when the address or the username is taken. */
export async function requestRegistrationCode(email: string, username: string) {
  const body = await request('/mobile/v1/auth/email/registration-code', {
    method: 'POST',
    body: { email, username },
  });
  return apiResponseSchema(registrationCodeSchema).parse(body);
}

/** A registration as multipart, because it may carry the picture. */
async function registrationForm(
  fields: Record<string, string>,
  profile: RegistrationProfile,
  avatar: AvatarAsset | null
) {
  const form = new FormData();
  const all: Record<string, string> = {
    ...fields,
    username: profile.username,
    display_personal_name: profile.display_personal_name ? '1' : '0',
    ...(profile.first_name === null ? {} : { first_name: profile.first_name }),
    ...(profile.last_name === null ? {} : { last_name: profile.last_name }),
  };
  for (const [key, value] of Object.entries(all)) form.append(key, value);

  const device = await devicePayload().catch(() => undefined);
  if (device !== undefined) {
    for (const [key, value] of Object.entries(device)) {
      if (value !== null) form.append(`device[${key}]`, value);
    }
  }
  if (avatar !== null) form.append('avatar', avatarPart(avatar));
  return form;
}

/** `POST email/register` — the code and the whole profile; 201 with the account and a token. */
export async function registerWithCode(
  email: string,
  code: string,
  profile: RegistrationProfile,
  avatar: AvatarAsset | null
) {
  const body = await request('/mobile/v1/auth/email/register', {
    method: 'POST',
    body: await registrationForm({ email, code }, profile, avatar),
  });
  return authenticated.parse(body);
}

/** `POST google/sign-in` — 404: no account, register; 409: the address has an account — use a code. */
export async function signInWithGoogleToken(idToken: string) {
  const body = await request('/mobile/v1/auth/google/sign-in', {
    method: 'POST',
    body: await withDevice({ id_token: idToken }),
  });
  return authenticated.parse(body);
}

export async function registerWithGoogleToken(
  idToken: string,
  profile: RegistrationProfile,
  avatar: AvatarAsset | null
) {
  const body = await request('/mobile/v1/auth/google/register', {
    method: 'POST',
    body: await registrationForm({ id_token: idToken }, profile, avatar),
  });
  return authenticated.parse(body);
}

export interface AppleProof {
  idToken: string;
  nonce: string;
  authorizationCode: string | null;
}

function appleFields(proof: AppleProof): Record<string, string> {
  return {
    id_token: proof.idToken,
    nonce: proof.nonce,
    ...(proof.authorizationCode === null ? {} : { authorization_code: proof.authorizationCode }),
  };
}

/** `POST apple/sign-in` — the same answers as Google; the authorization code is spent only on success. */
export async function signInWithAppleToken(proof: AppleProof) {
  const body = await request('/mobile/v1/auth/apple/sign-in', {
    method: 'POST',
    body: await withDevice(appleFields(proof)),
  });
  return authenticated.parse(body);
}

export async function registerWithAppleToken(
  proof: AppleProof,
  profile: RegistrationProfile,
  avatar: AvatarAsset | null
) {
  const body = await request('/mobile/v1/auth/apple/register', {
    method: 'POST',
    body: await registrationForm(appleFields(proof), profile, avatar),
  });
  return authenticated.parse(body);
}
