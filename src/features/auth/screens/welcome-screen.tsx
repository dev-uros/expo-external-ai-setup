import { Button, Host, Text as UIText } from '@expo/ui';
import { Image } from 'expo-image';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { KeyboardAvoidingView, KeyboardController } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppleButton, appleSignInAvailable } from '@/lib/apple-sign-in';
import { GoogleButton, googleSignInAvailable } from '@/lib/google-sign-in';
import { useWelcome } from '@/features/auth/hooks/use-welcome';
import { FormField } from '@/features/shared/components/form-field';
import { usePalette } from '@/features/shared/hooks/use-palette';
import { font } from '@/features/shared/utils/typography';

/**
 * The way in: an address (a code is mailed to it — or, without an account, registration opens),
 * or Google, or Apple. Each provider button exists only where it is configured and available.
 * `footer` is what the route places at the bottom — the language switch.
 */
export function WelcomeScreen({ footer }: { footer?: ReactNode }) {
  const palette = usePalette();
  const dark = useColorScheme() === 'dark';
  const { t } = useTranslation();
  const welcome = useWelcome();
  const [appleAvailable, setAppleAvailable] = useState(false);
  const googleAvailable = googleSignInAvailable();

  useEffect(() => {
    void appleSignInAvailable().then(setAppleAvailable);
  }, []);

  function submit() {
    if (welcome.submitEmail()) KeyboardController.dismiss();
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive">
          <View style={styles.header}>
            {/* Placeholder: replace assets/logo.png with the project's logo. */}
            <Image
              source={require('@/../assets/logo.png')}
              style={styles.logo}
              contentFit="cover"
              accessibilityLabel={t('common.logo')}
            />
            <Text accessibilityRole="header" style={[styles.title, { color: palette.label }]}>
              {t('auth.welcome.title')}
            </Text>
            <Text style={[styles.subtitle, { color: palette.secondaryLabel }]}>
              {t('auth.welcome.subtitle')}
            </Text>
          </View>

          {welcome.message ? (
            <View
              accessible
              accessibilityRole="alert"
              style={[styles.alert, { backgroundColor: palette.dangerBackground }]}>
              <Text selectable style={[styles.alertText, { color: palette.danger }]}>
                {welcome.message}
              </Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <FormField
              label={t('auth.fields.email')}
              testID="welcome-email"
              placeholder={t('auth.fields.email_placeholder')}
              defaultValue={welcome.email}
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              editable={!welcome.isPending}
              error={welcome.fieldError ?? undefined}
              onChangeText={welcome.editEmail}
              onSubmitEditing={submit}
            />
            <Host matchContents={{ vertical: true }} style={styles.buttonHost}>
              <Button
                disabled={welcome.isPending}
                onPress={submit}
                testID="welcome-continue"
                style={{ width: '100%' }}>
                <UIText textStyle={{ ...font('semibold'), fontSize: 17 }}>
                  {welcome.isPending ? t('common.please_wait') : t('auth.welcome.continue')}
                </UIText>
              </Button>
            </Host>
          </View>

          {googleAvailable || appleAvailable ? (
            <View style={styles.providers}>
              <Text style={[styles.or, { color: palette.secondaryLabel }]}>
                {t('auth.welcome.or')}
              </Text>
              {appleAvailable ? (
                <AppleButton dark={dark} onPress={() => welcome.continueWith('apple')} />
              ) : null}
              {googleAvailable ? (
                <GoogleButton
                  dark={dark}
                  disabled={welcome.isPending}
                  onPress={() => welcome.continueWith('google')}
                />
              ) : null}
            </View>
          ) : null}

          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 24,
  },
  header: {
    gap: 8,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 16,
    alignSelf: 'center',
  },
  title: {
    ...font('bold'),
    fontSize: 34,
  },
  subtitle: {
    ...font(),
    fontSize: 17,
  },
  alert: {
    borderRadius: 10,
    borderCurve: 'continuous',
    padding: 14,
  },
  alertText: {
    ...font(),
    fontSize: 15,
  },
  form: {
    gap: 16,
  },
  buttonHost: {
    width: '100%',
  },
  providers: {
    gap: 12,
  },
  or: {
    ...font(),
    fontSize: 14,
    textAlign: 'center',
  },
});
