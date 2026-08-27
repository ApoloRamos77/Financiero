import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User, DashboardSummary, Venture, Category, Account, Contributor, Alert } from '../types';

// ─── Auth Store ───────────────────────────────────────────────
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isOnboardingComplete: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  setOnboardingComplete: () => Promise<void>;
  clearAuth: () => Promise<void>;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isOnboardingComplete: false,
  isLoading: true,

  setAuth: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    // New registrations start with onboarding pending
    set({ user, accessToken, isAuthenticated: true, isOnboardingComplete: false, isLoading: false });
  },

  setOnboardingComplete: async () => {
    await SecureStore.setItemAsync('onboardingComplete', 'true');
    set({ isOnboardingComplete: true });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('user');
    await SecureStore.deleteItemAsync('onboardingComplete');
    set({ user: null, accessToken: null, isAuthenticated: false, isOnboardingComplete: false, isLoading: false });
  },

  initAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      const userStr = await SecureStore.getItemAsync('user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        const onboardingDone = await SecureStore.getItemAsync('onboardingComplete');
        set({
          user,
          accessToken: token,
          isAuthenticated: true,
          isOnboardingComplete: onboardingDone === 'true',
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));

// ─── App Data Store ───────────────────────────────────────────
interface AppDataState {
  // Dashboard
  dashboardSummary: DashboardSummary | null;
  setDashboardSummary: (summary: DashboardSummary) => void;

  // Master data
  contributors: Contributor[];
  ventures: Venture[];
  categories: Category[];
  accounts: Account[];
  alerts: Alert[];

  setContributors: (items: Contributor[]) => void;
  setVentures: (items: Venture[]) => void;
  setCategories: (items: Category[]) => void;
  setAccounts: (items: Account[]) => void;
  setAlerts: (items: Alert[]) => void;

  // UI State
  selectedMonth: number;
  selectedYear: number;
  setSelectedPeriod: (year: number, month: number) => void;

  // FAB
  fabVisible: boolean;
  setFabVisible: (visible: boolean) => void;

  // Theme
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const useAppStore = create<AppDataState>((set) => ({
  dashboardSummary: null,
  setDashboardSummary: (summary) => set({ dashboardSummary: summary }),

  contributors: [],
  ventures: [],
  categories: [],
  accounts: [],
  alerts: [],

  setContributors: (items) => set({ contributors: items }),
  setVentures: (items) => set({ ventures: items }),
  setCategories: (items) => set({ categories: items }),
  setAccounts: (items) => set({ accounts: items }),
  setAlerts: (items) => set({ alerts: items }),

  selectedMonth: new Date().getMonth() + 1,
  selectedYear: new Date().getFullYear(),
  setSelectedPeriod: (year, month) => set({ selectedYear: year, selectedMonth: month }),

  fabVisible: true,
  setFabVisible: (visible) => set({ fabVisible: visible }),

  isDarkMode: true,
  toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}));

// ─── Helpers ──────────────────────────────────────────────────
export const flatCategories = (cats: Category[]): Category[] => {
  const result: Category[] = [];
  const flatten = (list: Category[]) => {
    list.forEach(cat => {
      result.push(cat);
      if (cat.children?.length) flatten(cat.children);
    });
  };
  flatten(cats);
  return result;
};
