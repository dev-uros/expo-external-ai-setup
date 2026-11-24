import { Button, Host, Switch, Text as UIText, type TextInputRef } from '@expo/ui';
import CloseIcon from '@expo/material-symbols/close.xml';
import { router, useNavigation, usePreventRemove } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { KeyboardAvoidingView, KeyboardController } from 'react-native-keyboard-controller';

import { useEditProfileForm } from '@/features/account/hooks/use-edit-profile-form';
import { ConfirmDialog } from '@/features/shared/components/confirm-dialog';
import { FormField } from '@/features/shared/components/form-field';
import { usePalette } from '@/features/shared/hooks/use-palette';
import type { User } from '@/features/shared/schemas/user';
import { useSessionStore } from '@/features/shared/stores/session';
import { useToastStore } from '@/features/shared/stores/toast';
import { font } from '@/features/shared/utils/typography';

/** The navigation the user asked for, held until they confirm leaving. */
type PendingAction = Parameters<
  NonNullable<Parameters<typeof usePreventRemove>[1]>
>[0]['data']['action'];

/** The signed-in account's profile, as a modal. The session always holds the account here. */
export function EditProfileScreen() {
  const user = useSessionStore((state) => state.user);
  return user ? <EditProfileForm user={user} /> : null;
}

/**
 * Username, first and last name, and whether to be greeted by the name — the internal app's
 * user form, for one's own account. Leaving with unsaved changes — Cancel, swipe down, the
 * Android back button or gesture — asks first. After a save the modal closes and the backend's
 * message is shown as a toast.
 */
function EditProfileForm({ user }: { user: User }) {
  const palette = usePalette();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const firstNameRef = useRef<TextInputRef>(null);
  const lastNameRef = useRef<TextInputRef>(null);

  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [pendingLeave, setPendingLeave] = useState<PendingAction | null>(null);
  const [confirmedLeave, setConfirmedLeave] = useState<PendingAction | null>(null);
  const form = useEditProfileForm(user, setSavedMessage);

  // Guards every way out while there is something to lose. Off once saved or once leaving is
  // confirmed — otherwise the confirmed navigation would be intercepted all over again.
  usePreventRemove(form.isDirty && savedMessage === null && confirmedLeave === null, ({ data }) => {
    KeyboardController.dismiss();
    setPendingLeave(data.action);
  });

  // Both run after the render that switched the guard off, so leaving is not intercepted.
  useEffect(() => {
    if (savedMessage !== null) {
      useToastStore.getState().show(savedMessage);
      router.back();
    }
  }, [savedMessage]);

  useEffect(() => {
    if (confirmedLeave !== null) navigation.dispatch(confirmedLeave);
  }, [confirmedLeave, navigation]);

  function submit() {
    if (form.submit()) KeyboardController.dismiss();
  }

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <Stack.Title style={font('semibold')}>{t('account.edit.title')}</Stack.Title>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          icon={process.env.EXPO_OS === 'ios' ? undefined : CloseIcon}
          accessibilityLabel={t('common.cancel')}
          onPress={() => router.back()}>
          {process.env.EXPO_OS === 'ios' ? t('common.cancel') : undefined}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive">
          {form.formMessage ? (
            <View
              accessible
              accessibilityRole="alert"
              style={[styles.alert, { backgroundColor: palette.dangerBackground }]}>
              <Text style={[styles.alertText, { color: palette.danger }]}>{form.formMessage}</Text>
            </View>
          ) : null}

          <FormField
            label={t('auth.fields.username')}
            testID="profile-username"
            defaultValue={user.username}
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
            testID="profile-first-name"
            defaultValue={user.first_name ?? ''}
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
            testID="profile-last-name"
            defaultValue={user.last_name ?? ''}
            autoComplete="family-name"
            autoCapitalize="words"
            returnKeyType="done"
            editable={!form.isPending}
            error={form.fieldError('last_name')}
            onChangeText={(value) => form.edit('last_name', value)}
            onSubmitEditing={submit}
          />

          <Host matchContents={{ vertical: true }} style={styles.buttonHost}>
            <Switch
              label={t('auth.fields.display_personal_name')}
              value={form.values.display_personal_name}
              onValueChange={(value) => form.edit('display_personal_name', value)}
              disabled={form.isPending}
              testID="profile-display-name"
            />
          </Host>

          <Host matchContents={{ vertical: true }} style={styles.buttonHost}>
            <Button
              disabled={!form.isDirty || form.isPending}
              onPress={submit}
              testID="profile-save"
              style={{ width: '100%' }}>
              <UIText textStyle={{ ...font('semibold'), fontSize: 17 }}>
                {form.isPending ? t('common.saving') : t('common.save')}
              </UIText>
            </Button>
          </Host>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmDialog
        visible={pendingLeave !== null}
        title={t('account.edit.discard_title')}
        message={t('account.edit.discard_message')}
        confirmLabel={t('account.edit.discard')}
        cancelLabel={t('account.edit.keep_editing')}
        destructive
        onConfirm={() => {
          setConfirmedLeave(pendingLeave);
          setPendingLeave(null);
        }}
        onCancel={() => setPendingLeave(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  alert: {
    borderRadius: 10,
    padding: 14,
  },
  alertText: {
    ...font(),
    fontSize: 15,
  },
  buttonHost: {
    width: '100%',
  },
});
