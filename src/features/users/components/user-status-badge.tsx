import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { usePalette, type Palette } from '@/features/shared/hooks/use-palette';
import type { User } from '@/features/shared/schemas/user';
import { font } from '@/features/shared/utils/typography';
import { STATUS_LABELS, userStatus, type UserStatus } from '@/features/shared/utils/user';

function colors(status: UserStatus, palette: Palette) {
  switch (status) {
    case 'active':
      return { color: palette.success, backgroundColor: palette.successBackground };
    case 'pending':
      return { color: palette.warning, backgroundColor: palette.warningBackground };
    case 'deactivated':
      return { color: palette.danger, backgroundColor: palette.dangerBackground };
  }
}

/**
 * Active, not yet activated, or switched off — the same three states and words as the web.
 * It sizes to its text and sits at the start of its row; `style` places it elsewhere.
 */
export function UserStatusBadge({ user, style }: { user: User; style?: StyleProp<ViewStyle> }) {
  const palette = usePalette();
  const status = userStatus(user);
  const { color, backgroundColor } = colors(status, palette);

  return (
    <View style={[styles.badge, { backgroundColor }, style]}>
      <Text style={[styles.label, { color }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  label: {
    ...font('medium'),
    fontSize: 13,
  },
});
