import { Link, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePalette } from '@/features/shared/hooks/use-palette';
import { font } from '@/features/shared/utils/typography';
import { useShortcutsStore } from '@/features/shortcuts/stores/shortcuts';
import { SHOWN, describe, rankVisits, visitLabel } from '@/features/shortcuts/utils/history';

interface ShortcutsSectionProps {
  /**
   * The name of the person a screen is about — only the users feature knows it, so the route
   * passes it in. `undefined` until it is known; the screen's own title stands in meanwhile.
   */
  nameOf?: (userId: number) => string | undefined;
}

/**
 * "Prečice" on the home screen: the screens this person opens most, or a sentence saying they
 * will gather here. A fresh account has none — that is the normal state, not an error.
 * Forgetting is offered because the history is kept on the phone.
 */
export function ShortcutsSection({ nameOf }: ShortcutsSectionProps) {
  const palette = usePalette();
  const visits = useShortcutsStore((state) => state.visits);
  const clear = useShortcutsStore((state) => state.clear);

  const shortcuts = rankVisits(visits)
    .flatMap((visit) => {
      const destination = describe(visit.path);
      if (!destination) return [];
      const name = destination.userId === undefined ? undefined : nameOf?.(destination.userId);
      const label =
        name === undefined
          ? destination.title
          : destination.title === 'Korisnik'
            ? name
            : `${destination.title} · ${name}`;
      return [{ ...visit, label, icon: destination.icon }];
    })
    .slice(0, SHOWN);

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <View style={styles.headingText}>
          <Text accessibilityRole="header" style={[styles.title, { color: palette.label }]}>
            Prečice
          </Text>
          <Text style={[styles.hint, { color: palette.secondaryLabel }]}>
            Ekrani na koje se najčešće vraćate.
          </Text>
        </View>
        {shortcuts.length > 0 ? (
          <Pressable accessibilityRole="button" onPress={clear} hitSlop={8}>
            <Text style={[styles.clear, { color: palette.avatarText }]}>Obriši prečice</Text>
          </Pressable>
        ) : null}
      </View>

      {shortcuts.length === 0 ? (
        <Text style={[styles.empty, { color: palette.secondaryLabel }]}>
          Ovde se same skupljaju ekrani koje najčešće otvarate — koristite aplikaciju i prečice će
          se pojaviti.
        </Text>
      ) : (
        <View style={styles.grid}>
          {shortcuts.map((shortcut) => (
            <Link key={shortcut.path} href={shortcut.path as Href} asChild>
              <Pressable
                accessibilityLabel={`${shortcut.label}, ${visitLabel(shortcut.visits)}`}
                android_ripple={{ color: 'rgba(127,127,127,0.2)' }}
                // `Link` passes its child's style through as is: one object, not an array.
                style={StyleSheet.flatten([
                  styles.tile,
                  { backgroundColor: palette.cardBackground },
                ])}>
                {/* The tile is one element with one label (name and visits); its parts are not
                    read, or found, separately — on Android they would otherwise be. */}
                <View importantForAccessibility="no-hide-descendants" style={styles.tileContent}>
                  <SymbolView name={shortcut.icon} size={24} tintColor={palette.avatarText} />
                  <Text numberOfLines={2} style={[styles.tileLabel, { color: palette.label }]}>
                    {shortcut.label}
                  </Text>
                  <Text style={[styles.tileMeta, { color: palette.secondaryLabel }]}>
                    {visitLabel(shortcut.visits)}
                  </Text>
                </View>
              </Pressable>
            </Link>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headingText: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...font('semibold'),
    fontSize: 20,
  },
  hint: {
    ...font(),
    fontSize: 15,
  },
  clear: {
    ...font('medium'),
    fontSize: 15,
  },
  empty: {
    ...font(),
    fontSize: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 16,
    padding: 14,
    gap: 6,
    overflow: 'hidden',
  },
  tileContent: {
    gap: 6,
  },
  tileLabel: {
    ...font('semibold'),
    fontSize: 16,
  },
  tileMeta: {
    ...font(),
    fontSize: 13,
  },
});
