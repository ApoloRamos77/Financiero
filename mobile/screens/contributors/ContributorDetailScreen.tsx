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
    paymentDay: '',
    frequency: 'Monthly',
    isActive: true,
    notes: '',
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
        paymentDay: contributor.paymentDay?.toString() || '',
        frequency: contributor.frequency || 'Monthly',
        isActive: contributor.isActive,
        notes: contributor.notes || '',
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

    const paymentDayNum = form.paymentDay ? parseInt(form.paymentDay, 10) : undefined;
    if (form.paymentDay && (isNaN(paymentDayNum!) || paymentDayNum! < 1 || paymentDayNum! > 31)) {
      Alert.alert('Error', 'El día de pago debe ser un número entre 1 y 31');
      return;
    }

    saveMutation.mutate({
      name: form.name.trim(),
      contributorType: form.contributorType,
      fixedIncome: parseFloat(form.fixedIncome) || 0,
      frequency: form.frequency,
      paymentDay: paymentDayNum,
      incomeSource: form.incomeSource || undefined,
      isActive: form.isActive,
      notes: form.notes || undefined,
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

  const FREQUENCIES = [
    { value: 'Daily',     label: 'Diario'     },
    { value: 'Weekly',    label: 'Semanal'    },
    { value: 'Biweekly',  label: 'Quincenal'  },
    { value: 'Monthly',   label: 'Mensual'    },
    { value: 'Annual',    label: 'Anual'      },
    { value: 'Variable',  label: 'Variable'   },
  ];

  const CONTRIBUTOR_TYPES = [
    { value: 'Principal',  label: 'Principal'  },
    { value: 'Secundario', label: 'Secundario' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title={isNew ? 'Nuevo Aportante' : 'Editar Aportante'} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ padding: Spacing.base, paddingBottom: insets.bottom + 40 }}>
        <View style={styles.field}>
          <Text style={styles.label}>Nombre *</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={v => setForm({ ...form, name: v })}
            placeholder="Ej: Juan Pérez"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Tipo de aportante</Text>
          <View style={styles.row}>
            {CONTRIBUTOR_TYPES.map(t => (
              <TouchableOpacity
                key={t.value}
                style={[styles.chip, form.contributorType === t.value && styles.chipSelected]}
                onPress={() => setForm({ ...form, contributorType: t.value })}
              >
                <Text style={[styles.chipText, form.contributorType === t.value && styles.chipTextSelected]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Ingreso Fijo Estimado</Text>
          <TextInput
            style={styles.input}
            value={form.fixedIncome}
            onChangeText={v => setForm({ ...form, fixedIncome: v })}
            placeholder="0.00"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Frecuencia de pago</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {FREQUENCIES.map(f => (
              <TouchableOpacity
                key={f.value}
                style={[styles.chip, form.frequency === f.value && styles.chipSelected]}
                onPress={() => setForm({ ...form, frequency: f.value })}
              >
                <Text style={[styles.chipText, form.frequency === f.value && styles.chipTextSelected]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Día habitual de pago (1–31)</Text>
          <TextInput
            style={styles.input}
            value={form.paymentDay}
            onChangeText={v => setForm({ ...form, paymentDay: v.replace(/[^0-9]/g, '') })}
            placeholder="Ej: 15 (día del mes)"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Fuente de ingreso (Empresa)</Text>
          <TextInput
            style={styles.input}
            value={form.incomeSource}
            onChangeText={v => setForm({ ...form, incomeSource: v })}
            placeholder="Ej: Empresa S.A."
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Notas (opcional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={form.notes}
            onChangeText={v => setForm({ ...form, notes: v })}
            placeholder="Observaciones adicionales..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={[styles.field, styles.switchRow]}>
          <Text style={styles.label}>Estado Activo</Text>
          <Switch
            value={form.isActive}
            onValueChange={v => setForm({ ...form, isActive: v })}
            trackColor={{ true: Colors.primary }}
          />
        </View>

        <Button
          title="Guardar"
          onPress={handleSave}
          loading={saveMutation.isPending}
          style={{ marginTop: Spacing.xl, marginBottom: Spacing.base }}
        />
        {!isNew && (
          <Button
            title="Eliminar"
            onPress={handleDelete}
            variant="danger"
            loading={deleteMutation.isPending}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  field: { marginBottom: Spacing.base },
  label: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginBottom: 6, fontWeight: Typography.weights.medium },
  input: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border, color: Colors.text, fontSize: Typography.sizes.base },
  notesInput: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipRow: { gap: 8, paddingVertical: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  chipSelected: { backgroundColor: Colors.primary + '20', borderColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: Typography.sizes.sm },
  chipTextSelected: { color: Colors.primary, fontWeight: Typography.weights.semibold },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
