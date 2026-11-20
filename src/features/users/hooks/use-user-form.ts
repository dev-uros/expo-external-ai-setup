import { useState } from 'react';
import * as z from 'zod';

import type { User, UserRole } from '@/features/shared/schemas/user';
import { toFormFeedback } from '@/features/shared/utils/api-errors';
import {
  useCreateUserMutation,
  useUpdateUserMutation,
} from '@/features/users/query/use-user-mutations';
import {
  USER_FORM_FIELDS,
  createUserSchema,
  updateUserSchema,
  type UserFormField,
} from '@/features/users/schemas/user-form';

type Values = { name: string; surname: string; email: string; role: UserRole };
type FieldErrors = Partial<Record<UserFormField, string>>;

/** A new account, or an existing one being edited. */
export type UserFormMode = { kind: 'create' } | { kind: 'edit'; user: User };

const EMPTY: Values = { name: '', surname: '', email: '', role: 'user' };

/**
 * Everything the create / edit form does, apart from drawing it.
 *
 * Validation runs locally with the backend's rules first, then on the server, whose answer is
 * shown as it arrives: 422 messages under their fields (a taken email among them), anything else
 * (403, no connection) above the form. A failed save keeps what was typed. `onSaved` gets the
 * backend's message for the toast the screen shows after it closes.
 */
export function useUserForm(mode: UserFormMode, onSaved: (message: string) => void) {
  const create = useCreateUserMutation();
  const update = useUpdateUserMutation();
  const save = mode.kind === 'create' ? create : update;

  const initial: Values =
    mode.kind === 'create'
      ? EMPTY
      : {
          name: mode.user.name,
          surname: mode.user.surname,
          email: mode.user.email,
          role: mode.user.role,
        };
  const [values, setValues] = useState<Values>(initial);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});

  const serverFeedback = toFormFeedback(save.error, USER_FORM_FIELDS);
  /** Whether saving would change anything — compared the way the backend will store it. */
  const isDirty = USER_FORM_FIELDS.some((field) => values[field].trim() !== initial[field]);

  function edit(field: UserFormField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    // The previous answer no longer describes what is on screen.
    setClientErrors((current) => ({ ...current, [field]: undefined }));
    if (save.error) save.reset();
  }

  /** Returns whether the request was sent. */
  function submit(): boolean {
    if (save.isPending || !isDirty) return false;

    const parsed = (mode.kind === 'create' ? createUserSchema : updateUserSchema).safeParse(values);
    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error);
      setClientErrors(
        Object.fromEntries(
          Object.entries(fieldErrors).map(([field, messages]) => [field, messages?.[0]])
        )
      );
      return false;
    }

    setClientErrors({});
    const done = { onSuccess: ({ message }: { message: string }) => onSaved(message) };
    if (mode.kind === 'create') {
      create.mutate(createUserSchema.parse(values), done);
    } else {
      update.mutate({ id: mode.user.id, form: updateUserSchema.parse(values) }, done);
    }
    return true;
  }

  return {
    values,
    edit,
    submit,
    isDirty,
    isPending: save.isPending,
    /** Shown above the form; `null` when there is nothing to say. */
    formMessage: serverFeedback.message,
    fieldError: (field: UserFormField) => clientErrors[field] ?? serverFeedback.fields[field],
  };
}
