import { Host } from '@expo/ui';
import { Button } from '@expo/ui/swift-ui';
import { buttonStyle, controlSize, disabled, font, frame, tint } from '@expo/ui/swift-ui/modifiers';

import type { DestructiveButtonProps } from '@/features/shared/components/destructive-button.types';
import { font as appFont } from '@/features/shared/utils/typography';

/** A full-width, red, prominent SwiftUI button with the destructive role. */
export function DestructiveButton({
  label,
  pendingLabel,
  onPress,
  pending,
  testID,
}: DestructiveButtonProps) {
  return (
    <Host matchContents={{ vertical: true }} style={{ width: '100%' }}>
      <Button
        role="destructive"
        label={pending ? pendingLabel : label}
        onPress={onPress}
        testID={testID}
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
