import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Tabs } from 'expo-router/tabs';

import { colors } from '../../theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused, size }: { name: IconName; focused: boolean; size: number }) {
  return <Ionicons name={name} color={focused ? colors.accent : colors.textMuted} size={size} />;
}

const icon = (name: IconName) => {
  const renderIcon = (p: { focused: boolean; size: number }) => <TabIcon name={name} {...p} />;
  renderIcon.displayName = `TabIcon(${name})`;
  return renderIcon;
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface1, borderTopColor: colors.border },
        tabBarLabelStyle: { fontWeight: '600' },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('speedometer-outline') }} />
      <Tabs.Screen name="garage" options={{ title: 'Garage', tabBarIcon: icon('construct-outline') }} />
      <Tabs.Screen name="session" options={{ title: 'Session', tabBarIcon: icon('flag-outline') }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: icon('time-outline') }} />
    </Tabs>
  );
}
