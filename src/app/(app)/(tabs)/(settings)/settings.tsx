import { AboutSection } from '@/features/account/components/about-section';
import { DeleteAccountSection } from '@/features/account/components/delete-account-section';
import { SettingsScreen } from '@/features/account/screens/settings-screen';
import { AppearanceSection } from '@/features/appearance/components/appearance-section';
import { SignOutSection } from '@/features/auth/components/sign-out-section';
import { endSession } from '@/features/auth/session';
import { LanguageSection } from '@/features/language/components/language-section';
import { NotificationsSection } from '@/features/notifications/components/notifications-section';

/** Settings: the account, then each feature's section — the route is where features meet. */
export default function SettingsRoute() {
  return (
    <SettingsScreen
      footer={
        <>
          <LanguageSection />
          <AppearanceSection />
          <NotificationsSection />
          <AboutSection />
          <SignOutSection />
          <DeleteAccountSection onDeleted={() => endSession()} />
        </>
      }
    />
  );
}
