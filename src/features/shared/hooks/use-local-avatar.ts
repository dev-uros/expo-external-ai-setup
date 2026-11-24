import { useState } from 'react';

import { useAvatarPicker, type AvatarEditorState } from '@/features/shared/hooks/use-avatar-picker';
import type { AvatarAsset } from '@/features/shared/schemas/avatar';

/**
 * A picture chosen before there is an account to put it on — registration. Kept on the phone and
 * sent with the registration itself.
 */
export function useLocalAvatar(): AvatarEditorState & { asset: AvatarAsset | null } {
  const [asset, setAsset] = useState<AvatarAsset | null>(null);
  const picker = useAvatarPicker({ onPicked: setAsset, onRemove: () => setAsset(null) });

  return { ...picker, asset, isPending: false, canRemove: asset !== null };
}
