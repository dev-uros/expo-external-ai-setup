import { AppearanceSection } from '@/features/appearance/components/appearance-section';
import { SignOutSection } from '@/features/auth/components/sign-out-section';
import { NotificationsSection } from '@/features/notifications/components/notifications-section';
import { ProfileScreen } from '@/features/profile/screens/profile-screen';

export default function ProfileRoute() {
  return (
    <ProfileScreen
      footer={
        <>
          <AppearanceSection />
          <NotificationsSection />
          <SignOutSection />
        </>
      }
    />
  );
}
