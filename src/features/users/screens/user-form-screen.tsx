import { Button, Host, Text as UIText, type TextInputRef } from '@expo/ui';
import CloseIcon from '@expo/material-symbols/close.xml';
import { router, useNavigation, usePreventRemove } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { KeyboardAvoidingView, KeyboardController } from 'react-native-keyboard-controller';

import { ConfirmDialog } from '@/features/shared/components/confirm-dialog';
import { ScreenMessage } from '@/features/shared/components/screen-message';
import { FormField } from '@/features/shared/components/form-field';
import { SegmentedControl } from '@/features/shared/components/segmented-control';
import { usePalette } from '@/features/shared/hooks/use-palette';
import { useToastStore } from '@/features/shared/stores/toast';
import { useSessionStore } from '@/features/shared/stores/session';
import { font } from '@/features/shared/utils/typography';
import { ROLE_LABELS } from '@/features/shared/utils/user';
import { toDisplayMessage } from '@/features/shared/utils/api-errors';
import { useUserForm, type UserFormMode } from '@/features/users/hooks/use-user-form';
import { useUserQuery } from '@/features/users/query/use-user-query';

/** The navigation the user asked for, held until they confirm leaving. */
type PendingAction = Parameters<
  NonNullable<Parameters<typeof usePreventRemove>[1]>
>[0]['data']['action'];

/**
 * Editing an account by id: the form once the account is known — at once when it is one's own or
 * already in the list — or why it cannot be shown.
 */
export function EditUserScreen({ id }: { id: number | null }) {
  if (id === null) return <FormMessage title="Korisnik ne postoji" />;
  return <EditUser id={id} />;
}

function EditUser({ id }: { id: number }) {
  const palette = usePalette();
  const { data: user, error, refetch } = useUserQuery(id);

  if (user) return <UserFormScreen mode={{ kind: 'edit', user }} />;
  if (error) {
    return (
      <FormMessage
        title="Korisnik nije učitan"
        message={toDisplayMessage(error)}
        onRetry={() => void refetch()}
      />
    );
  }
  return (
    <View style={[styles.screen, styles.center, { backgroundColor: palette.background }]}>
      <Stack.Title>Izmena korisnika</Stack.Title>
      <ActivityIndicator size="large" accessibilityLabel="Učitavanje korisnika" />
    </View>
  );
}

function FormMessage({
  title: heading,
  message,
  onRetry,
}: {
  title: string;
  message?: string;
  onRetry?: () => void;
}) {
  const palette = usePalette();
  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <Stack.Title>Izmena korisnika</Stack.Title>
      <ScreenMessage
        icon={{
          ios: 'person.crop.circle.badge.questionmark',
          android: 'person_off',
          web: 'person_off',
        }}
        title={heading}
        message={message}
        action={onRetry ? { label: 'Pokušaj ponovo', onPress: onRetry } : undefined}
      />
    </View>
  );
}

const ROLE_OPTIONS = [
  { value: 'user', label: ROLE_LABELS.user },
  { value: 'admin', label: ROLE_LABELS.admin },
] as const;

/** What the modal is called: one's own account reads as the profile, as on the web. */
function title(mode: UserFormMode, ownId: number | undefined) {
  if (mode.kind === 'create') return 'Novi korisnik';
  return mode.user.id === ownId ? 'Izmena profila' : 'Izmena korisnika';
}

/**
 * Creates an account (name, surname, email, role — no password: the backend emails an activation
 * link) or edits one's name, surname and email, presented as a modal. The role of an existing
 * account is changed from its own action, never here.
 *
 * Leaving with unsaved changes — Cancel, swipe down, the Android back button or gesture — asks
 * first. After a save the modal closes and the backend's message is shown as a toast.
 */
export function UserFormScreen({ mode }: { mode: UserFormMode }) {
  const ownId = useSessionStore((state) => state.user?.id);
  const initial = mode.kind === 'edit' ? mode.user : undefined;
  const palette = usePalette();
  const navigation = useNavigation();
  const surnameRef = useRef<TextInputRef>(null);
  const emailRef = useRef<TextInputRef>(null);

  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [pendingLeave, setPendingLeave] = useState<PendingAction | null>(null);
  const [confirmedLeave, setConfirmedLeave] = useState<PendingAction | null>(null);
  const form = useUserForm(mode, setSavedMessage);

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
      <Stack.Title style={font('semibold')}>{title(mode, ownId)}</Stack.Title>
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
            testID="user-name"
            defaultValue={initial?.name}
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
            testID="user-surname"
            defaultValue={initial?.surname}
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
            testID="user-email"
            defaultValue={initial?.email}
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

          {mode.kind === 'create' ? (
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: palette.label }]}>Uloga</Text>
              <SegmentedControl
                label="Uloga"
                options={ROLE_OPTIONS}
                value={form.values.role}
                disabled={form.isPending}
                onChange={(role) => form.edit('role', role)}
              />
              {form.fieldError('role') ? (
                <Text style={[styles.fieldError, { color: palette.danger }]}>
                  {form.fieldError('role')}
                </Text>
              ) : null}
            </View>
          ) : null}

          <Host matchContents={{ vertical: true }} style={styles.buttonHost}>
            <Button
              disabled={!form.isDirty || form.isPending}
              onPress={submit}
              testID="user-save"
              style={{ width: '100%' }}>
              <UIText textStyle={{ ...font('semibold'), fontSize: 17 }}>
                {form.isPending ? 'Čuvanje…' : mode.kind === 'create' ? 'Kreiraj' : 'Sačuvaj'}
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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
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
  field: {
    gap: 6,
  },
  fieldLabel: {
    ...font('semibold'),
    fontSize: 15,
  },
  fieldError: {
    ...font(),
    fontSize: 14,
  },
  buttonHost: {
    width: '100%',
    marginTop: 8,
  },
});
