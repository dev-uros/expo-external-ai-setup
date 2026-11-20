import { ConfirmDialog } from '@/features/shared/components/confirm-dialog';
import type { User } from '@/features/shared/schemas/user';
import { ROLE_LABELS, fullName } from '@/features/shared/utils/user';
import {
  otherRole,
  type ConfirmableAction,
  type useUserActions,
} from '@/features/users/hooks/use-user-actions';

/** What each action says before it acts — the web's modals, as native dialogs. */
function copy(action: ConfirmableAction, user: User) {
  const name = fullName(user);
  switch (action) {
    case 'changeRole':
      return {
        title: 'Promena uloge',
        message: `${name} dobija ulogu „${ROLE_LABELS[otherRole(user)]}”.`,
        confirmLabel: 'Promeni ulogu',
      };
    case 'resendActivation':
      return {
        title: 'Aktivacioni link',
        message: `Novi link za aktivaciju naloga biće poslat na ${user.email}.`,
        confirmLabel: 'Pošalji',
      };
    case 'deactivate':
      return {
        title: 'Isključivanje naloga',
        message:
          'Nalog ostaje u listi i može se ponovo uključiti. Svi tokeni se poništavaju odmah, pa je korisnik odjavljen sa svih uređaja.',
        confirmLabel: 'Isključi nalog',
        destructive: true,
      };
    case 'reactivate':
      return {
        title: 'Uključivanje naloga',
        message: `${name} ponovo može da se prijavi.`,
        confirmLabel: 'Uključi nalog',
      };
  }
}

const CONFIRMABLE: ConfirmableAction[] = [
  'changeRole',
  'resendActivation',
  'deactivate',
  'reactivate',
];

export function UserActionDialogs({
  user,
  actions,
}: {
  user: User;
  actions: ReturnType<typeof useUserActions>;
}) {
  return (
    <>
      {CONFIRMABLE.map((action) => (
        <ConfirmDialog
          key={action}
          visible={actions.confirming === action}
          {...copy(action, user)}
          onConfirm={actions.confirm}
          onCancel={actions.cancel}
        />
      ))}
    </>
  );
}
