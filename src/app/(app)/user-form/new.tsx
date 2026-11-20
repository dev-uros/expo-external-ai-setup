import { UserFormScreen } from '@/features/users/screens/user-form-screen';

export default function NewUserRoute() {
  return <UserFormScreen mode={{ kind: 'create' }} />;
}
