import { useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';

import { ApiError } from '@/lib/http';
import { pushConfigured } from '@/lib/notifications';
import type { Device } from '@/features/shared/schemas/device';
import { useToastStore } from '@/features/shared/stores/toast';
import {
  useCurrentDeviceQuery,
  usePushPermissionQuery,
  useSyncPushMutation,
  useTestPushMutation,
} from '@/features/notifications/query/use-notifications-queries';

/**
 * - `enabled`: allowed, and the server holds this phone's token — a test can be sent;
 * - `unconfigured`: allowed, but this build has no EAS project, so there is no token to send to;
 * - `unregistered`: allowed and configured, but the token never reached the server — try again;
 * - `disabled`: not allowed, and the system can still ask;
 * - `blocked`: refused for good — only the settings app can change it.
 */
export type NotificationsState =
  'loading' | 'error' | 'enabled' | 'unconfigured' | 'unregistered' | 'disabled' | 'blocked';

export const NOTIFICATION_TEXTS: Record<NotificationsState, string> = {
  loading: 'Učitavanje…',
  error: 'Podaci o uređaju trenutno nisu dostupni.',
  enabled: 'Uključena na ovom uređaju.',
  unconfigured: 'Dozvoljena, ali slanje obaveštenja još nije podešeno za ovu aplikaciju.',
  unregistered: 'Dozvoljena, ali uređaj još nije prijavljen za obaveštenja.',
  disabled: 'Isključena na ovom uređaju.',
  blocked: 'Isključena. Uključite ih u podešavanjima telefona.',
};

export interface NotificationsAction {
  label: string;
  onPress: () => void;
  pending: boolean;
}

/** "iPhone 17 Pro · iOS 27.2" — what the server recorded about this phone. */
export function describeDevice(device: Device): string {
  const system = [device.operating_system, device.os_version].filter(Boolean).join(' ');
  return [device.name, system].filter(Boolean).join(' · ');
}

/**
 * Everything the profile's "Obaveštenja" section shows and does: the system permission, and the
 * server's record of this phone (does it hold a push token?).
 *
 * Coming back to the app — from the settings app, typically — re-reads the permission, and a
 * change is sent to the server at once: switched on in settings means a token to store, switched
 * off means one to clear.
 */
export function useNotificationsSection() {
  const device = useCurrentDeviceQuery();
  const permission = usePushPermissionQuery();
  const sync = useSyncPushMutation();
  const testPush = useTestPushMutation();
  const [error, setError] = useState<string | null>(null);

  const granted = permission.data?.granted;
  const lastGranted = useRef(granted);
  const { mutate: syncNow } = sync;
  const { refetch: refetchPermission } = permission;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (status !== 'active') return;
      void refetchPermission().then(({ data }) => {
        if (data && lastGranted.current !== undefined && data.granted !== lastGranted.current) {
          syncNow({ prompt: false });
        }
      });
    });
    return () => subscription.remove();
  }, [refetchPermission, syncNow]);

  useEffect(() => {
    lastGranted.current = granted;
  }, [granted]);

  const state: NotificationsState =
    device.isPending || permission.isPending
      ? 'loading'
      : device.isError
        ? 'error'
        : permission.data?.granted
          ? device.data.push_notifications_enabled
            ? 'enabled'
            : pushConfigured()
              ? 'unregistered'
              : 'unconfigured'
          : permission.data?.canAskAgain === false
            ? 'blocked'
            : 'disabled';

  const fail = (failure: unknown) =>
    setError(failure instanceof ApiError ? failure.message : 'Došlo je do greške.');

  const askAgain = (label: string): NotificationsAction => ({
    label: sync.isPending ? 'Uključivanje…' : label,
    pending: sync.isPending,
    onPress: () => {
      setError(null);
      sync.mutate({ prompt: true }, { onError: fail });
    },
  });

  let action: NotificationsAction | null = null;
  if (state === 'enabled') {
    action = {
      label: testPush.isPending ? 'Slanje…' : 'Pošalji probno obaveštenje',
      pending: testPush.isPending,
      onPress: () => {
        setError(null);
        testPush.mutate(undefined, {
          onSuccess: ({ message }) => useToastStore.getState().show(message),
          onError: fail,
        });
      },
    };
  } else if (state === 'disabled') {
    action = askAgain('Uključi obaveštenja');
  } else if (state === 'unregistered') {
    action = askAgain('Pokušaj ponovo');
  } else if (state === 'blocked') {
    action = {
      label: 'Otvori podešavanja',
      pending: false,
      onPress: () => void Linking.openSettings(),
    };
  } else if (state === 'error') {
    action = { label: 'Pokušaj ponovo', pending: false, onPress: () => void device.refetch() };
  }

  return {
    state,
    status: NOTIFICATION_TEXTS[state],
    deviceLine: device.data ? describeDevice(device.data) : null,
    action,
    error,
  };
}
