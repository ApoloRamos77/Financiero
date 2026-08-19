import { Colors } from '../constants/theme';

// ─── Currency formatting ──────────────────────────────────────
export const formatCurrency = (amount: number, symbol = 'S/', decimals = 2): string => {
  const formatted = Math.abs(amount).toLocaleString('es-PE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${symbol} ${formatted}`;
};

export const formatCompact = (amount: number, symbol = 'S/'): string => {
  if (Math.abs(amount) >= 1000000) return `${symbol} ${(amount / 1000000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1000) return `${symbol} ${(amount / 1000).toFixed(1)}K`;
  return formatCurrency(amount, symbol);
};

// ─── Date formatting ──────────────────────────────────────────
export const formatDate = (dateStr: string, short = false): string => {
  const date = new Date(dateStr + 'T00:00:00');
  if (short) return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
};

export const formatMonthYear = (year: number, month: number): string => {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
};

export const todayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

export const getMonthName = (month: number): string => {
  const names = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return names[month - 1] || '';
};

// ─── Number helpers ───────────────────────────────────────────
export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const isPositive = (value: number): boolean => value >= 0;

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

// ─── Color helpers ────────────────────────────────────────────
export const getAmountColor = (amount: number, type: 'income' | 'expense'): string => {
  if (type === 'income') return Colors.income;
  return Colors.expense;
};

export const getGrowthColor = (growth: number): string => {
  if (growth > 0) return Colors.expense; // expense growth = bad
  if (growth < 0) return Colors.income;  // expense decrease = good
  return Colors.textSecondary;
};

export const getGrowthIncomeColor = (growth: number): string => {
  if (growth > 0) return Colors.income;
  if (growth < 0) return Colors.expense;
  return Colors.textSecondary;
};

export const getComplianceColor = (pct: number): string => {
  if (pct >= 80) return Colors.income;
  if (pct >= 50) return Colors.warning;
  return Colors.expense;
};

export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// ─── Calendar helpers ─────────────────────────────────────────
export const getCalendarDayColor = (hasIncome: boolean, hasExpense: boolean, hasRecords: boolean): string => {
  if (!hasRecords) return Colors.expense;         // Red - no records
  if (hasIncome && hasExpense) return Colors.primary; // Indigo - both
  if (hasIncome) return Colors.income;            // Green - income
  if (hasExpense) return Colors.warning;          // Amber - expense
  return Colors.textMuted;
};

// ─── Chart helpers ────────────────────────────────────────────
export const generateChartColors = (count: number): string[] => {
  const base = [
    Colors.primary, Colors.income, Colors.expense, Colors.savings,
    Colors.venture, '#EC4899', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316',
  ];
  return Array.from({ length: count }, (_, i) => base[i % base.length]);
};

// ─── Validation ───────────────────────────────────────────────
export const isValidAmount = (value: string): boolean => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
};

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// ─── Avatar ───────────────────────────────────────────────────
export const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const AVATAR_COLORS = [
  '#6366F1', '#10B981', '#EF4444', '#F59E0B', '#3B82F6',
  '#EC4899', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316',
];
