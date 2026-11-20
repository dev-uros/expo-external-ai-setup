import { Host } from '@expo/ui';
import { Picker, Text } from '@expo/ui/swift-ui';
import { disabled as disabledModifier, pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';

import type { SegmentedControlProps } from '@/features/shared/components/segmented-control.types';

/** iOS: a SwiftUI `Picker` in the segmented style — `UISegmentedControl`, as in Settings. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: SegmentedControlProps<T>) {
  return (
    <Host matchContents={{ vertical: true }} style={{ width: '100%' }}>
      <Picker
        label={label}
        selection={value}
        onSelectionChange={(selection) => onChange(selection as T)}
        modifiers={[pickerStyle('segmented'), disabledModifier(disabled)]}>
        {options.map((option) => (
          <Text key={option.value} modifiers={[tag(option.value)]}>
            {option.label}
          </Text>
        ))}
      </Picker>
    </Host>
  );
}
