import { Host } from '@expo/ui';
import { Button } from '@expo/ui/swift-ui';
import { buttonStyle, controlSize, disabled, font, frame, tint } from '@expo/ui/swift-ui/modifiers';

import {
  SIGN_OUT_LABEL,
  SIGNING_OUT_LABEL,
  type SignOutButtonProps,
} from '@/features/auth/components/sign-out-button.types';
import { font as appFont } from '@/features/shared/utils/typography';

/** A full-width, red, prominent SwiftUI button with the destructive role. */
export function SignOutButton({ onPress, pending }: SignOutButtonProps) {
  return (
    <Host matchContents={{ vertical: true }} style={{ width: '100%' }}>
      <Button
        role="destructive"
        label={pending ? SIGNING_OUT_LABEL : SIGN_OUT_LABEL}
        onPress={onPress}
        modifiers={[
          buttonStyle('borderedProminent'),
          controlSize('large'),
          font({ family: appFont('semibold').fontFamily, size: 17 }),
          tint('red'),
          frame({ maxWidth: Infinity }),
          disabled(pending),
        ]}
      />
    </Host>
  );
}
