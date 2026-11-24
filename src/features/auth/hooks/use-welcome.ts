import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import * as z from 'zod';

import { ApiError } from '@/lib/http';
import { signInWithApple } from '@/lib/apple-sign-in';
import { signInWithGoogle } from '@/lib/google-sign-in';
import {
  requestSignInCode,
  signInWithAppleToken,
  signInWithGoogleToken,
} from '@/features/auth/api/auth';
import { emailSchema, RESEND_FALLBACK_SECONDS } from '@/features/auth/schemas/sign-in';
import { startSession } from '@/features/auth/session';
import { useAuthFlowStore, type ProviderRegistration } from '@/features/auth/stores/auth-flow';
import { classifySignInError } from '@/features/auth/utils/sign-in-errors';
import { reportError } from '@/lib/sentry';
import { toDisplayMessage } from '@/features/shared/utils/api-errors';

/**
 * The welcome screen: an address, or Google, or Apple.
 *
 * - The address gets a code if it has an account (→ the code screen) and goes to registration if
 *   it has none. A 429 means a code went out a moment ago — only to an address with an account —
 *   so the code screen opens with the wait.
 * - A provider that vouches for somebody without an account (404) leads to registration, with the
 *   proof kept for it. A 409 says to use a code; its message, the server's, says so in words.
 */
export function useWelcome() {
  const flow = useAuthFlowStore();
  const [email, setEmail] = useState(flow.email);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const emailStep = useMutation({
    mutationFn: (email: string) => requestSignInCode(email),
    onSuccess: ({ data }, sentTo) => {
      if (data.account_exists) {
        flow.codeSent(sentTo, { kind: 'sign-in' }, data.retry_after);
        router.push('/code');
      } else {
        flow.setEmail(sentTo);
        flow.clearProvider();
        router.push('/register');
      }
    },
    onError: (error, sentTo) => {
      if (error instanceof ApiError && error.status === 429) {
        flow.codeSent(sentTo, { kind: 'sign-in' }, error.retryAfter ?? RESEND_FALLBACK_SECONDS);
        router.push('/code');
        return;
      }
      if (error instanceof ApiError && error.errors?.email) {
        setFieldError(error.errors.email[0] ?? null);
        return;
      }
      setMessage(toDisplayMessage(error));
    },
  });

  const provider = useMutation({
    mutationFn: async (which: 'google' | 'apple') => {
      const registration = await askProvider(which);
      if (registration === null) return null;

      try {
        const { data } =
          registration.proof.provider === 'google'
            ? await signInWithGoogleToken(registration.proof.idToken)
            : await signInWithAppleToken(registration.proof);
        await startSession(data.token, data.user);
        return null;
      } catch (error) {
        if (classifySignInError(error) === 'no-account') return registration;
        throw error;
      }
    },
    onSuccess: (registration) => {
      if (registration === null) return;
      flow.startProviderRegistration(registration);
      router.push('/register');
    },
    onError: (error) => {
      if (!(error instanceof ApiError)) reportError(error);
      setMessage(toDisplayMessage(error));
    },
  });

  const isPending = emailStep.isPending || provider.isPending;

  return {
    email,
    isPending,
    fieldError,
    message,
    editEmail: (value: string) => {
      setEmail(value);
      setFieldError(null);
      setMessage(null);
    },
    /** Returns whether the request was sent. */
    submitEmail: (): boolean => {
      if (isPending) return false;
      const parsed = emailSchema.safeParse(email);
      if (!parsed.success) {
        setFieldError(z.flattenError(parsed.error).formErrors[0] ?? null);
        return false;
      }
      setMessage(null);
      emailStep.mutate(parsed.data);
      return true;
    },
    continueWith: (which: 'google' | 'apple') => {
      if (isPending) return;
      setMessage(null);
      provider.mutate(which);
    },
  };
}

/** Runs the provider's own sheet; `null` when the person backed out of it. */
async function askProvider(which: 'google' | 'apple'): Promise<ProviderRegistration | null> {
  if (which === 'google') {
    const google = await signInWithGoogle();
    return google === null
      ? null
      : {
          proof: { provider: 'google', idToken: google.idToken },
          email: google.email,
          givenName: google.givenName,
          familyName: google.familyName,
        };
  }

  const apple = await signInWithApple();
  return apple === null
    ? null
    : {
        proof: {
          provider: 'apple',
          idToken: apple.idToken,
          nonce: apple.nonce,
          authorizationCode: apple.authorizationCode,
        },
        email: apple.email ?? emailFromToken(apple.idToken),
        givenName: apple.givenName,
        familyName: apple.familyName,
      };
}

/**
 * Apple puts the address in `credential.email` only the first time; the token always carries it.
 * Read for display only — the server verifies the token and takes the address from it itself.
 */
export function emailFromToken(idToken: string): string {
  try {
    const payload = idToken.split('.')[1] ?? '';
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const email = (JSON.parse(json) as { email?: unknown }).email;
    return typeof email === 'string' ? email : '';
  } catch {
    return '';
  }
}
