import { Host } from '@expo/ui';
import { Button, Text } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, testID as testIDModifier } from '@expo/ui/jetpack-compose/modifiers';

import type { DestructiveButtonProps } from '@/features/shared/components/destructive-button.types';
import { usePalette } from '@/features/shared/hooks/use-palette';
import { font } from '@/features/shared/utils/typography';

/** A full-width Material 3 filled button in the error color. */
export function DestructiveButton({
  label,
  pendingLabel,
  onPress,
  pending,
  testID,
}: DestructiveButtonProps) {
  const palette = usePalette();

  return (
    <Host matchContents={{ vertical: true }} style={{ width: '100%' }}>
      <Button
        onClick={onPress}
        enabled={!pending}
        colors={{ containerColor: palette.dangerButton, contentColor: '#FFFFFF' }}
        modifiers={[fillMaxWidth(), ...(testID ? [testIDModifier(testID)] : [])]}>
        <Text style={{ ...font('semibold'), fontSize: 16 }}>{pending ? pendingLabel : label}</Text>
      </Button>
    </Host>
  );
}
