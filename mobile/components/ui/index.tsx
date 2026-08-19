import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle, ActivityIndicator
} from 'react-native';
import { Colors, BorderRadius, Shadows, Spacing, Typography } from '../../constants/theme';

// ─── KPI Card ─────────────────────────────────────────────────
interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  valueColor?: string;
  icon?: string;
  growth?: number;
  style?: ViewStyle;
}

export function KpiCard({ title, value, subtitle, valueColor, icon, growth, style }: KpiCardProps) {
  const growthColor = growth !== undefined
    ? (growth >= 0 ? Colors.income : Colors.expense)
    : undefined;

  return (
    <View style={[styles.kpiCard, style]}>
      <View style={styles.kpiHeader}>
        {icon && <Text style={styles.kpiIcon}>{icon}</Text>}
        <Text style={styles.kpiTitle}>{title}</Text>
      </View>
      <Text style={[styles.kpiValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
      {subtitle && <Text style={styles.kpiSubtitle}>{subtitle}</Text>}
      {growth !== undefined && (
        <View style={styles.kpiGrowthRow}>
          <Text style={[styles.kpiGrowth, { color: growthColor }]}>
            {growth >= 0 ? '▲' : '▼'} {Math.abs(growth).toFixed(1)}%
          </Text>
          <Text style={styles.kpiGrowthLabel}> vs mes ant.</Text>
        </View>
      )}
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
  icon?: string;
}

export function SectionHeader({ title, action, onAction, icon }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        {icon && <Text style={styles.sectionIcon}>{icon}</Text>}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Movement Item ────────────────────────────────────────────
interface MovementItemProps {
  type: 'Income' | 'Expense';
  amount: number;
  concept: string;
  category?: string;
  categoryColor?: string;
  date: string;
  currencySymbol?: string;
  onPress?: () => void;
}

export function MovementItem({
  type, amount, concept, category, categoryColor, date, currencySymbol = 'S/', onPress
}: MovementItemProps) {
  const isIncome = type === 'Income';
  const color = isIncome ? Colors.income : Colors.expense;
  const prefix = isIncome ? '+' : '-';

  return (
    <TouchableOpacity style={styles.movementItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.movementDot, { backgroundColor: categoryColor || color }]} />
      <View style={styles.movementInfo}>
        <Text style={styles.movementConcept} numberOfLines={1}>{concept}</Text>
        <Text style={styles.movementCategory}>{category || (isIncome ? 'Ingreso' : 'Gasto')}</Text>
      </View>
      <View style={styles.movementRight}>
        <Text style={[styles.movementAmount, { color }]}>
          {prefix}{currencySymbol} {amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
        </Text>
        <Text style={styles.movementDate}>{date}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Empty State ──────────────────────────────────────────────
interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, action, onAction }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      {icon && <Text style={styles.emptyIcon}>{icon}</Text>}
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
      {action && (
        <TouchableOpacity style={styles.emptyAction} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.emptyActionText}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Button ───────────────────────────────────────────────────
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ title, onPress, variant = 'primary', icon, loading, disabled, style }: ButtonProps) {
  const bgColor = variant === 'primary' ? Colors.primary
    : variant === 'danger' ? Colors.expense
    : variant === 'secondary' ? Colors.surface
    : Colors.transparent;

  const textColor = variant === 'ghost' ? Colors.primary : Colors.white;
  const borderColor = variant === 'ghost' ? Colors.primary : Colors.transparent;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: bgColor, borderColor, borderWidth: variant === 'ghost' ? 1.5 : 0 },
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={styles.buttonContent}>
          {icon && <Text style={styles.buttonIcon}>{icon}</Text>}
          <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Badge ────────────────────────────────────────────────────
interface BadgeProps {
  label: string;
  color?: string;
  style?: ViewStyle;
}

export function Badge({ label, color = Colors.primary, style }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color + '40' }, style]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────
interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  height?: number;
  style?: ViewStyle;
}

export function ProgressBar({ progress, color = Colors.primary, height = 6, style }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  return (
    <View style={[styles.progressTrack, { height }, style]}>
      <View
        style={[
          styles.progressFill,
          { width: `${clampedProgress}%` as any, backgroundColor: color, height },
        ]}
      />
    </View>
  );
}

// ─── Venture Card ─────────────────────────────────────────────
interface VentureCardProps {
  name: string;
  income: number;
  expense: number;
  profit: number;
  icon?: string;
  color?: string;
  onPress?: () => void;
}

export function VentureCard({ name, income, expense, profit, icon, color = Colors.venture, onPress }: VentureCardProps) {
  const isProfit = profit >= 0;
  return (
    <TouchableOpacity style={[styles.ventureCard, { borderLeftColor: color }]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.ventureHeader}>
        <View style={[styles.ventureIconBg, { backgroundColor: color + '20' }]}>
          <Text style={styles.ventureIcon}>{icon || '🏪'}</Text>
        </View>
        <View style={styles.ventureName}>
          <Text style={styles.ventureNameText}>{name}</Text>
          <Text style={[styles.ventureProfit, { color: isProfit ? Colors.income : Colors.expense }]}>
            {isProfit ? '▲' : '▼'} S/ {Math.abs(profit).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>
      <View style={styles.ventureStats}>
        <View style={styles.ventureStat}>
          <Text style={styles.ventureStatLabel}>Ingresos</Text>
          <Text style={[styles.ventureStatValue, { color: Colors.income }]}>
            S/ {income.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={styles.ventureStat}>
          <Text style={styles.ventureStatLabel}>Gastos</Text>
          <Text style={[styles.ventureStatValue, { color: Colors.expense }]}>
            S/ {expense.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Alert Item ───────────────────────────────────────────────
interface AlertItemProps {
  title: string;
  message: string;
  type: string;
  date: string;
  onRead?: () => void;
  onDismiss?: () => void;
}

export function AlertItem({ title, message, type, date, onRead, onDismiss }: AlertItemProps) {
  const color = type.includes('Deficit') || type.includes('Loss') ? Colors.expense
    : type.includes('NoRecords') ? Colors.warning
    : type.includes('Savings') ? Colors.savings
    : Colors.primary;

  return (
    <View style={[styles.alertItem, { borderLeftColor: color }]}>
      <View style={styles.alertContent}>
        <Text style={styles.alertTitle}>{title}</Text>
        <Text style={styles.alertMessage}>{message}</Text>
        <Text style={styles.alertDate}>{date}</Text>
      </View>
      <View style={styles.alertActions}>
        {onRead && (
          <TouchableOpacity onPress={onRead} style={styles.alertBtn}>
            <Text style={styles.alertBtnText}>✓</Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.alertBtn}>
            <Text style={styles.alertBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Goal Card ────────────────────────────────────────────────
interface GoalCardProps {
  name: string;
  targetAmount: number;
  currentAmount: number;
  progressPercentage: number;
  monthsToAchieve?: number;
  icon?: string;
  color?: string;
  onPress?: () => void;
}

export function GoalCard({ name, targetAmount, currentAmount, progressPercentage, monthsToAchieve, icon, color = Colors.savings, onPress }: GoalCardProps) {
  return (
    <TouchableOpacity style={styles.goalCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.goalHeader}>
        <View style={[styles.goalIconBg, { backgroundColor: color + '20' }]}>
          <Text style={styles.goalIcon}>{icon || '🎯'}</Text>
        </View>
        <View style={styles.goalInfo}>
          <Text style={styles.goalName}>{name}</Text>
          {monthsToAchieve && (
            <Text style={styles.goalEta}>≈ {monthsToAchieve} meses para lograrlo</Text>
          )}
        </View>
        <Text style={[styles.goalPct, { color }]}>{progressPercentage.toFixed(0)}%</Text>
      </View>
      <ProgressBar progress={progressPercentage} color={color} style={{ marginTop: 10 }} />
      <View style={styles.goalAmounts}>
        <Text style={styles.goalCurrent}>S/ {currentAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</Text>
        <Text style={styles.goalTarget}>Meta: S/ {targetAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen Header ────────────────────────────────────────────
interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, onBack, rightAction }: ScreenHeaderProps) {
  return (
    <View style={styles.screenHeader}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
      )}
      <View style={styles.screenHeaderText}>
        <Text style={styles.screenHeaderTitle}>{title}</Text>
        {subtitle && <Text style={styles.screenHeaderSubtitle}>{subtitle}</Text>}
      </View>
      {rightAction && <View style={styles.screenHeaderRight}>{rightAction}</View>}
    </View>
  );
}

// ─── Divider ─────────────────────────────────────────────────
export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  // KPI Card
  kpiCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    ...Shadows.sm,
  },
  kpiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  kpiIcon: { fontSize: 14, marginRight: 4 },
  kpiTitle: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, fontWeight: Typography.weights.medium },
  kpiValue: { fontSize: Typography.sizes['2xl'], color: Colors.text, fontWeight: Typography.weights.bold, marginTop: 4 },
  kpiSubtitle: { fontSize: Typography.sizes.xs, color: Colors.textMuted, marginTop: 2 },
  kpiGrowthRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  kpiGrowth: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
  kpiGrowthLabel: { fontSize: Typography.sizes.xs, color: Colors.textMuted },

  // Section Header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm, marginHorizontal: Spacing.base },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  sectionIcon: { fontSize: 16, marginRight: 6 },
  sectionTitle: { fontSize: Typography.sizes.md, color: Colors.text, fontWeight: Typography.weights.semibold },
  sectionAction: { fontSize: Typography.sizes.sm, color: Colors.primary, fontWeight: Typography.weights.medium },

  // Movement Item
  movementItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, backgroundColor: Colors.surface, marginHorizontal: Spacing.base, borderRadius: BorderRadius.md, marginBottom: Spacing.sm, ...Shadows.sm },
  movementDot: { width: 10, height: 10, borderRadius: 5, marginRight: Spacing.sm },
  movementInfo: { flex: 1 },
  movementConcept: { fontSize: Typography.sizes.base, color: Colors.text, fontWeight: Typography.weights.medium },
  movementCategory: { fontSize: Typography.sizes.xs, color: Colors.textMuted, marginTop: 2 },
  movementRight: { alignItems: 'flex-end' },
  movementAmount: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold },
  movementDate: { fontSize: Typography.sizes.xs, color: Colors.textMuted, marginTop: 2 },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: Spacing['4xl'], paddingHorizontal: Spacing['2xl'] },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: Typography.sizes.lg, color: Colors.text, fontWeight: Typography.weights.semibold, textAlign: 'center' },
  emptySubtitle: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
  emptyAction: { marginTop: Spacing.lg, backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  emptyActionText: { color: Colors.white, fontWeight: Typography.weights.semibold },

  // Button
  button: { paddingVertical: 14, paddingHorizontal: Spacing.xl, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', minHeight: 50 },
  buttonContent: { flexDirection: 'row', alignItems: 'center' },
  buttonIcon: { fontSize: 18, marginRight: 8 },
  buttonText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold },
  buttonDisabled: { opacity: 0.5 },

  // Badge
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1, alignSelf: 'flex-start' },
  badgeText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },

  // Progress Bar
  progressTrack: { backgroundColor: Colors.border, borderRadius: BorderRadius.full, overflow: 'hidden', width: '100%' },
  progressFill: { borderRadius: BorderRadius.full },

  // Venture Card
  ventureCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, marginHorizontal: Spacing.base, marginBottom: Spacing.sm, borderLeftWidth: 4, ...Shadows.sm },
  ventureHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  ventureIconBg: { width: 40, height: 40, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  ventureIcon: { fontSize: 20 },
  ventureName: { flex: 1 },
  ventureNameText: { fontSize: Typography.sizes.md, color: Colors.text, fontWeight: Typography.weights.semibold },
  ventureProfit: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium, marginTop: 2 },
  ventureStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  ventureStat: {},
  ventureStatLabel: { fontSize: Typography.sizes.xs, color: Colors.textMuted },
  ventureStatValue: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },

  // Alert Item
  alertItem: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.sm, marginHorizontal: Spacing.base, marginBottom: Spacing.sm, borderLeftWidth: 3, flexDirection: 'row', alignItems: 'flex-start', ...Shadows.sm },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: Typography.sizes.sm, color: Colors.text, fontWeight: Typography.weights.semibold },
  alertMessage: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginTop: 2, lineHeight: 16 },
  alertDate: { fontSize: Typography.sizes.xs, color: Colors.textMuted, marginTop: 4 },
  alertActions: { flexDirection: 'row', marginLeft: Spacing.sm },
  alertBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surfaceHigh, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  alertBtnText: { fontSize: 12, color: Colors.textSecondary },

  // Goal Card
  goalCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, marginHorizontal: Spacing.base, marginBottom: Spacing.sm, ...Shadows.sm },
  goalHeader: { flexDirection: 'row', alignItems: 'center' },
  goalIconBg: { width: 40, height: 40, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  goalIcon: { fontSize: 20 },
  goalInfo: { flex: 1 },
  goalName: { fontSize: Typography.sizes.md, color: Colors.text, fontWeight: Typography.weights.semibold },
  goalEta: { fontSize: Typography.sizes.xs, color: Colors.textMuted, marginTop: 2 },
  goalPct: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  goalAmounts: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  goalCurrent: { fontSize: Typography.sizes.sm, color: Colors.text, fontWeight: Typography.weights.medium },
  goalTarget: { fontSize: Typography.sizes.sm, color: Colors.textMuted },

  // Screen Header
  screenHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceHigh, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  backBtnText: { fontSize: 18, color: Colors.text },
  screenHeaderText: { flex: 1 },
  screenHeaderTitle: { fontSize: Typography.sizes.xl, color: Colors.text, fontWeight: Typography.weights.bold },
  screenHeaderSubtitle: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 2 },
  screenHeaderRight: {},

  // Divider
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
});
