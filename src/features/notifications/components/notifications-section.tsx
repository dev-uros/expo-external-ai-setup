import { Button, Host, Text as UIText } from '@expo/ui';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { useNotificationsSection } from '@/features/notifications/hooks/use-notifications-section';
import { usePalette } from '@/features/shared/hooks/use-palette';
import { font } from '@/features/shared/utils/typography';

/**
 * "Obaveštenja" on the profile: which phone this session is on, whether it receives pushes, and
 * the one thing to do about it — send a test, switch them on, or open the settings app after a
 * refusal for good.
 */
export function NotificationsSection() {
  const palette = usePalette();
  const { t } = useTranslation();
  const { status, deviceLine, action, error } = useNotificationsSection();

  return (
    <View style={[styles.card, { backgroundColor: palette.cardBackground }]}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={[styles.title, { color: palette.label }]}>
          {t('notifications.title')}
        </Text>
        {deviceLine ? (
          <Text style={[styles.hint, { color: palette.secondaryLabel }]}>{deviceLine}</Text>
        ) : null}
        <Text style={[styles.hint, { color: palette.secondaryLabel }]}>{status}</Text>
      </View>
      {action ? (
        <Host matchContents={{ vertical: true }} style={styles.action}>
          <Button
            variant="outlined"
            disabled={action.pending}
            onPress={action.pending ? undefined : action.onPress}
            testID="notifications-action">
            <UIText textStyle={{ ...font('semibold'), fontSize: 16 }}>{action.label}</UIText>
          </Button>
        </Host>
      ) : null}
      {error ? <Text style={[styles.error, { color: palette.danger }]}>{error}</Text> : null}
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
  // Full width, like the sign-out button: a Host that has to size itself horizontally inside a
  // column collapses to nothing on iOS and draws the button as a tall, empty sliver.
  action: {
    width: '100%',
  },
  error: {
    ...font(),
    fontSize: 14,
  },
});
