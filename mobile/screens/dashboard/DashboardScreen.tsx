import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { dashboardService, alertService } from '../../services/api';
import { useAuthStore, useAppStore } from '../../store';
import {
  KpiCard, SectionHeader, MovementItem, VentureCard,
  AlertItem, EmptyState, ProgressBar, Badge
} from '../../components/ui';
import { formatCurrency, formatCompact, formatDate, formatMonthYear, getComplianceColor } from '../../utils/helpers';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { selectedYear, selectedMonth } = useAppStore();

  const { data: summary, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard-summary', selectedYear, selectedMonth],
    queryFn: () => dashboardService.getSummary(selectedYear, selectedMonth),
  });

  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertService.getAll(),
  });

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const activeAlerts = (alerts || []).filter((a: any) => a.status === 'Active').slice(0, 3);
  const currencySymbol = 'S/';
  const periodLabel = formatMonthYear(selectedYear, selectedMonth);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Cargando finanzas...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero Header ─────────────────────────────────────── */}
      <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroGreeting}>Hola, {user?.name?.split(' ')[0]} 👋</Text>
            <Text style={styles.heroPeriod}>{periodLabel}</Text>
          </View>
          {activeAlerts.length > 0 && (
            <TouchableOpacity
              style={styles.alertBadge}
              onPress={() => navigation.navigate('More', { screen: 'Alerts' })}
              activeOpacity={0.8}
            >
              <Text style={styles.alertBadgeText}>🔔 {activeAlerts.length}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo disponible</Text>
          <Text style={styles.balanceValue}>
            {formatCurrency(summary?.availableBalance ?? 0, currencySymbol)}
          </Text>

          <View style={styles.balanceStats}>
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatLabel}>📈 Ingresos</Text>
              <Text style={[styles.balanceStatValue, { color: Colors.income }]}>
                +{formatCompact(summary?.totalIncome ?? 0, currencySymbol)}
              </Text>
            </View>
            <View style={styles.balanceSeparator} />
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatLabel}>📉 Gastos</Text>
              <Text style={[styles.balanceStatValue, { color: Colors.expense }]}>
                -{formatCompact(summary?.totalExpense ?? 0, currencySymbol)}
              </Text>
            </View>
            <View style={styles.balanceSeparator} />
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatLabel}>💰 Ahorro</Text>
              <Text style={[styles.balanceStatValue, { color: Colors.savings }]}>
                {formatCompact(summary?.familySavings ?? 0, currencySymbol)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Quick Actions ────────────────────────────────────── */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickActionBtn, { backgroundColor: Colors.income + '15', borderColor: Colors.income + '40' }]}
          onPress={() => navigation.navigate('Income')}
          activeOpacity={0.8}
        >
          <Text style={styles.quickActionIcon}>➕</Text>
          <Text style={[styles.quickActionText, { color: Colors.income }]}>Ingreso</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionBtn, { backgroundColor: Colors.expense + '15', borderColor: Colors.expense + '40' }]}
          onPress={() => navigation.navigate('Expense')}
          activeOpacity={0.8}
        >
          <Text style={styles.quickActionIcon}>➖</Text>
          <Text style={[styles.quickActionText, { color: Colors.expense }]}>Gasto</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionBtn, { backgroundColor: Colors.venture + '15', borderColor: Colors.venture + '40' }]}
          onPress={() => navigation.navigate('Ventures')}
          activeOpacity={0.8}
        >
          <Text style={styles.quickActionIcon}>🏪</Text>
          <Text style={[styles.quickActionText, { color: Colors.venture }]}>Negocios</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionBtn, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '40' }]}
          onPress={() => navigation.navigate('Calendar')}
          activeOpacity={0.8}
        >
          <Text style={styles.quickActionIcon}>📅</Text>
          <Text style={[styles.quickActionText, { color: Colors.primary }]}>Calendario</Text>
        </TouchableOpacity>
      </View>

      {/* ── KPI Grid ─────────────────────────────────────────── */}
      <View style={styles.kpiGrid}>
        <KpiCard
          title="Utilidad Negocios"
          value={formatCompact(summary?.ventureProfit ?? 0, currencySymbol)}
          valueColor={summary?.ventureProfit >= 0 ? Colors.income : Colors.expense}
          icon="🏪"
          style={styles.kpiHalf}
        />
        <KpiCard
          title="Gastos / Ingresos"
          value={`${(summary?.expenseToIncomeRatio ?? 0).toFixed(1)}%`}
          valueColor={summary?.expenseToIncomeRatio > 80 ? Colors.expense : Colors.income}
          icon="📊"
          style={styles.kpiHalf}
        />
        <KpiCard
          title="Ingreso Prom. Diario"
          value={formatCompact(summary?.avgDailyIncome ?? 0, currencySymbol)}
          valueColor={Colors.income}
          icon="📈"
          growth={summary?.incomeGrowth}
          style={styles.kpiHalf}
        />
        <KpiCard
          title="Gasto Prom. Diario"
          value={formatCompact(summary?.avgDailyExpense ?? 0, currencySymbol)}
          valueColor={Colors.expense}
          icon="📉"
          growth={summary?.expenseGrowth}
          style={styles.kpiHalf}
        />
      </View>

      {/* ── Registro diario ──────────────────────────────────── */}
      <View style={[styles.complianceCard, { marginHorizontal: Spacing.base }]}>
        <View style={styles.complianceHeader}>
          <Text style={styles.complianceTitle}>📋 Registros del mes</Text>
          <Text style={[styles.compliancePct, { color: getComplianceColor(summary?.compliancePercentage ?? 0) }]}>
            {(summary?.compliancePercentage ?? 0).toFixed(0)}%
          </Text>
        </View>
        <ProgressBar
          progress={summary?.compliancePercentage ?? 0}
          color={getComplianceColor(summary?.compliancePercentage ?? 0)}
          height={8}
          style={{ marginTop: 8 }}
        />
        <Text style={styles.complianceDesc}>
          Cumplimiento de registro diario en {periodLabel}
        </Text>
      </View>

      {/* ── Cuentas ──────────────────────────────────────────── */}
      {(summary?.accounts?.length ?? 0) > 0 && (
        <View style={{ marginTop: Spacing.lg }}>
          <SectionHeader title="Cuentas" action="Ver todo" onAction={() => navigation.navigate('More')} icon="💳" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.base, gap: 10 }}>
            {summary?.accounts?.map((acc: any) => (
              <View key={acc.id} style={[styles.accountChip, { borderLeftColor: acc.color || Colors.primary }]}>
                <Text style={styles.accountName}>{acc.name}</Text>
                <Text style={[styles.accountBalance, { color: acc.balance >= 0 ? Colors.income : Colors.expense }]}>
                  {formatCurrency(acc.balance, currencySymbol)}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Alertas activas ───────────────────────────────────── */}
      {activeAlerts.length > 0 && (
        <View style={{ marginTop: Spacing.lg }}>
          <SectionHeader title="Alertas" action="Ver todo" icon="⚠️" />
          {activeAlerts.map((alert: any) => (
            <AlertItem
              key={alert.id}
              title={alert.title}
              message={alert.message}
              type={alert.alertType}
              date={formatDate(alert.alertDate)}
            />
          ))}
        </View>
      )}

      {/* ── Emprendimientos ───────────────────────────────────── */}
      {(summary?.ventureIncome > 0 || summary?.ventureExpense > 0) && (
        <View style={{ marginTop: Spacing.lg }}>
          <SectionHeader title="Emprendimientos" action="Ver todos" onAction={() => navigation.navigate('Ventures')} icon="🏪" />
          <Text style={styles.ventureTotal}>
            Utilidad total: <Text style={{ color: summary?.ventureProfit >= 0 ? Colors.income : Colors.expense }}>
              {formatCurrency(summary?.ventureProfit ?? 0, currencySymbol)}
            </Text>
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loadingContainer: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: Colors.textSecondary, fontSize: Typography.sizes.base },

  // Hero
  hero: { backgroundColor: Colors.surface, paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, ...Shadows.md },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.base },
  heroGreeting: { fontSize: Typography.sizes.xl, color: Colors.text, fontWeight: Typography.weights.bold },
  heroPeriod: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  alertBadge: { backgroundColor: Colors.expense + '20', paddingHorizontal: 10, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.expense + '40' },
  alertBadgeText: { color: Colors.expense, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },

  // Balance Card
  balanceCard: { backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.lg },
  balanceLabel: { fontSize: Typography.sizes.sm, color: 'rgba(255,255,255,0.8)', fontWeight: Typography.weights.medium },
  balanceValue: { fontSize: Typography.sizes['4xl'], color: Colors.white, fontWeight: Typography.weights.extrabold, marginTop: 4, marginBottom: Spacing.base },
  balanceStats: { flexDirection: 'row', justifyContent: 'space-around' },
  balanceStat: { alignItems: 'center' },
  balanceStatLabel: { fontSize: Typography.sizes.xs, color: 'rgba(255,255,255,0.7)' },
  balanceStatValue: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, marginTop: 2 },
  balanceSeparator: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Quick Actions
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: Spacing.base, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  quickActionBtn: { width: 76, height: 76, borderRadius: BorderRadius.xl, alignItems: 'center', justifyContent: 'center', borderWidth: 1, ...Shadows.sm },
  quickActionIcon: { fontSize: 24, marginBottom: 4 },
  quickActionText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },

  // KPI Grid
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.base, gap: 10, marginTop: Spacing.lg },
  kpiHalf: { width: '47.5%' },

  // Compliance
  complianceCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, marginTop: Spacing.lg, ...Shadows.sm, borderWidth: 1, borderColor: Colors.border },
  complianceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  complianceTitle: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, fontWeight: Typography.weights.medium },
  compliancePct: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  complianceDesc: { fontSize: Typography.sizes.xs, color: Colors.textMuted, marginTop: 6 },

  // Accounts
  accountChip: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.sm, minWidth: 140, borderLeftWidth: 3, ...Shadows.sm },
  accountName: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginBottom: 4 },
  accountBalance: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold },

  ventureTotal: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, paddingHorizontal: Spacing.base, marginBottom: Spacing.sm },
});
