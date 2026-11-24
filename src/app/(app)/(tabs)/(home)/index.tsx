import { refreshAccount } from '@/features/auth/session';
import { HomeScreen } from '@/features/home/screens/home-screen';

export default function HomeRoute() {
  return <HomeScreen onRefresh={refreshAccount} />;
}
