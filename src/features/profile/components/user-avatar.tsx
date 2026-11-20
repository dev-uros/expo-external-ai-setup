import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { initials } from '@/features/profile/utils/initials';
import { usePalette } from '@/features/shared/hooks/use-palette';
import { font } from '@/features/shared/utils/typography';

interface UserAvatarProps {
  name: string;
  surname: string;
  /** From the API; `null` means the user has no picture. */
  url: string | null;
  size?: number;
}

/**
 * The profile picture, or the user's initials when there is none — or when the picture fails
 * to load, so a broken URL never leaves an empty circle.
 */
export function UserAvatar({ name, surname, url, size = 64 }: UserAvatarProps) {
  const palette = usePalette();
  const [failed, setFailed] = useState(false);
  const circle = { width: size, height: size, borderRadius: size / 2 };
  const label = `${name} ${surname}`;

  if (url !== null && !failed) {
    return (
      <Image
        source={url}
        style={circle}
        contentFit="cover"
        transition={150}
        accessibilityLabel={label}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={[styles.fallback, circle, { backgroundColor: palette.avatarBackground }]}>
      <Text
        style={[styles.initials, { color: palette.avatarText, fontSize: size * 0.38 }]}
        allowFontScaling={false}>
        {initials(name, surname)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    ...font('semibold'),
  },
});
