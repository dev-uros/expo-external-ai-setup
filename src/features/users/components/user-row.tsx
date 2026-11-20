import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { UserAvatar } from '@/features/shared/components/user-avatar';
import type { User } from '@/features/shared/schemas/user';
import { labelColor, secondaryLabelColor } from '@/features/shared/utils/colors';
import { font } from '@/features/shared/utils/typography';
import { STATUS_LABELS, fullName, userStatus } from '@/features/shared/utils/user';
import { UserStatusBadge } from '@/features/users/components/user-status-badge';

/**
 * One account in the list. The whole row is a single link (`Link` gives it that role) that opens
 * the account — read out by screen readers as name, email and status in one go.
 */
export function UserRow({ user }: { user: User }) {
  const name = fullName(user);

  return (
    <Link href={{ pathname: '/users/[id]', params: { id: String(user.id) } }} asChild>
      {/* `Link` cannot merge a style function into its child, so the pressed look is drawn by
          the content instead of the Pressable's own `style`. */}
      <Pressable
        accessibilityLabel={`${name}, ${user.email}, ${STATUS_LABELS[userStatus(user)]}`}
        android_ripple={{ color: 'rgba(127,127,127,0.2)' }}>
        {({ pressed }) => (
          <View style={[styles.row, pressed && process.env.EXPO_OS === 'ios' && styles.pressed]}>
            <UserAvatar name={user.name} surname={user.surname} url={user.avatar_url} size={44} />
            <View style={styles.text}>
              <Text numberOfLines={1} style={[styles.name, { color: labelColor }]}>
                {name}
              </Text>
              <Text numberOfLines={1} style={[styles.email, { color: secondaryLabelColor }]}>
                {user.email}
              </Text>
              <UserStatusBadge user={user} />
            </View>
            {process.env.EXPO_OS === 'ios' ? (
              <SymbolView name="chevron.right" size={14} tintColor={secondaryLabelColor} />
            ) : null}
          </View>
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pressed: {
    opacity: 0.6,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...font('semibold'),
    fontSize: 17,
  },
  email: {
    ...font(),
    fontSize: 15,
  },
});
