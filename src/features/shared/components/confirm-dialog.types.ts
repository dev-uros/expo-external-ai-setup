export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Red confirm action — for signing out, discarding, deleting. */
  destructive?: boolean;
  onConfirm: () => void;
  /** Cancel, the Android back button or gesture, a tap outside — anything but confirming. */
  onCancel: () => void;
}

export const DEFAULT_CANCEL_LABEL = 'Otkaži';
