import { useLocalSearchParams } from 'expo-router';

import { parseUserId } from '@/features/users/schemas/route-params';
import { UserDetailScreen } from '@/features/users/screens/user-detail-screen';

export default function UserRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <UserDetailScreen id={parseUserId(id)} />;
}
