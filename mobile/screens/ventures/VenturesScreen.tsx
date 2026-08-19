import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl, Modal, TextInput
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { ventureService } from '../../services/api';
import { VentureCard, EmptyState, Button } from '../../components/ui';
import { formatCurrency } from '../../utils/helpers';

export default function VenturesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', icon: '🏪', color: '#F59E0B' });

  const { data: ventures = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['ventures'],
    queryFn: ventureService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => ventureService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventures'] });
      setShowModal(false);
      setForm({ name: '', description: '', icon: '🏪', color: '#F59E0B' });
    },
    onError: () => Alert.alert('Error', 'No se pudo crear el emprendimiento.'),
  });

  const handleCreate = () => {
    if (!form.name.trim()) { Alert.alert('Error', 'Ingresa el nombre del emprendimiento.'); return; }
    createMutation.mutate({ name: form.name, description: form.description, icon: form.icon, color: form.color });
  };

  const activeVentures = ventures.filter((v: any) => v.status === 'Active');
  const inactiveVentures = ventures.filter((v: any) => v.status !== 'Active');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Emprendimientos</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loading}><Text style={styles.loadingText}>Cargando...</Text></View>
        ) : ventures.length === 0 ? (
          <EmptyState
            icon="🏪"
            title="Sin emprendimientos"
            subtitle="Registra tus negocios y emprendimientos para rastrear su rentabilidad"
            action="Crear emprendimiento"
            onAction={() => setShowModal(true)}
          />
        ) : (
          <>
            {activeVentures.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>🟢 Activos ({activeVentures.length})</Text>
                </View>
                {activeVentures.map((v: any) => (
                  <VentureCard
                    key={v.id}
                    name={v.name}
                    income={0}
                    expense={0}
                    profit={0}
                    icon={v.icon}
                    color={v.color}
                    onPress={() => navigation.navigate('VentureDetail', { ventureId: v.id })}
                  />
                ))}
              </>
            )}

            {inactiveVentures.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>⏸ Inactivos ({inactiveVentures.length})</Text>
                </View>
                {inactiveVentures.map((v: any) => (
                  <VentureCard
                    key={v.id}
                    name={v.name}
                    income={0}
                    expense={0}
                    profit={0}
                    icon={v.icon}
                    color={Colors.textMuted}
                    onPress={() => navigation.navigate('VentureDetail', { ventureId: v.id })}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo Emprendimiento</Text>

            <Text style={styles.inputLabel}>Nombre *</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
              placeholder="Ej: Panadería El Buen Pan"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.inputLabel}>Descripción</Text>
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
              value={form.description}
              onChangeText={v => setForm(f => ({ ...f, description: v }))}
              placeholder="Describe el emprendimiento..."
              placeholderTextColor={Colors.textMuted}
              multiline
            />

            <Text style={styles.inputLabel}>Ícono</Text>
            <View style={styles.iconRow}>
              {['🏪', '🍕', '💻', '👗', '🎵', '📚', '🌱', '🏗️', '🚗', '💊'].map(ico => (
                <TouchableOpacity
                  key={ico}
                  style={[styles.iconChip, form.icon === ico && styles.iconChipSelected]}
                  onPress={() => setForm(f => ({ ...f, icon: ico }))}
                >
                  <Text style={{ fontSize: 20 }}>{ico}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button title="Cancelar" onPress={() => setShowModal(false)} variant="ghost" style={{ flex: 1, marginRight: 8 }} />
              <Button title="Crear" onPress={handleCreate} loading={createMutation.isPending} style={{ flex: 2 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm },
  title: { fontSize: Typography.sizes['2xl'], color: Colors.text, fontWeight: Typography.weights.bold },
  addBtn: { backgroundColor: Colors.venture, paddingHorizontal: Spacing.base, paddingVertical: 8, borderRadius: BorderRadius.full },
  addBtnText: { color: Colors.white, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  loading: { padding: Spacing.xl, alignItems: 'center' },
  loadingText: { color: Colors.textSecondary },
  sectionHeader: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  sectionTitle: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, fontWeight: Typography.weights.semibold },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.border },
  modalTitle: { fontSize: Typography.sizes.xl, color: Colors.text, fontWeight: Typography.weights.bold, marginBottom: Spacing.lg },
  inputLabel: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginBottom: 6, marginTop: Spacing.sm },
  input: { backgroundColor: Colors.surfaceHigh, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: 12, fontSize: Typography.sizes.base, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.base },
  iconChip: { width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceHigh, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  iconChipSelected: { backgroundColor: Colors.primary + '20', borderColor: Colors.primary },
  modalActions: { flexDirection: 'row', marginTop: Spacing.base },
});
