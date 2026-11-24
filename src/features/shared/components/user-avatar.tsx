import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { initials } from '@/features/shared/utils/initials';
import { usePalette } from '@/features/shared/hooks/use-palette';
import { font } from '@/features/shared/utils/typography';

interface UserAvatarProps {
  /** What the person is called — the label, and the initial when there is no picture. */
  name: string;
  /** From the API; `null` means the user has no picture. */
  url: string | null;
  size?: number;
}

/**
 * The profile picture, or the person's initial when there is none — or when the picture fails
 * to load, so a broken URL never leaves an empty circle.
 */
export function UserAvatar({ name, url, size = 64 }: UserAvatarProps) {
  const palette = usePalette();
  const [failed, setFailed] = useState(false);
  const circle = { width: size, height: size, borderRadius: size / 2 };
  const label = name;

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
        {initials(name)}
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
