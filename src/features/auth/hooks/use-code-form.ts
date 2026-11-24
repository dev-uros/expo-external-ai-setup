import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { ApiError } from '@/lib/http';
import {
  registerWithCode,
  requestRegistrationCode,
  requestSignInCode,
  signInWithCode,
} from '@/features/auth/api/auth';
import { CODE_LENGTH } from '@/features/auth/schemas/sign-in';
import { startSession } from '@/features/auth/session';
import { useAuthFlowStore } from '@/features/auth/stores/auth-flow';
import { useCountdown } from '@/features/auth/hooks/use-countdown';
import { useToastStore } from '@/features/shared/stores/toast';
import { toDisplayMessage } from '@/features/shared/utils/api-errors';

/**
 * The code screen: six digits, sent as soon as the sixth arrives (typed or filled in by the
 * keyboard's one-time-code suggestion), and "send again" behind the server's own countdown.
 *
 * A wrong code clears the digits so the next attempt starts empty; the server's message says
 * what happened, and after five attempts the code is used up — a new one is asked for here.
 */
export function useCodeForm() {
  const { email, purpose, resendAt, setResendAt } = useAuthFlowStore();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const secondsLeft = useCountdown(resendAt);

  const verify = useMutation({
    mutationFn: async (digits: string) => {
      const { data } =
        purpose.kind === 'sign-in'
          ? await signInWithCode(email, digits)
          : await registerWithCode(email, digits, purpose.profile, purpose.avatar);
      await startSession(data.token, data.user);
    },
    onError: (error) => {
      setCode('');
      setMessage(toDisplayMessage(error));
    },
  });

  const resend = useMutation({
    mutationFn: () =>
      purpose.kind === 'sign-in'
        ? requestSignInCode(email)
        : requestRegistrationCode(email, purpose.profile.username),
    onSuccess: ({ message: sent, data }) => {
      setResendAt(data.retry_after);
      setCode('');
      setMessage(null);
      useToastStore.getState().show(sent);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 429 && error.retryAfter !== undefined) {
        setResendAt(error.retryAfter);
      }
      setMessage(toDisplayMessage(error));
    },
  });

  return {
    email,
    code,
    message,
    secondsLeft,
    isVerifying: verify.isPending,
    isResending: resend.isPending,
    canResend: secondsLeft === 0 && !resend.isPending && !verify.isPending,
    editCode: (value: string) => {
      const digits = value.replace(/\D/g, '').slice(0, CODE_LENGTH);
      setCode(digits);
      setMessage(null);
      if (digits.length === CODE_LENGTH && !verify.isPending) verify.mutate(digits);
    },
    resend: () => {
      if (secondsLeft === 0 && !resend.isPending) resend.mutate();
    },
  };
}
