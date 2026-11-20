import { useState } from 'react';
import * as z from 'zod';

import {
  PROFILE_FIELDS,
  profileFormSchema,
  type ProfileField,
} from '@/features/profile/schemas/profile-form';
import { useUpdateProfileMutation } from '@/features/profile/query/use-update-profile-mutation';
import type { User } from '@/features/shared/schemas/user';
import { toFormFeedback } from '@/features/shared/utils/api-errors';

type Values = Record<ProfileField, string>;
type FieldErrors = Partial<Record<ProfileField, string>>;

/**
 * Everything the edit-profile form does, apart from drawing it.
 *
 * Validation runs locally with the backend's rules first, then on the server, whose answer is
 * shown as it arrives: 422 messages under their fields (a taken email among them), anything else
 * (403, no connection) above the form. A failed save keeps what was typed.
 */
export function useProfileForm(user: User, onSaved: (message: string) => void) {
  const save = useUpdateProfileMutation();
  const initial: Values = { name: user.name, surname: user.surname, email: user.email };
  const [values, setValues] = useState<Values>(initial);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});

  const serverFeedback = toFormFeedback(save.error, PROFILE_FIELDS);
  /** Whether saving would change anything — compared the way the backend will store it. */
  const isDirty = PROFILE_FIELDS.some((field) => values[field].trim() !== initial[field]);

  function edit(field: ProfileField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    // The previous answer no longer describes what is on screen.
    setClientErrors((current) => ({ ...current, [field]: undefined }));
    if (save.error) save.reset();
  }

  /** Returns whether the request was sent. */
  function submit(): boolean {
    if (save.isPending || !isDirty) return false;

    const parsed = profileFormSchema.safeParse(values);
    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error);
      setClientErrors({
        name: fieldErrors.name?.[0],
        surname: fieldErrors.surname?.[0],
        email: fieldErrors.email?.[0],
      });
      return false;
    }

    setClientErrors({});
    save.mutate(
      { id: user.id, form: parsed.data },
      { onSuccess: ({ message }) => onSaved(message) }
    );
    return true;
  }

  return {
    values,
    edit,
    submit,
    isDirty,
    isPending: save.isPending,
    isSaved: save.isSuccess,
    /** Shown above the form; `null` when there is nothing to say. */
    formMessage: serverFeedback.message,
    fieldError: (field: ProfileField) => clientErrors[field] ?? serverFeedback.fields[field],
  };
}
