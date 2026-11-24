import { Button, Host, Switch, Text as UIText, type TextInputRef } from '@expo/ui';
import { Stack } from 'expo-router/stack';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { KeyboardAvoidingView, KeyboardController } from 'react-native-keyboard-controller';

import { useRegisterForm } from '@/features/auth/hooks/use-register-form';
import { AvatarEditor } from '@/features/shared/components/avatar-editor';
import { FormField } from '@/features/shared/components/form-field';
import { usePalette } from '@/features/shared/hooks/use-palette';
import { font } from '@/features/shared/utils/typography';

/**
 * A new account: picture (optional), address — read-only when Google or Apple vouched for it —
 * username, and an optional first and last name with the choice to be greeted by them.
 */
export function RegisterScreen() {
  const palette = usePalette();
  const { t } = useTranslation();
  const form = useRegisterForm();
  const usernameRef = useRef<TextInputRef>(null);
  const firstNameRef = useRef<TextInputRef>(null);
  const lastNameRef = useRef<TextInputRef>(null);

  function submit() {
    if (form.submit()) KeyboardController.dismiss();
  }

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <Stack.Title style={font('semibold')}>{t('auth.register.title')}</Stack.Title>
      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive">
          <View style={styles.avatar}>
            <AvatarEditor
              name={form.values.username || '?'}
              url={form.avatar.asset?.uri ?? null}
              editor={form.avatar}
              size={88}
            />
            <Text style={[styles.hint, { color: palette.secondaryLabel }]}>
              {t('auth.register.avatar_hint')}
            </Text>
            {(form.avatar.error ?? form.fieldError('avatar')) ? (
              <Text style={[styles.hint, { color: palette.danger }]}>
                {form.avatar.error ?? form.fieldError('avatar')}
              </Text>
            ) : null}
          </View>

          {form.formMessage ? (
            <View
              accessible
              accessibilityRole="alert"
              style={[styles.alert, { backgroundColor: palette.dangerBackground }]}>
              <Text selectable style={[styles.alertText, { color: palette.danger }]}>
                {form.formMessage}
              </Text>
            </View>
          ) : null}

          {form.emailLocked ? (
            <View style={styles.locked}>
              <Text style={[styles.label, { color: palette.label }]}>{t('auth.fields.email')}</Text>
              <Text selectable style={[styles.lockedValue, { color: palette.secondaryLabel }]}>
                {form.values.email}
              </Text>
            </View>
          ) : (
            <FormField
              label={t('auth.fields.email')}
              testID="register-email"
              defaultValue={form.values.email}
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              editable={!form.isPending}
              error={form.fieldError('email')}
              onChangeText={(value) => form.edit('email', value)}
              onSubmitEditing={() => usernameRef.current?.focus()}
            />
          )}

          <FormField
            ref={usernameRef}
            label={t('auth.fields.username')}
            testID="register-username"
            defaultValue={form.values.username}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            editable={!form.isPending}
            error={form.fieldError('username')}
            onChangeText={(value) => form.edit('username', value)}
            onSubmitEditing={() => firstNameRef.current?.focus()}
          />
          <FormField
            ref={firstNameRef}
            label={t('auth.fields.first_name')}
            testID="register-first-name"
            defaultValue={form.values.first_name}
            autoComplete="given-name"
            autoCapitalize="words"
            returnKeyType="next"
            editable={!form.isPending}
            error={form.fieldError('first_name')}
            onChangeText={(value) => form.edit('first_name', value)}
            onSubmitEditing={() => lastNameRef.current?.focus()}
          />
          <FormField
            ref={lastNameRef}
            label={t('auth.fields.last_name')}
            testID="register-last-name"
            defaultValue={form.values.last_name}
            autoComplete="family-name"
            autoCapitalize="words"
            returnKeyType="done"
            editable={!form.isPending}
            error={form.fieldError('last_name')}
            onChangeText={(value) => form.edit('last_name', value)}
            onSubmitEditing={submit}
          />

          <Host matchContents={{ vertical: true }} style={styles.fullWidth}>
            <Switch
              label={t('auth.fields.display_personal_name')}
              value={form.values.display_personal_name}
              onValueChange={(value) => form.edit('display_personal_name', value)}
              disabled={form.isPending}
              testID="register-display-name"
            />
          </Host>

          <Host matchContents={{ vertical: true }} style={styles.fullWidth}>
            <Button
              disabled={form.isPending}
              onPress={submit}
              testID="register-submit"
              style={{ width: '100%' }}>
              <UIText textStyle={{ ...font('semibold'), fontSize: 17 }}>
                {form.isPending
                  ? t('common.please_wait')
                  : form.provider === null
                    ? t('auth.register.send_code')
                    : t('auth.register.create')}
              </UIText>
            </Button>
          </Host>
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
    gap: 16,
  },
  avatar: {
    alignItems: 'center',
    gap: 8,
  },
  hint: {
    ...font(),
    fontSize: 14,
    textAlign: 'center',
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
  locked: {
    gap: 6,
  },
  label: {
    ...font('semibold'),
    fontSize: 15,
  },
  lockedValue: {
    ...font(),
    fontSize: 17,
  },
  fullWidth: {
    width: '100%',
  },
});
