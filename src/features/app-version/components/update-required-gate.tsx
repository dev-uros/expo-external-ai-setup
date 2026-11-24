import * as SplashScreen from 'expo-splash-screen';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Linking, ScrollView, StyleSheet } from 'react-native';

import { installedAppVersion } from '@/lib/device';
import { ScreenMessage } from '@/features/shared/components/screen-message';
import { usePalette } from '@/features/shared/hooks/use-palette';
import { useAppVersionPolicyQuery } from '@/features/app-version/query/use-app-version-query';
import { isOlderThan } from '@/features/app-version/utils/versions';

/**
 * Stops an app the server no longer supports (`minimum_version`, set in the API's `.env`): it
 * shows only "update required", signed in or not. Until the answer arrives — and when it cannot
 * arrive (offline, server down) — the app runs: being unreachable must not lock anyone out.
 */
export function UpdateRequiredGate({ children }: { children: ReactNode }) {
  const { data } = useAppVersionPolicyQuery();
  const installed = installedAppVersion();
  const required = data ? isOlderThan(installed, data.minimum_version) : false;

  if (!required) return children;
  return <UpdateRequiredScreen installed={installed} storeUrl={data?.store_url ?? null} />;
}

function UpdateRequiredScreen({
  installed,
  storeUrl,
}: {
  installed: string | null;
  storeUrl: string | null;
}) {
  const palette = usePalette();

  // The navigator that normally hides the splash screen is not mounted.
  useEffect(() => {
    SplashScreen.hide();
  }, []);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.fill}>
      <ScreenMessage
        testID="update-required"
        icon={{ ios: 'arrow.down.app', android: 'system_update', web: 'system_update' }}
        title="Potrebno je ažuriranje"
        message={[
          installed
            ? `Verzija ${installed} se više ne može koristiti.`
            : 'Ova verzija se više ne može koristiti.',
          storeUrl
            ? 'Instalirajte najnoviju verziju da biste nastavili.'
            : 'Obratite se administratoru za najnoviju verziju.',
        ].join(' ')}
        action={
          storeUrl
            ? { label: 'Ažuriraj', onPress: () => void Linking.openURL(storeUrl) }
            : undefined
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flexGrow: 1,
  },
});
