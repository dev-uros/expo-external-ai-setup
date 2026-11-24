export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** Defaults to the app language's "Cancel". */
  cancelLabel?: string;
  /** Red confirm action — for signing out, discarding, deleting. */
  destructive?: boolean;
  onConfirm: () => void;
  /** Cancel, the Android back button or gesture, a tap outside — anything but confirming. */
  onCancel: () => void;
}
