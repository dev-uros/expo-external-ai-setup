import { useLocalSearchParams } from 'expo-router';

import { parseUserId } from '@/features/users/schemas/route-params';
import { UserLogsScreen } from '@/features/users/screens/user-history-screens';

export default function UserLogsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <UserLogsScreen id={parseUserId(id)} />;
}
