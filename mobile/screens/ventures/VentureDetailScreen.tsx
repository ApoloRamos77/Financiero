import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { ventureService } from '../../services/api';
import { ScreenHeader, Button, Badge } from '../../components/ui';
import { formatCurrency } from '../../utils/helpers';
import { MovementItem } from '../../components/ui';
import { formatDate } from '../../utils/helpers';

type RouteParams = { ventureId: string };

export default function VentureDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, RouteParams>>>();
  const { ventureId } = route.params;
  const queryClient = useQueryClient();

  const { data: summary, isLoading } = useQuery({
    queryKey: ['venture-summary', ventureId],
    queryFn: () => ventureService.getSummary(ventureId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => ventureService.delete(ventureId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventures'] });
      navigation.goBack();
    },
  });

  const handleDeactivate = () => {
    Alert.alert('Desactivar', '¿Desactivar este emprendimiento?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Desactivar', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  };

  if (isLoading || !summary) return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Emprendimiento" onBack={() => navigation.goBack()} />
      <View style={styles.loading}><Text style={styles.loadingText}>Cargando...</Text></View>
    </View>
  );

  const isProfit = summary.netProfit >= 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title={summary.name} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}>
        {/* KPI Cards */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { borderTopColor: Colors.income }]}>
            <Text style={styles.kpiLabel}>Ingresos</Text>
            <Text style={[styles.kpiValue, { color: Colors.income }]}>{formatCurrency(summary.totalIncome)}</Text>
          </View>
          <View style={[styles.kpiCard, { borderTopColor: Colors.expense }]}>
            <Text style={styles.kpiLabel}>Gastos</Text>
            <Text style={[styles.kpiValue, { color: Colors.expense }]}>{formatCurrency(summary.totalExpense)}</Text>
          </View>
          <View style={[styles.kpiCard, { borderTopColor: isProfit ? Colors.income : Colors.expense }]}>
            <Text style={styles.kpiLabel}>Utilidad</Text>
            <Text style={[styles.kpiValue, { color: isProfit ? Colors.income : Colors.expense }]}>
              {formatCurrency(summary.netProfit)}
            </Text>
          </View>
        </View>

        {/* Badge */}
        <View style={{ paddingHorizontal: Spacing.base, marginBottom: Spacing.base }}>
          <Badge
            label={summary.status}
            color={summary.status === 'Active' ? Colors.income : Colors.textMuted}
          />
        </View>

        {/* Recent Movements */}
        <Text style={styles.subtitle}>Movimientos recientes</Text>
        {(summary.recentMovements?.length ?? 0) === 0 ? (
          <View style={styles.noMovements}>
            <Text style={styles.noMovementsText}>Sin movimientos registrados</Text>
          </View>
        ) : summary.recentMovements.map((m: any) => (
          <MovementItem
            key={m.id}
            type={m.type}
            amount={m.amount}
            concept={m.concept}
            category={m.categoryName}
            categoryColor={m.categoryColor}
            date={formatDate(m.movementDate, true)}
            onPress={() => navigation.navigate('MovementDetail', { movementId: m.id })}
          />
        ))}

        {/* Actions */}
        <View style={styles.actions}>
          <Button title="Registrar ingreso" onPress={() => navigation.navigate('Income')} style={{ backgroundColor: Colors.income, marginBottom: 8 }} />
          <Button title="Registrar gasto" onPress={() => navigation.navigate('Expense')} style={{ backgroundColor: Colors.expense, marginBottom: 8 }} />
          <Button title="Desactivar emprendimiento" onPress={handleDeactivate} variant="danger" loading={deleteMutation.isPending} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: Colors.textSecondary },
  kpiRow: { flexDirection: 'row', padding: Spacing.base, gap: 8 },
  kpiCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.sm, borderTopWidth: 3, alignItems: 'center' },
  kpiLabel: { fontSize: Typography.sizes.xs, color: Colors.textMuted, marginBottom: 4 },
  kpiValue: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold },
  subtitle: { fontSize: Typography.sizes.base, color: Colors.textSecondary, fontWeight: Typography.weights.semibold, paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm },
  noMovements: { padding: Spacing.xl, alignItems: 'center' },
  noMovementsText: { color: Colors.textMuted },
  actions: { margin: Spacing.base },
});
