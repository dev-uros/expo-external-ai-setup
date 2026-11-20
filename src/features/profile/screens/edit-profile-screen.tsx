import { Button, Host, Text as UIText, type TextInputRef } from '@expo/ui';
import CloseIcon from '@expo/material-symbols/close.xml';
import { router, useNavigation, usePreventRemove } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { KeyboardAvoidingView, KeyboardController } from 'react-native-keyboard-controller';

import { useProfileForm } from '@/features/profile/hooks/use-profile-form';
import { ConfirmDialog } from '@/features/shared/components/confirm-dialog';
import { FormField } from '@/features/shared/components/form-field';
import { usePalette } from '@/features/shared/hooks/use-palette';
import { useToastStore } from '@/features/shared/stores/toast';
import type { User } from '@/features/shared/schemas/user';
import { backgroundColor } from '@/features/shared/utils/colors';
import { font } from '@/features/shared/utils/typography';

/** The navigation the user asked for, held until they confirm leaving. */
type PendingAction = Parameters<
  NonNullable<Parameters<typeof usePreventRemove>[1]>
>[0]['data']['action'];

/**
 * Edits the signed-in user's own name, surname and email, presented as a modal over the profile.
 *
 * Leaving with unsaved changes — Cancel, swipe down, the Android back button or gesture — asks
 * first. After a save the modal closes and the backend's message is shown as a toast.
 */
export function EditProfileScreen({ user }: { user: User }) {
  const palette = usePalette();
  const navigation = useNavigation();
  const surnameRef = useRef<TextInputRef>(null);
  const emailRef = useRef<TextInputRef>(null);

  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [pendingLeave, setPendingLeave] = useState<PendingAction | null>(null);
  const [confirmedLeave, setConfirmedLeave] = useState<PendingAction | null>(null);
  const form = useProfileForm(user, setSavedMessage);

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
    <View style={[styles.screen, { backgroundColor }]}>
      <Stack.Title style={font('semibold')}>Izmena profila</Stack.Title>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          icon={process.env.EXPO_OS === 'ios' ? undefined : CloseIcon}
          accessibilityLabel="Otkaži"
          onPress={() => router.back()}>
          {process.env.EXPO_OS === 'ios' ? 'Otkaži' : undefined}
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
            label="Ime"
            testID="profile-name"
            defaultValue={user.name}
            autoComplete="given-name"
            autoCapitalize="words"
            returnKeyType="next"
            editable={!form.isPending}
            error={form.fieldError('name')}
            onChangeText={(value) => form.edit('name', value)}
            onSubmitEditing={() => surnameRef.current?.focus()}
          />
          <FormField
            ref={surnameRef}
            label="Prezime"
            testID="profile-surname"
            defaultValue={user.surname}
            autoComplete="family-name"
            autoCapitalize="words"
            returnKeyType="next"
            editable={!form.isPending}
            error={form.fieldError('surname')}
            onChangeText={(value) => form.edit('surname', value)}
            onSubmitEditing={() => emailRef.current?.focus()}
          />
          <FormField
            ref={emailRef}
            label="Email"
            testID="profile-email"
            defaultValue={user.email}
            keyboardType="email-address"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            editable={!form.isPending}
            error={form.fieldError('email')}
            onChangeText={(value) => form.edit('email', value)}
            onSubmitEditing={submit}
          />

          <Host matchContents={{ vertical: true }} style={styles.buttonHost}>
            <Button
              disabled={!form.isDirty || form.isPending}
              onPress={submit}
              testID="profile-save"
              style={{ width: '100%' }}>
              <UIText textStyle={{ ...font('semibold'), fontSize: 17 }}>
                {form.isPending ? 'Čuvanje…' : 'Sačuvaj'}
              </UIText>
            </Button>
          </Host>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmDialog
        visible={pendingLeave !== null}
        title="Odbaciti izmene?"
        message="Izmene koje niste sačuvali biće izgubljene."
        confirmLabel="Odbaci"
        cancelLabel="Nastavi izmenu"
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
    marginTop: 8,
  },
});
