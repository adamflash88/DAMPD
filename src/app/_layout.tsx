import { DarkTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useHydrated } from '../data';
import { colors } from '../theme/tokens';

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.background,
    card: colors.surface1,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.accent,
  },
};

export default function RootLayout() {
  const hydrated = useHydrated();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navTheme}>
        <StatusBar style="light" />
        {hydrated ? (
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.surface1 },
              headerTintColor: colors.textPrimary,
              headerTitleStyle: { fontWeight: '700' },
              headerBackButtonDisplayMode: 'minimal',
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="bike/new" options={{ title: 'Add bike', presentation: 'modal' }} />
            <Stack.Screen name="bike/[id]/edit" options={{ title: 'Edit bike', presentation: 'modal' }} />
            <Stack.Screen name="bike/[id]/suspension" options={{ title: 'Suspension profile' }} />
            <Stack.Screen name="session/[id]/index" options={{ title: 'Session' }} />
            <Stack.Screen name="session/[id]/adjust" options={{ title: 'Log adjustment', presentation: 'modal' }} />
            <Stack.Screen name="session/compare" options={{ title: 'Compare sessions' }} />
          </Stack>
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
            <ActivityIndicator color={colors.accent} />
          </View>
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
