import { Host } from '@expo/ui';
import { SegmentedButton, SingleChoiceSegmentedButtonRow, Text } from '@expo/ui/jetpack-compose';

import type { SegmentedControlProps } from '@/features/shared/components/segmented-control.types';
import { font } from '@/features/shared/utils/typography';

/** Android: Material 3 single-choice segmented buttons. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
}: SegmentedControlProps<T>) {
  return (
    <Host matchContents={{ vertical: true }} style={{ width: '100%' }}>
      <SingleChoiceSegmentedButtonRow>
        {options.map((option) => (
          <SegmentedButton
            key={option.value}
            selected={value === option.value}
            enabled={!disabled}
            onClick={() => onChange(option.value)}>
            <SegmentedButton.Label>
              <Text style={{ ...font('medium'), fontSize: 14 }}>{option.label}</Text>
            </SegmentedButton.Label>
          </SegmentedButton>
        ))}
      </SingleChoiceSegmentedButtonRow>
    </Host>
  );
}
