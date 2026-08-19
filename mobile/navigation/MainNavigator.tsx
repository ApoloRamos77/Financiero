import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, BorderRadius, Shadows } from '../constants/theme';

// Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import MovementsScreen from '../screens/movements/MovementsScreen';
import VenturesScreen from '../screens/ventures/VenturesScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import MoreScreen from '../screens/more/MoreScreen';

export type MainTabParamList = {
  Dashboard: undefined;
  Movements: undefined;
  Ventures: undefined;
  Calendar: undefined;
  More: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// Tab icons as emoji (replace with vector icons in production)
const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Dashboard: { active: '🏠', inactive: '🏠' },
  Movements: { active: '📋', inactive: '📋' },
  Ventures: { active: '🏪', inactive: '🏪' },
  Calendar: { active: '📅', inactive: '📅' },
  More: { active: '⚙️', inactive: '⚙️' },
};

const TAB_LABELS: Record<string, string> = {
  Dashboard: 'Inicio',
  Movements: 'Movimientos',
  Ventures: 'Negocios',
  Calendar: 'Calendario',
  More: 'Más',
};

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom + 4 }]}>
      {/* Tab items */}
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const icon = TAB_ICONS[route.name];
        const label = TAB_LABELS[route.name];

        // Insert FAB in the middle (between index 1 and 2)
        const isMiddle = index === 2;

        return (
          <React.Fragment key={route.key}>
            {isMiddle && (
              <View style={styles.fabWrapper}>
                <TouchableOpacity
                  style={styles.fab}
                  onPress={() => {
                    // Show income/expense picker
                    nav.navigate('Income');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.fabIcon}>+</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              key={route.key}
              style={styles.tabItem}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabIcon, isFocused && styles.tabIconActive]}>
                {icon.active}
              </Text>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {label}
              </Text>
              {isFocused && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          </React.Fragment>
        );
      })}
    </View>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Movements" component={MovementsScreen} />
      <Tab.Screen name="Ventures" component={VenturesScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
    paddingHorizontal: 4,
    ...Shadows.md,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    top: -8,
    width: 32,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  fabWrapper: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Shadows.lg,
  },
  fabIcon: {
    fontSize: 28,
    color: Colors.white,
    fontWeight: '300',
    lineHeight: 32,
  },
});
