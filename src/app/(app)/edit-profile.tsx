import { useSessionStore } from '@/features/shared/stores/session';
import { EditProfileScreen } from '@/features/profile/screens/edit-profile-screen';

export default function EditProfileRoute() {
  const user = useSessionStore((state) => state.user);
  // Only reachable signed in; the guard in the root layout sees to that.
  return user ? <EditProfileScreen user={user} /> : null;
}
