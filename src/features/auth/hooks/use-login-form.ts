import { useState } from 'react';
import * as z from 'zod';

import { useLoginMutation } from '@/features/auth/query/use-login-mutation';
import {
  CREDENTIALS_FIELDS,
  credentialsSchema,
  type CredentialsField,
} from '@/features/auth/schemas/credentials';
import { toFormFeedback } from '@/features/shared/utils/api-errors';

type FieldErrors = Partial<Record<CredentialsField, string>>;

/**
 * Everything the sign-in form does, apart from drawing it.
 *
 * Validation runs twice: locally with the backend's own rules, so the common mistakes are
 * caught instantly in Serbian, and on the server, whose answer is shown as it arrives — field
 * messages under their fields, anything else (401, 403, 429, no connection) above the form.
 */
export function useLoginForm() {
  const login = useLoginMutation();
  const [values, setValues] = useState<Record<CredentialsField, string>>({
    email: '',
    password: '',
  });
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});

  const serverFeedback = toFormFeedback(login.error, CREDENTIALS_FIELDS);

  function edit(field: CredentialsField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    // The previous answer no longer describes what is on screen.
    setClientErrors((current) => ({ ...current, [field]: undefined }));
    if (login.error) login.reset();
  }

  /** Returns whether the request was sent. */
  function submit(): boolean {
    if (login.isPending) return false;

    const parsed = credentialsSchema.safeParse({
      email: values.email.trim(),
      password: values.password,
    });
    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error);
      setClientErrors({ email: fieldErrors.email?.[0], password: fieldErrors.password?.[0] });
      return false;
    }

    setClientErrors({});
    login.mutate(parsed.data);
    return true;
  }

  return {
    values,
    edit,
    submit,
    isPending: login.isPending,
    /** Shown above the form; `null` when there is nothing to say. */
    formMessage: serverFeedback.message,
    fieldError: (field: CredentialsField) => clientErrors[field] ?? serverFeedback.fields[field],
  };
}
