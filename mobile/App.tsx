import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from './store';
import { Colors } from './constants/theme';

// Screens
import LoginScreen from './screens/auth/LoginScreen';
import SetupScreen from './screens/auth/SetupScreen';
import OnboardingScreen from './screens/auth/OnboardingScreen';
import ChangePasswordScreen from './screens/auth/ChangePasswordScreen';
import DashboardScreen from './screens/dashboard/DashboardScreen';
import MainNavigator from './navigation/MainNavigator';
import IncomeScreen from './screens/movements/IncomeScreen';
import ExpenseScreen from './screens/movements/ExpenseScreen';
import MovementDetailScreen from './screens/movements/MovementDetailScreen';
import VentureDetailScreen from './screens/ventures/VentureDetailScreen';
import ContributorDetailScreen from './screens/contributors/ContributorDetailScreen';
import GoalDetailScreen from './screens/goals/GoalDetailScreen';

export type RootStackParamList = {
  Login: undefined;
  Setup: undefined;
  Onboarding: undefined;
  Main: undefined;
  Income: { movementId?: string };
  Expense: { movementId?: string };
  MovementDetail: { movementId: string };
  VentureDetail: { ventureId: string };
  ContributorDetail: { contributorId: string };
  GoalDetail: { goalId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function App() {
  const { user, isAuthenticated, isOnboardingComplete, isLoading, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, []);

  if (isLoading) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer
            theme={{
              dark: true,
              colors: {
                primary: Colors.primary,
                background: Colors.bg,
                card: Colors.surface,
                text: Colors.text,
                border: Colors.border,
                notification: Colors.expense,
              },
              fonts: {
                regular: { fontFamily: 'System', fontWeight: '400' },
                medium: { fontFamily: 'System', fontWeight: '500' },
                bold: { fontFamily: 'System', fontWeight: '700' },
                heavy: { fontFamily: 'System', fontWeight: '800' },
              },
            }}
          >
            <StatusBar style="light" backgroundColor={Colors.bg} />
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.bg },
                animation: 'slide_from_right',
              }}
            >
              {!isAuthenticated ? (
                // ── Estado 1: No autenticado ──────────────────
                <>
                  <Stack.Screen name="Login" component={LoginScreen} />
                  <Stack.Screen name="Setup" component={SetupScreen} />
                </>
              ) : !isOnboardingComplete && user?.role === 'Admin' ? (
                // ── Estado 2: Autenticado, onboarding pendiente
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
              ) : user?.mustChangePassword ? (
                // ── Estado 3: Contraseña por cambiar ────
                <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
              ) : (
                // ── Estado 4: Listo, ir a la app principal ────
                <>
                  <Stack.Screen name="Main" component={MainNavigator} />
                  <Stack.Screen
                    name="Income"
                    component={IncomeScreen}
                    options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
                  />
                  <Stack.Screen
                    name="Expense"
                    component={ExpenseScreen}
                    options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
                  />
                  <Stack.Screen name="MovementDetail" component={MovementDetailScreen} />
                  <Stack.Screen name="VentureDetail" component={VentureDetailScreen} />
                  <Stack.Screen name="ContributorDetail" component={ContributorDetailScreen} />
                  <Stack.Screen name="GoalDetail" component={GoalDetailScreen} />
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

