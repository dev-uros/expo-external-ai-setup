import { Button, Host, Text as UIText } from '@expo/ui';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { installedAppVersion, installedBuildVersion } from '@/lib/device';
import { usePalette } from '@/features/shared/hooks/use-palette';
import { font } from '@/features/shared/utils/typography';

/** Placeholder until the project's site exists; set per environment. Hidden when empty. */
const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL || undefined;

/** The privacy policy (opened in the browser) and which version of the app this is. */
export function AboutSection() {
  const palette = usePalette();
  const { t } = useTranslation();
  const version = installedAppVersion();
  const build = installedBuildVersion();

  return (
    <View style={[styles.card, { backgroundColor: palette.cardBackground }]}>
      <Text accessibilityRole="header" style={[styles.title, { color: palette.label }]}>
        {t('account.about.title')}
      </Text>
      {PRIVACY_URL ? (
        <Host matchContents={{ vertical: true }} style={styles.action}>
          <Button
            variant="outlined"
            onPress={() => void Linking.openURL(PRIVACY_URL)}
            testID="privacy-policy">
            <UIText textStyle={{ ...font('semibold'), fontSize: 16 }}>
              {t('account.about.privacy')}
            </UIText>
          </Button>
        </Host>
      ) : null}
      <Text selectable style={[styles.hint, { color: palette.secondaryLabel }]}>
        {t('account.about.version', { version: version ?? '—', build: build ?? '—' })}
      </Text>
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
  // Full width, like the other section buttons: a Host that sizes itself inside a column collapses on iOS.
  action: {
    width: '100%',
  },
  hint: {
    ...font(),
    fontSize: 14,
  },
});
