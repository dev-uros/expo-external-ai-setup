import { Host } from '@expo/ui';
import { Button, Text } from '@expo/ui/jetpack-compose';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';

import {
  SIGN_OUT_LABEL,
  SIGNING_OUT_LABEL,
  type SignOutButtonProps,
} from '@/features/auth/components/sign-out-button.types';
import { usePalette } from '@/features/shared/hooks/use-palette';
import { font } from '@/features/shared/utils/typography';

/** A full-width Material 3 filled button in the error color. */
export function SignOutButton({ onPress, pending }: SignOutButtonProps) {
  const palette = usePalette();

  return (
    <Host matchContents={{ vertical: true }} style={{ width: '100%' }}>
      <Button
        onClick={onPress}
        enabled={!pending}
        colors={{ containerColor: palette.dangerButton, contentColor: '#FFFFFF' }}
        modifiers={[fillMaxWidth()]}>
        <Text style={{ ...font('semibold'), fontSize: 16 }}>
          {pending ? SIGNING_OUT_LABEL : SIGN_OUT_LABEL}
        </Text>
      </Button>
    </Host>
  );
}
