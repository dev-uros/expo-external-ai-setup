import { Color } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { Platform, ScrollView, StyleSheet, Text } from 'react-native';

const labelColor = Platform.select({
  ios: Color.ios.label,
  android: Color.android.dynamic.onSurface,
});

export default function HomeScreen() {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <Stack.Title large>Backoffice</Stack.Title>
      <Text style={[styles.text, { color: labelColor }]}>
        Expo Router is set up. Routes live in src/app/.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  text: {
    fontSize: 17,
  },
});
