import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { LANGUAGES } from '@/lib/i18n';
import { SegmentedControl } from '@/features/shared/components/segmented-control';
import { usePalette } from '@/features/shared/hooks/use-palette';
import { font } from '@/features/shared/utils/typography';
import { useChangeLanguage } from '@/features/language/hooks/use-change-language';
import { useLanguageStore } from '@/features/language/stores/language';

/**
 * The language switch. Each language is written in itself ("Srpski", "English"), so whoever
 * cannot read the current one still finds their own. `compact` drops the card, for the sign-in
 * screen.
 */
export function LanguageSection({ compact = false }: { compact?: boolean }) {
  const palette = usePalette();
  const { t } = useTranslation();
  const language = useLanguageStore((state) => state.language);
  const change = useChangeLanguage();
  const options = LANGUAGES.map((value) => ({ value, label: t(`language.names.${value}`) }));

  const control = (
    <SegmentedControl
      label={t('language.title')}
      options={options}
      value={language}
      onChange={change}
    />
  );

  if (compact) return control;

  return (
    <View style={[styles.card, { backgroundColor: palette.cardBackground }]}>
      <Text accessibilityRole="header" style={[styles.title, { color: palette.label }]}>
        {t('language.title')}
      </Text>
      {control}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  title: {
    ...font('semibold'),
    fontSize: 17,
  },
});
