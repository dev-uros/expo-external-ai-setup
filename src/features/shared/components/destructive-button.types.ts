export interface DestructiveButtonProps {
  label: string;
  /** Shown instead of `label` while the action runs; the button stops responding. */
  pendingLabel: string;
  onPress: () => void;
  pending: boolean;
  testID?: string;
}
