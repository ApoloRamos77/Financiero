import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Alert, Switch, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { contributorService } from '../../services/api';
import { ScreenHeader, Button } from '../../components/ui';

type RouteParams = { contributorId: string };

export default function ContributorDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, RouteParams>>>();
  const { contributorId } = route.params;
  const isNew = contributorId === 'new';
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: '',
    contributorType: 'Principal',
    fixedIncome: '',
    incomeSource: '',
    paymentDate: '',
    isActive: true,
  });

  const { data: contributor, isLoading } = useQuery({
    queryKey: ['contributor', contributorId],
    queryFn: () => contributorService.getById(contributorId),
    enabled: !isNew,
  });

  useEffect(() => {
    if (contributor) {
      setForm({
        name: contributor.name,
        contributorType: contributor.contributorType,
        fixedIncome: contributor.fixedIncome?.toString() || '',
        incomeSource: contributor.incomeSource || '',
        paymentDate: contributor.paymentDate ? new Date(contributor.paymentDate).toISOString().split('T')[0] : '',
        isActive: contributor.isActive,
      });
    }
  }, [contributor]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => isNew ? contributorService.create(data) : contributorService.update(contributorId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributors'] });
      navigation.goBack();
    },
    onError: (err: any) => Alert.alert('Error', err?.response?.data?.message || 'No se pudo guardar el aportante.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => contributorService.delete(contributorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributors'] });
      navigation.goBack();
    },
  });

  const handleSave = () => {
    if (!form.name.trim()) { Alert.alert('Error', 'El nombre es requerido'); return; }
    saveMutation.mutate({
      name: form.name,
      contributorType: form.contributorType,
      fixedIncome: parseFloat(form.fixedIncome) || 0,
      incomeSource: form.incomeSource || undefined,
      paymentDate: form.paymentDate || undefined,
      isActive: form.isActive,
    });
  };

  const handleDelete = () => {
    Alert.alert('Eliminar', '¿Eliminar este aportante?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  };

  if (isLoading && !isNew) return (
    <View style={[styles.container, { paddingTop: insets.top }]}><ScreenHeader title="Cargando..." onBack={() => navigation.goBack()} /></View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title={isNew ? 'Nuevo Aportante' : 'Editar Aportante'} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ padding: Spacing.base, paddingBottom: insets.bottom + 40 }}>
        <View style={styles.field}>
          <Text style={styles.label}>Nombre *</Text>
          <TextInput style={styles.input} value={form.name} onChangeText={v => setForm({ ...form, name: v })} placeholder="Ej: Juan" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Tipo de aportante</Text>
          <View style={styles.row}>
            {['Principal', 'Secundario'].map(t => (
              <TouchableOpacity key={t} style={[styles.chip, form.contributorType === t && styles.chipSelected]} onPress={() => setForm({ ...form, contributorType: t })}>
                <Text style={[styles.chipText, form.contributorType === t && styles.chipTextSelected]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Ingreso Fijo Estimado</Text>
          <TextInput style={styles.input} value={form.fixedIncome} onChangeText={v => setForm({ ...form, fixedIncome: v })} placeholder="0.00" keyboardType="decimal-pad" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Fuente de ingreso (Empresa)</Text>
          <TextInput style={styles.input} value={form.incomeSource} onChangeText={v => setForm({ ...form, incomeSource: v })} placeholder="Ej: Empresa S.A." />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Fecha habitual de pago (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} value={form.paymentDate} onChangeText={v => setForm({ ...form, paymentDate: v })} placeholder="2024-01-30" />
        </View>

        <View style={[styles.field, styles.switchRow]}>
          <Text style={styles.label}>Estado Activo</Text>
          <Switch value={form.isActive} onValueChange={v => setForm({ ...form, isActive: v })} trackColor={{ true: Colors.primary }} />
        </View>

        <Button title="Guardar" onPress={handleSave} loading={saveMutation.isPending} style={{ marginTop: Spacing.xl, marginBottom: Spacing.base }} />
        {!isNew && <Button title="Eliminar" onPress={handleDelete} variant="danger" loading={deleteMutation.isPending} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  field: { marginBottom: Spacing.base },
  label: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginBottom: 6, fontWeight: Typography.weights.medium },
  input: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border, color: Colors.text },
  row: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  chipSelected: { backgroundColor: Colors.primary + '20', borderColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: Typography.sizes.sm },
  chipTextSelected: { color: Colors.primary, fontWeight: Typography.weights.semibold },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
