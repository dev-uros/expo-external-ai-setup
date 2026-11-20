import type { User } from '@/features/shared/schemas/user';

/**
 * Which actions an account offers, given who is looking — the web's row menu, as rules.
 *
 * Not protection: the API answers 403 for every one of these whether or not it was offered. It
 * is here so the menu never offers what cannot work. The rules are not obvious, which is why
 * they live in a function with tests rather than in the screen:
 *
 * - a plain user may only look;
 * - an admin may not change their own role or switch off their own account — that is what keeps
 *   at least one working administrator;
 * - only an account that was never activated has an invite worth resending, and a switched-off
 *   account must be switched back on before it is invited anywhere.
 */
export type UserAction = 'edit' | 'changeRole' | 'resendActivation' | 'deactivate' | 'reactivate';

export interface Viewer {
  id: number | undefined;
  isAdmin: boolean;
}

export function availableActions(user: User, viewer: Viewer): UserAction[] {
  if (!viewer.isAdmin) return [];

  const isSelf = viewer.id === user.id;
  const actions: UserAction[] = ['edit'];

  if (!isSelf) actions.push('changeRole');
  if (user.email_verified_at === null && user.deactivated_at === null) {
    actions.push('resendActivation');
  }
  if (user.deactivated_at !== null) actions.push('reactivate');
  else if (!isSelf) actions.push('deactivate');

  return actions;
}

/** The audit trails are admin-only, own account included. */
export function canSeeHistory(viewer: Viewer): boolean {
  return viewer.isAdmin;
}

/** Anyone may change their own picture; an admin anyone's. */
export function canChangeAvatar(user: User, viewer: Viewer): boolean {
  return viewer.isAdmin || viewer.id === user.id;
}
