import { useTranslation } from 'react-i18next';

import { useSignOut } from '@/features/auth/hooks/use-sign-out';
import { ConfirmDialog } from '@/features/shared/components/confirm-dialog';
import { DestructiveButton } from '@/features/shared/components/destructive-button';

/**
 * The way out, behind a confirmation: the red button and the dialog it opens. A self-contained
 * section so any screen can offer it — the settings route places it near the bottom.
 */
export function SignOutSection() {
  const { t } = useTranslation();
  const { requestSignOut, isPending, confirming, confirm, cancel } = useSignOut();

  return (
    <>
      <DestructiveButton
        label={t('auth.sign_out.button')}
        pendingLabel={t('auth.sign_out.pending')}
        onPress={requestSignOut}
        pending={isPending}
        testID="sign-out"
      />
      <ConfirmDialog
        visible={confirming}
        title={t('auth.sign_out.title')}
        message={t('auth.sign_out.message')}
        confirmLabel={t('auth.sign_out.button')}
        destructive
        onConfirm={confirm}
        onCancel={cancel}
      />
    </>
  );
}
