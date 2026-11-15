import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Tabs } from 'expo-router/tabs';

import { useActiveSessions } from '../../data';
import { colors } from '../../theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused, size }: { name: IconName; focused: boolean; size: number }) {
  return <Ionicons name={name} color={focused ? colors.accent : colors.textTertiary} size={size} />;
}

const icon = (outline: IconName, filled: IconName) => {
  const renderIcon = ({ focused, size }: { focused: boolean; size: number }) => (
    <TabIcon name={focused ? filled : outline} focused={focused} size={size - 2} />
  );
  renderIcon.displayName = `TabIcon(${filled})`;
  return renderIcon;
};

export default function TabsLayout() {
  const live = useActiveSessions().length > 0;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontWeight: '600', fontSize: 11 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen name="garage" options={{ title: 'Garage', tabBarIcon: icon('construct-outline', 'construct') }} />
      <Tabs.Screen
        name="tune"
        options={{
          title: 'Tune',
          tabBarIcon: icon('options-outline', 'options'),
          tabBarBadge: live ? '' : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent, minWidth: 8, maxHeight: 8, borderRadius: 4, marginTop: 4 },
          tabBarAccessibilityLabel: live ? 'Tune, session in progress' : 'Tune',
        }}
      />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: icon('time-outline', 'time') }} />
    </Tabs>
  );
}
