export interface SignOutButtonProps {
  onPress: () => void;
  /** While signing out: the label changes and the button stops responding. */
  pending: boolean;
}

export const SIGN_OUT_LABEL = 'Odjavi se';
export const SIGNING_OUT_LABEL = 'Odjavljivanje…';
