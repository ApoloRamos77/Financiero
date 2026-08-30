import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { movementService } from '../../services/api';
import { ScreenHeader, Button, Badge } from '../../components/ui';
import { formatCurrency, formatDate } from '../../utils/helpers';

import { useAuthStore } from '../../store';

type RouteParams = { movementId: string };

export default function MovementDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, RouteParams>>>();
  const { movementId } = route.params;
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: movement, isLoading } = useQuery({
    queryKey: ['movement', movementId],
    queryFn: () => movementService.getById(movementId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => movementService.delete(movementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      navigation.goBack();
    },
    onError: () => Alert.alert('Error', 'No se pudo eliminar el movimiento.'),
  });

  const handleDelete = () => {
    Alert.alert('Eliminar movimiento', '¿Estás seguro de eliminar este movimiento? Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  };

  if (isLoading) return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Detalle" onBack={() => navigation.goBack()} />
      <View style={styles.loading}><Text style={styles.loadingText}>Cargando...</Text></View>
    </View>
  );

  const isIncome = movement?.type === 'Income';
  const color = isIncome ? Colors.income : Colors.expense;
  
  const canModify = user?.role === 'Admin' || (movement && movement.createdBy === user?.id);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Detalle de movimiento" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Amount Hero */}
        <View style={[styles.amountHero, { backgroundColor: color + '15' }]}>
          <Text style={styles.typeLabel}>{isIncome ? '📈 INGRESO' : '📉 GASTO'}</Text>
          <Text style={[styles.amount, { color }]}>
            {isIncome ? '+' : '-'}{formatCurrency(movement?.amount ?? 0, 'S/')}
          </Text>
          <Text style={styles.concept}>{movement?.concept}</Text>
          <Text style={styles.dateLabel}>{movement ? formatDate(movement.movementDate) : ''}</Text>
        </View>

        {/* Details */}
        <View style={styles.detailsCard}>
          <DetailRow icon="👤" label="Responsable" value={movement?.contributorName || 'No especificado'} />
          <DetailRow icon="🏷️" label="Categoría" value={movement?.categoryName || 'Sin categoría'} color={movement?.categoryColor} />
          <DetailRow icon="🏪" label="Emprendimiento" value={movement?.ventureName || 'No asociado'} />
          <DetailRow icon="💳" label="Cuenta" value={movement?.accountName || 'Sin cuenta'} />
          <DetailRow icon="💸" label="Medio de pago" value={movement?.paymentMethod || 'Efectivo'} />
          {movement?.notes && <DetailRow icon="📝" label="Notas" value={movement.notes} />}
          <DetailRow icon="🕐" label="Registrado" value={movement ? new Date(movement.createdAt).toLocaleDateString('es-PE', { dateStyle: 'medium' }) : ''} />
        </View>

        {/* Actions */}
        {canModify && (
          <View style={styles.actions}>
            <Button
              title="Eliminar"
              onPress={handleDelete}
              variant="danger"
              loading={deleteMutation.isPending}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Text>{icon}</Text>
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, color ? { color } : {}]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: Colors.textSecondary },
  amountHero: { marginHorizontal: Spacing.base, borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.base },
  typeLabel: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, fontWeight: Typography.weights.bold, letterSpacing: 1, marginBottom: 8 },
  amount: { fontSize: Typography.sizes['4xl'], fontWeight: Typography.weights.extrabold },
  concept: { fontSize: Typography.sizes.lg, color: Colors.text, fontWeight: Typography.weights.semibold, marginTop: 8, textAlign: 'center' },
  dateLabel: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 4 },
  detailsCard: { backgroundColor: Colors.surface, marginHorizontal: Spacing.base, borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.sm, borderWidth: 1, borderColor: Colors.border },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  detailIcon: { width: 32, alignItems: 'center' },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: Typography.sizes.xs, color: Colors.textMuted, fontWeight: Typography.weights.medium },
  detailValue: { fontSize: Typography.sizes.sm, color: Colors.text, fontWeight: Typography.weights.medium, marginTop: 2 },
  actions: { margin: Spacing.base, gap: 10 },
});
