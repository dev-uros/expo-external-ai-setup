import { SignOutButton } from '@/features/auth/components/sign-out-button';
import { useSignOut } from '@/features/auth/hooks/use-sign-out';
import { ConfirmDialog } from '@/features/shared/components/confirm-dialog';

/**
 * The way out, behind a confirmation: the red button and the dialog it opens. A self-contained
 * section so any screen can offer it — the profile route places it under the account.
 */
export function SignOutSection() {
  const { requestSignOut, isPending, confirming, confirm, cancel } = useSignOut();

  return (
    <>
      <SignOutButton onPress={requestSignOut} pending={isPending} />
      <ConfirmDialog
        visible={confirming}
        title="Odjava"
        message="Da li ste sigurni da želite da se odjavite?"
        confirmLabel="Odjavi se"
        destructive
        onConfirm={confirm}
        onCancel={cancel}
      />
    </>
  );
}
