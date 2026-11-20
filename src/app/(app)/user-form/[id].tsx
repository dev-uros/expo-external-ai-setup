import { useLocalSearchParams } from 'expo-router';

import { parseUserId } from '@/features/users/schemas/route-params';
import { EditUserScreen } from '@/features/users/screens/user-form-screen';

export default function EditUserRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditUserScreen id={parseUserId(id)} />;
}
