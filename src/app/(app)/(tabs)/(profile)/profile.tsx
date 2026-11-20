import { SignOutSection } from '@/features/auth/components/sign-out-section';
import { ProfileScreen } from '@/features/profile/screens/profile-screen';

/**
 * The one place two features meet: the profile feature's screen, with the auth feature's
 * sign-out under the account. Features never import each other; a route may compose them.
 */
export default function ProfileRoute() {
  return <ProfileScreen footer={<SignOutSection />} />;
}
