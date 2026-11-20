import { HomeScreen } from '@/features/home/screens/home-screen';
import { ShortcutsSection } from '@/features/shortcuts/components/shortcuts-section';
import { useUserNames } from '@/features/users/hooks/use-user-names';

/** The home screen, with the shortcuts under the greeting — named with the users feature's help. */
export default function HomeRoute() {
  const nameOf = useUserNames();

  return (
    <HomeScreen>
      <ShortcutsSection nameOf={nameOf} />
    </HomeScreen>
  );
}
