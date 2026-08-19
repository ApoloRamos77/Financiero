// ============================================================
// FamilyFinance Pro - Design System Constants
// ============================================================

export const Colors = {
  // Brand
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',

  // Financial
  income: '#10B981',
  incomeLight: '#34D399',
  incomeBg: 'rgba(16, 185, 129, 0.15)',
  expense: '#EF4444',
  expenseLight: '#F87171',
  expenseBg: 'rgba(239, 68, 68, 0.15)',
  savings: '#3B82F6',
  savingsBg: 'rgba(59, 130, 246, 0.15)',
  venture: '#F59E0B',
  ventureBg: 'rgba(245, 158, 11, 0.15)',

  // Backgrounds (Dark Mode)
  bg: '#0F172A',
  bgSecondary: '#1E293B',
  surface: '#1E293B',
  surfaceHigh: '#334155',
  border: '#334155',
  borderLight: '#475569',

  // Text
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0F172A',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // Cards / Glass
  card: 'rgba(30, 41, 59, 0.95)',
  glass: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.7)',
  modalBg: 'rgba(15, 23, 42, 0.95)',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const Gradients = {
  primary: ['#6366F1', '#8B5CF6'],
  income: ['#10B981', '#059669'],
  expense: ['#EF4444', '#DC2626'],
  savings: ['#3B82F6', '#1D4ED8'],
  venture: ['#F59E0B', '#D97706'],
  dark: ['#0F172A', '#1E293B'],
  card: ['#1E293B', '#0F172A'],
};

export const Typography = {
  fontFamily: 'System',
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
};

export const CATEGORY_ICONS: Record<string, string> = {
  'Salario': '💼',
  'Bonificación': '🎁',
  'Freelance': '💻',
  'Emprendimiento': '🏪',
  'Inversión': '📈',
  'Otro ingreso': '➕',
  'Alimentación': '🛒',
  'Vivienda': '🏠',
  'Transporte': '🚗',
  'Educación': '📚',
  'Salud': '❤️',
  'Entretenimiento': '🎵',
  'Servicios': '⚡',
  'Ropa': '👜',
  'Deudas': '💳',
  'Otros gastos': '•••',
};

export const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Efectivo', icon: '💵' },
  { value: 'BankTransfer', label: 'Transferencia', icon: '🏦' },
  { value: 'CreditCard', label: 'Tarjeta Crédito', icon: '💳' },
  { value: 'DebitCard', label: 'Tarjeta Débito', icon: '💳' },
  { value: 'Yape', label: 'Yape', icon: '📱' },
  { value: 'Plin', label: 'Plin', icon: '📱' },
  { value: 'Other', label: 'Otro', icon: '💸' },
];

export const ACCOUNT_TYPES = [
  { value: 'Cash', label: 'Efectivo', icon: '💵' },
  { value: 'BankAccount', label: 'Cuenta Bancaria', icon: '🏦' },
  { value: 'CreditCard', label: 'Tarjeta Crédito', icon: '💳' },
  { value: 'DebitCard', label: 'Tarjeta Débito', icon: '💳' },
  { value: 'DigitalWallet', label: 'Billetera Digital', icon: '📱' },
  { value: 'Other', label: 'Otro', icon: '💸' },
];

export const GOAL_TYPES = [
  { value: 'EmergencyFund', label: 'Fondo de Emergencia', icon: '🛡️' },
  { value: 'Vehicle', label: 'Vehículo', icon: '🚗' },
  { value: 'Travel', label: 'Viaje', icon: '✈️' },
  { value: 'Education', label: 'Educación', icon: '📚' },
  { value: 'Housing', label: 'Vivienda', icon: '🏠' },
  { value: 'Investment', label: 'Inversión', icon: '📈' },
  { value: 'Other', label: 'Otro', icon: '🎯' },
];

export const CONTRIBUTOR_TYPES = [
  { value: 'Salary', label: 'Salario' },
  { value: 'Freelance', label: 'Freelance' },
  { value: 'Business', label: 'Negocio' },
  { value: 'Investment', label: 'Inversión' },
  { value: 'Other', label: 'Otro' },
];

export const VENTURE_STATUS = [
  { value: 'Active', label: 'Activo' },
  { value: 'Inactive', label: 'Inactivo' },
  { value: 'Suspended', label: 'Suspendido' },
];

export const API_URL = 'http://localhost:5000/api';
