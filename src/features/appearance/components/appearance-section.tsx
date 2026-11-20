import { StyleSheet, Text, View, useColorScheme } from 'react-native';

import {
  THEME_LABELS,
  useAppearanceStore,
  type ThemePreference,
} from '@/features/appearance/stores/appearance';
import { SegmentedControl } from '@/features/shared/components/segmented-control';
import { usePalette } from '@/features/shared/hooks/use-palette';
import { font } from '@/features/shared/utils/typography';

const OPTIONS = (['system', 'light', 'dark'] as const).map((value: ThemePreference) => ({
  value,
  label: THEME_LABELS[value],
}));

/**
 * "Izgled" on the profile: the theme, and — as on the web — which one is in effect right now,
 * which is the useful thing to know when "Sistemska" is picked.
 */
export function AppearanceSection() {
  const palette = usePalette();
  const preference = useAppearanceStore((state) => state.preference);
  const setPreference = useAppearanceStore((state) => state.setPreference);
  const resolved = useColorScheme();

  return (
    <View style={[styles.card, { backgroundColor: palette.cardBackground }]}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={[styles.title, { color: palette.label }]}>
          Izgled
        </Text>
        <Text style={[styles.hint, { color: palette.secondaryLabel }]}>
          {`Trenutno je uključena ${resolved === 'dark' ? 'tamna' : 'svetla'} tema.`}
        </Text>
      </View>
      <SegmentedControl
        label="Tema"
        options={OPTIONS}
        value={preference}
        onChange={setPreference}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  heading: {
    gap: 2,
  },
  title: {
    ...font('semibold'),
    fontSize: 17,
  },
  hint: {
    ...font(),
    fontSize: 14,
  },
});
