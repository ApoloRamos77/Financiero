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

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function VenturesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const today = new Date();
  
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', icon: '🏪', color: '#F59E0B' });

  const { data: ventures = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['ventures', year, month],
    queryFn: () => ventureService.getAll(year, month),
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

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const filteredVentures = ventures.filter((v: any) => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const activeVentures = filteredVentures.filter((v: any) => v.status === 'Active');
  const inactiveVentures = filteredVentures.filter((v: any) => v.status !== 'Active');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Emprendimientos</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}><Text style={styles.navBtnText}>‹</Text></TouchableOpacity>
        <Text style={styles.monthLabel}>{MONTHS[month - 1]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}><Text style={styles.navBtnText}>›</Text></TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar emprendimiento..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loading}><Text style={styles.loadingText}>Cargando...</Text></View>
        ) : filteredVentures.length === 0 ? (
          <EmptyState
            icon="🏪"
            title="Sin resultados"
            subtitle="No se encontraron emprendimientos con esos criterios."
            action={ventures.length === 0 ? "Crear emprendimiento" : undefined}
            onAction={ventures.length === 0 ? () => setShowModal(true) : undefined}
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
                    income={v.income ?? 0}
                    expense={v.expense ?? 0}
                    profit={v.profit ?? 0}
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
                    income={v.income ?? 0}
                    expense={v.expense ?? 0}
                    profit={v.profit ?? 0}
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
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: Spacing.base, marginBottom: Spacing.sm, backgroundColor: Colors.surface, borderRadius: BorderRadius.full, paddingHorizontal: 4, paddingVertical: 4 },
  navBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  navBtnText: { fontSize: 24, color: Colors.primary, lineHeight: 24, marginTop: -2 },
  monthLabel: { fontSize: Typography.sizes.base, color: Colors.text, fontWeight: Typography.weights.bold, textTransform: 'capitalize' },
  searchContainer: { paddingHorizontal: Spacing.base, marginBottom: Spacing.sm },
  searchInput: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: 10, fontSize: Typography.sizes.sm, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
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
