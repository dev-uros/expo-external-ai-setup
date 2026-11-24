import { useEffect, useEffectEvent } from 'react';
import { Alert } from 'react-native';

import { t } from '@/lib/i18n';
import type { ConfirmDialogProps } from '@/features/shared/components/confirm-dialog.types';

/**
 * A yes/no question in the platform's own dialog. On iOS this is the system alert
 * (`UIAlertController`); Android renders a Material 3 dialog from `confirm-dialog.android.tsx`
 * instead, because React Native's Android `Alert` takes the app's legacy AppCompat theme.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = t('common.cancel'),
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Opens once per `visible` change; the latest callbacks are read when a button is pressed.
  const open = useEffectEvent(() => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: 'cancel', onPress: onCancel },
        { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
      ],
      { cancelable: true, onDismiss: onCancel }
    );
  });

  useEffect(() => {
    if (visible) open();
  }, [visible]);

  return null;
}
