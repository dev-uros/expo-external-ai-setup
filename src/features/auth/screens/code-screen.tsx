import { Button, Host, Text as UIText } from '@expo/ui';
import { router } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { CodeInput } from '@/features/auth/components/code-input';
import { useCodeForm } from '@/features/auth/hooks/use-code-form';
import { usePalette } from '@/features/shared/hooks/use-palette';
import { font } from '@/features/shared/utils/typography';

/**
 * Six digits from the e-mail. Sent the moment the sixth is in; "send again" waits for the
 * server's countdown; "change the address" goes back to where it was typed.
 */
export function CodeScreen() {
  const palette = usePalette();
  const { t } = useTranslation();
  const form = useCodeForm();

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <Stack.Title style={font('semibold')}>{t('auth.code.title')}</Stack.Title>
      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive">
          <Text style={[styles.lead, { color: palette.secondaryLabel }]}>
            {t('auth.code.sent_to')}{' '}
            <Text selectable style={[styles.email, { color: palette.label }]}>
              {form.email}
            </Text>
          </Text>

          <CodeInput
            value={form.code}
            onChange={form.editCode}
            editable={!form.isVerifying}
            invalid={form.message !== null}
          />

          {form.isVerifying ? (
            <Text style={[styles.status, { color: palette.secondaryLabel }]}>
              {t('auth.code.checking')}
            </Text>
          ) : null}
          {form.message ? (
            <Text
              selectable
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              style={[styles.status, { color: palette.danger }]}>
              {form.message}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Host matchContents={{ vertical: true }} style={styles.buttonHost}>
              <Button
                variant="outlined"
                disabled={!form.canResend}
                onPress={form.resend}
                testID="code-resend"
                style={{ width: '100%' }}>
                <UIText textStyle={{ ...font('semibold'), fontSize: 16 }}>
                  {form.secondsLeft > 0
                    ? t('auth.code.resend_in', { count: form.secondsLeft })
                    : form.isResending
                      ? t('common.please_wait')
                      : t('auth.code.resend')}
                </UIText>
              </Button>
            </Host>
            <Host matchContents={{ vertical: true }} style={styles.buttonHost}>
              <Button
                variant="text"
                onPress={() => router.dismissTo('/welcome')}
                testID="code-change-email"
                style={{ width: '100%' }}>
                <UIText textStyle={{ ...font('medium'), fontSize: 16 }}>
                  {t('auth.code.change_email')}
                </UIText>
              </Button>
            </Host>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 24,
  },
  lead: {
    ...font(),
    fontSize: 17,
  },
  email: {
    ...font('semibold'),
  },
  status: {
    ...font(),
    fontSize: 15,
    textAlign: 'center',
  },
  actions: {
    gap: 8,
  },
  buttonHost: {
    width: '100%',
  },
});
