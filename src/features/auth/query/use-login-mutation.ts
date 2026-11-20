import { useMutation } from '@tanstack/react-query';

import { login } from '@/features/auth/api/session';
import type { Credentials } from '@/features/auth/schemas/credentials';
import { startSession } from '@/features/auth/session';

export function useLoginMutation() {
  return useMutation({
    mutationFn: (credentials: Credentials) => login(credentials),
    onSuccess: ({ data }) => startSession(data.token, data.user),
  });
}
