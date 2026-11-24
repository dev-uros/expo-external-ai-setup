import { useState } from 'react';
import * as z from 'zod';

import { useUpdateAccountMutation } from '@/features/account/query/use-account-mutations';
import type { AccountChanges } from '@/features/shared/api/account';
import type { User } from '@/features/shared/schemas/user';
import { toFormFeedback } from '@/features/shared/utils/api-errors';
import { profileSchema } from '@/features/account/schemas/profile';

const FIELDS = ['username', 'first_name', 'last_name', 'display_personal_name'] as const;
type Field = (typeof FIELDS)[number];
type FieldErrors = Partial<Record<Field, string>>;

interface Values {
  username: string;
  first_name: string;
  last_name: string;
  display_personal_name: boolean;
}

/**
 * Everything the profile form does, apart from drawing it — the same shape as the internal app's
 * user form. Validation runs locally with the backend's rules first, then on the server (a taken
 * username comes back as a 422 under its field). Only what changed is sent (`PATCH`). A failed
 * save keeps what was typed; `onSaved` gets the backend's message for the toast.
 */
export function useEditProfileForm(user: User, onSaved: (message: string) => void) {
  const save = useUpdateAccountMutation();
  const initial: Values = {
    username: user.username,
    first_name: user.first_name ?? '',
    last_name: user.last_name ?? '',
    display_personal_name: user.display_personal_name,
  };
  const [values, setValues] = useState<Values>(initial);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});

  const serverFeedback = toFormFeedback(save.error, FIELDS);
  const changes = changedFields(initial, values);
  const isDirty = Object.keys(changes).length > 0;

  function edit<K extends Field>(field: K, value: Values[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setClientErrors((current) => ({ ...current, [field]: undefined }));
    if (save.error) save.reset();
  }

  /** Returns whether the request was sent. */
  function submit(): boolean {
    if (save.isPending || !isDirty) return false;

    const parsed = profileSchema.safeParse(values);
    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error);
      setClientErrors({
        username: fieldErrors.username?.[0],
        first_name: fieldErrors.first_name?.[0],
        last_name: fieldErrors.last_name?.[0],
      });
      return false;
    }

    setClientErrors({});
    save.mutate(changedFields(initial, values), {
      onSuccess: ({ message }) => onSaved(message),
    });
    return true;
  }

  return {
    values,
    edit,
    submit,
    isDirty,
    isPending: save.isPending,
    formMessage: serverFeedback.message,
    fieldError: (field: Field) => clientErrors[field] ?? serverFeedback.fields[field],
  };
}

/** Compared the way the backend stores them: trimmed, lower-cased username, empty name = null. */
function changedFields(initial: Values, values: Values): AccountChanges {
  const changes: AccountChanges = {};
  const username = values.username.trim().toLowerCase();
  if (username !== initial.username) changes.username = username;
  const first = values.first_name.trim();
  if (first !== initial.first_name) changes.first_name = first === '' ? null : first;
  const last = values.last_name.trim();
  if (last !== initial.last_name) changes.last_name = last === '' ? null : last;
  if (values.display_personal_name !== initial.display_personal_name) {
    changes.display_personal_name = values.display_personal_name;
  }
  return changes;
}
