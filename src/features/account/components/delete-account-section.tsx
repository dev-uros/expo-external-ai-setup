import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { useDeleteAccount } from '@/features/account/hooks/use-delete-account';
import { ConfirmDialog } from '@/features/shared/components/confirm-dialog';
import { DestructiveButton } from '@/features/shared/components/destructive-button';
import { usePalette } from '@/features/shared/hooks/use-palette';
import { font } from '@/features/shared/utils/typography';

/**
 * The last thing on Settings: deleting the account for good. What the person loses is said in
 * the dialog; a project with its own data adds it there.
 */
export function DeleteAccountSection({ onDeleted }: { onDeleted: () => Promise<void> }) {
  const palette = usePalette();
  const { t } = useTranslation();
  const deletion = useDeleteAccount(onDeleted);

  return (
    <View style={styles.section}>
      <DestructiveButton
        label={t('account.delete.button')}
        pendingLabel={t('account.delete.pending')}
        pending={deletion.isPending}
        onPress={deletion.request}
        testID="delete-account"
      />
      {deletion.error ? (
        <Text
          selectable
          accessibilityRole="alert"
          style={[styles.error, { color: palette.danger }]}>
          {deletion.error}
        </Text>
      ) : null}
      <ConfirmDialog
        visible={deletion.confirming}
        title={t('account.delete.title')}
        message={t('account.delete.message')}
        confirmLabel={t('account.delete.confirm')}
        destructive
        onConfirm={deletion.confirm}
        onCancel={deletion.cancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  error: {
    ...font(),
    fontSize: 14,
  },
});
