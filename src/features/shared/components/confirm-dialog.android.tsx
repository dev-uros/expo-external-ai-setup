import { Host } from '@expo/ui';
import { AlertDialog, Text, TextButton } from '@expo/ui/jetpack-compose';

import { t } from '@/lib/i18n';
import type { ConfirmDialogProps } from '@/features/shared/components/confirm-dialog.types';
import { usePalette } from '@/features/shared/hooks/use-palette';
import { font } from '@/features/shared/utils/typography';

/**
 * A Material 3 `AlertDialog`. `onDismissRequest` fires for the back button, the predictive back
 * gesture and a tap outside, so all of them cancel.
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
  const palette = usePalette();
  if (!visible) return null;

  return (
    <Host matchContents>
      <AlertDialog onDismissRequest={onCancel}>
        <AlertDialog.Title>
          <Text style={{ ...font('semibold'), fontSize: 22 }}>{title}</Text>
        </AlertDialog.Title>
        <AlertDialog.Text>
          <Text style={{ ...font(), fontSize: 16 }}>{message}</Text>
        </AlertDialog.Text>
        <AlertDialog.DismissButton>
          <TextButton onClick={onCancel}>
            <Text style={{ ...font('medium'), fontSize: 15 }}>{cancelLabel}</Text>
          </TextButton>
        </AlertDialog.DismissButton>
        <AlertDialog.ConfirmButton>
          <TextButton
            onClick={onConfirm}
            colors={destructive ? { contentColor: palette.danger } : undefined}>
            <Text style={{ ...font('medium'), fontSize: 15 }}>{confirmLabel}</Text>
          </TextButton>
        </AlertDialog.ConfirmButton>
      </AlertDialog>
    </Host>
  );
}
