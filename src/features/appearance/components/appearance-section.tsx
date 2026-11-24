import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';

import { useAppearanceStore } from '@/features/appearance/stores/appearance';
import { SegmentedControl } from '@/features/shared/components/segmented-control';
import { usePalette } from '@/features/shared/hooks/use-palette';
import { font } from '@/features/shared/utils/typography';

const THEMES = ['system', 'light', 'dark'] as const;

/**
 * The theme section of Settings, and which theme is in effect right now — the useful thing to
 * know when "system" is picked.
 */
export function AppearanceSection() {
  const palette = usePalette();
  const { t } = useTranslation();
  const options = THEMES.map((value) => ({ value, label: t(`appearance.theme.${value}`) }));
  const preference = useAppearanceStore((state) => state.preference);
  const setPreference = useAppearanceStore((state) => state.setPreference);
  const resolved = useColorScheme();

  return (
    <View style={[styles.card, { backgroundColor: palette.cardBackground }]}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={[styles.title, { color: palette.label }]}>
          {t('appearance.title')}
        </Text>
        <Text style={[styles.hint, { color: palette.secondaryLabel }]}>
          {resolved === 'dark' ? t('appearance.now_dark') : t('appearance.now_light')}
        </Text>
      </View>
      <SegmentedControl
        label={t('appearance.theme_label')}
        options={options}
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
