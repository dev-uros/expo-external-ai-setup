import { useLocalSearchParams } from 'expo-router';

import { parseUserId } from '@/features/users/schemas/route-params';
import { UserLoginsScreen } from '@/features/users/screens/user-history-screens';

export default function UserLoginsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <UserLoginsScreen id={parseUserId(id)} />;
}
