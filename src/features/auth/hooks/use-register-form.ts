import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import * as z from 'zod';

import { ApiError } from '@/lib/http';
import {
  registerWithAppleToken,
  registerWithGoogleToken,
  requestRegistrationCode,
} from '@/features/auth/api/auth';
import {
  emailSchema,
  REGISTRATION_FIELDS,
  registrationProfileSchema,
  RESEND_FALLBACK_SECONDS,
  suggestUsername,
  type RegistrationProfile,
} from '@/features/auth/schemas/sign-in';
import { startSession } from '@/features/auth/session';
import { useAuthFlowStore } from '@/features/auth/stores/auth-flow';
import { useLocalAvatar } from '@/features/shared/hooks/use-local-avatar';
import { toFormFeedback } from '@/features/shared/utils/api-errors';

type Field = (typeof REGISTRATION_FIELDS)[number];
type FieldErrors = Partial<Record<Field, string>>;

/**
 * The registration form: an address (or the one Google / Apple vouched for, read-only), a
 * username, an optional name and picture.
 *
 * - **With an address:** the server checks the address and the username first (422 on either),
 *   mails a code, and the account is made on the code screen.
 * - **With Google or Apple:** there is no code — the account is made here, from the token kept
 *   when sign-in answered 404.
 */
export function useRegisterForm() {
  const flow = useAuthFlowStore();
  const provider = flow.provider;
  const startEmail = provider?.email ?? flow.email;
  const avatar = useLocalAvatar();

  const [values, setValues] = useState({
    email: startEmail,
    username: suggestUsername(startEmail),
    first_name: provider?.givenName ?? '',
    last_name: provider?.familyName ?? '',
    display_personal_name: false,
  });
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});

  const submitWithCode = useMutation({
    mutationFn: async ({ email, profile }: { email: string; profile: RegistrationProfile }) => {
      try {
        return {
          email,
          profile,
          retryAfter: (await requestRegistrationCode(email, profile.username)).data.retry_after,
        };
      } catch (error) {
        // A code went out a moment ago: carry on to it, with the wait.
        if (error instanceof ApiError && error.status === 429 && error.errors === undefined) {
          return { email, profile, retryAfter: error.retryAfter ?? RESEND_FALLBACK_SECONDS };
        }
        throw error;
      }
    },
    onSuccess: ({ email, profile, retryAfter }) => {
      flow.codeSent(email, { kind: 'register', profile, avatar: avatar.asset }, retryAfter);
      router.push('/code');
    },
  });

  const submitWithProvider = useMutation({
    mutationFn: async (profile: RegistrationProfile) => {
      if (provider === null) throw new Error('No provider registration in progress');
      const { data } =
        provider.proof.provider === 'google'
          ? await registerWithGoogleToken(provider.proof.idToken, profile, avatar.asset)
          : await registerWithAppleToken(provider.proof, profile, avatar.asset);
      await startSession(data.token, data.user);
    },
  });

  const failure = submitWithCode.error ?? submitWithProvider.error;
  const serverFeedback = toFormFeedback(failure, REGISTRATION_FIELDS);
  const isPending = submitWithCode.isPending || submitWithProvider.isPending;

  function edit<K extends keyof typeof values>(field: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setClientErrors((current) => ({ ...current, [field]: undefined }));
    submitWithCode.reset();
    submitWithProvider.reset();
  }

  return {
    values,
    avatar,
    provider: provider?.proof.provider ?? null,
    emailLocked: provider !== null,
    isPending,
    formMessage: serverFeedback.message,
    fieldError: (field: Field) => clientErrors[field] ?? serverFeedback.fields[field],
    edit,
    /** Returns whether the request was sent. */
    submit: (): boolean => {
      if (isPending) return false;

      const profile = registrationProfileSchema.safeParse(values);
      const email = provider === null ? emailSchema.safeParse(values.email) : null;
      if (!profile.success || (email !== null && !email.success)) {
        const fields = profile.success ? {} : z.flattenError(profile.error).fieldErrors;
        setClientErrors({
          email:
            email !== null && !email.success
              ? z.flattenError(email.error).formErrors[0]
              : undefined,
          username: fields.username?.[0],
          first_name: fields.first_name?.[0],
          last_name: fields.last_name?.[0],
        });
        return false;
      }

      setClientErrors({});
      if (email === null) submitWithProvider.mutate(profile.data);
      else submitWithCode.mutate({ email: email.data, profile: profile.data });
      return true;
    },
  };
}
