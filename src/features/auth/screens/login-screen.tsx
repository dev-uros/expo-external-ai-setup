import { Button, Host, Text as UIText, type TextInputRef } from '@expo/ui';
import { Image } from 'expo-image';
import { useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { KeyboardAvoidingView, KeyboardController } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/features/shared/components/form-field';
import { useLoginForm } from '@/features/auth/hooks/use-login-form';
import { usePalette } from '@/features/shared/hooks/use-palette';
import { backgroundColor, labelColor, secondaryLabelColor } from '@/features/shared/utils/colors';
import { font } from '@/features/shared/utils/typography';

/**
 * Email + password sign-in. There is deliberately no "forgot password" here: this is an
 * internal app, and password recovery happens on the web. The form's behaviour lives in
 * `useLoginForm`; this file only draws it.
 */
export function LoginScreen() {
  const palette = usePalette();
  const passwordRef = useRef<TextInputRef>(null);
  const { edit, submit: send, isPending, formMessage, fieldError } = useLoginForm();

  function submit() {
    if (send()) KeyboardController.dismiss();
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor }]}>
      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive">
          <View style={styles.header}>
            {/* Placeholder: replace assets/logo.png with the company logo. */}
            <Image
              source={require('@/../assets/logo.png')}
              style={styles.logo}
              contentFit="cover"
              accessibilityLabel="Logo"
            />
            <Text accessibilityRole="header" style={[styles.title, { color: labelColor }]}>
              Prijava
            </Text>
            <Text style={[styles.subtitle, { color: secondaryLabelColor }]}>
              Prijavite se svojim poslovnim nalogom.
            </Text>
          </View>

          {formMessage ? (
            <View
              accessible
              accessibilityRole="alert"
              style={[styles.alert, { backgroundColor: palette.dangerBackground }]}>
              <Text style={[styles.alertText, { color: palette.danger }]}>{formMessage}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <FormField
              label="Email"
              testID="login-email"
              placeholder="ime.prezime@firma.com"
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              editable={!isPending}
              error={fieldError('email')}
              onChangeText={(value) => edit('email', value)}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <FormField
              ref={passwordRef}
              label="Lozinka"
              testID="login-password"
              secureTextEntry
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              editable={!isPending}
              error={fieldError('password')}
              onChangeText={(value) => edit('password', value)}
              onSubmitEditing={submit}
            />
          </View>

          <Host matchContents={{ vertical: true }} style={styles.buttonHost}>
            <Button
              disabled={isPending}
              onPress={submit}
              testID="login-submit"
              style={{ width: '100%' }}>
              <UIText textStyle={{ ...font('semibold'), fontSize: 17 }}>
                {isPending ? 'Prijavljivanje…' : 'Prijavi se'}
              </UIText>
            </Button>
          </Host>
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
});
