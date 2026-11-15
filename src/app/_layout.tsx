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
    card: colors.background,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.accent,
  },
};

/** Consistent native headers for every pushed/modal screen. */
const stackOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.accent,
  headerTitleStyle: { color: colors.textPrimary, fontWeight: '700' as const, fontSize: 17 },
  headerShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal' as const,
  contentStyle: { backgroundColor: colors.background },
};

const modal = { presentation: 'modal' as const };

export default function RootLayout() {
  const hydrated = useHydrated();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navTheme}>
        <StatusBar style="light" />
        {hydrated ? (
          <Stack screenOptions={stackOptions}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Home' }} />
            <Stack.Screen name="settings" options={{ ...modal, title: 'Rider profile' }} />
            <Stack.Screen name="bike/new" options={{ ...modal, title: 'Add motorcycle' }} />
            <Stack.Screen name="bike/switch" options={{ ...modal, title: 'Switch motorcycle' }} />
            <Stack.Screen name="bike/[id]/index" options={{ title: 'Motorcycle' }} />
            <Stack.Screen name="bike/[id]/edit" options={{ ...modal, title: 'Edit motorcycle' }} />
            <Stack.Screen name="bike/[id]/suspension" options={{ title: 'Suspension' }} />
            <Stack.Screen name="bike/[id]/adjusters" options={{ ...modal, title: 'Adjusters' }} />
            <Stack.Screen name="bike/[id]/setups" options={{ title: 'Saved setups' }} />
            <Stack.Screen name="session/[id]/index" options={{ title: 'Session' }} />
            <Stack.Screen name="session/[id]/feedback" options={{ ...modal, title: 'Log feedback' }} />
            <Stack.Screen name="session/[id]/adjust" options={{ ...modal, title: 'Record adjustment' }} />
            <Stack.Screen name="session/[id]/conditions" options={{ ...modal, title: 'Track conditions' }} />
            <Stack.Screen name="compare" options={{ title: 'Compare' }} />
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
