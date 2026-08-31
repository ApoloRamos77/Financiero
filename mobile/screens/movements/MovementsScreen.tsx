import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, TextInput, TouchableOpacity, Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { movementService, contributorService } from '../../services/api';
import { MovementItem, SectionHeader, EmptyState, Button, DatePickerField } from '../../components/ui';
import { formatDate } from '../../utils/helpers';

const TYPES = [
  { value: '', label: 'Todos' },
  { value: 'Income', label: '📈 Ingresos' },
  { value: 'Expense', label: '📉 Gastos' },
];

export default function MovementsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [contributor, setContributor] = useState('');

  const { data: contributors } = useQuery({ queryKey: ['contributors'], queryFn: contributorService.getAll });

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['movements', typeFilter, page],
    queryFn: () => movementService.getAll({
      type: typeFilter || undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
      contributorId: contributor || undefined,
      page,
      pageSize: 30,
    }),
  });

  const movements = data?.items || [];
  const totalPages = data?.totalPages || 1;

  const filtered = search.trim()
    ? movements.filter((m: any) =>
        m.concept.toLowerCase().includes(search.toLowerCase()) ||
        m.categoryName?.toLowerCase().includes(search.toLowerCase())
      )
    : movements;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Movimientos</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('Expense')}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Agregar</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por concepto..."
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {/* Type filter & Additional Filters Btn */}
      <View style={styles.filterRowContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {TYPES.map(t => (
            <TouchableOpacity
              key={t.value}
              style={[styles.filterChip, typeFilter === t.value && styles.filterChipActive]}
              onPress={() => { setTypeFilter(t.value); setPage(1); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, typeFilter === t.value && styles.filterChipTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(true)}>
          <Text style={styles.filterBtnText}>Filtros {((fromDate || toDate || contributor) ? '(+)' : '')}</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loading}><Text style={styles.loadingText}>Cargando...</Text></View>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📋"
            title="Sin movimientos"
            subtitle="Registra tu primer ingreso o gasto"
            action="Registrar"
            onAction={() => navigation.navigate('Expense')}
          />
        ) : (
          <>
            {filtered.map((m: any) => (
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

            {/* Pagination */}
            {totalPages > 1 && (
              <View style={styles.pagination}>
                <TouchableOpacity
                  style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                  onPress={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <Text style={styles.pageBtnText}>← Anterior</Text>
                </TouchableOpacity>
                <Text style={styles.pageIndicator}>{page} / {totalPages}</Text>
                <TouchableOpacity
                  style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
                  onPress={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <Text style={styles.pageBtnText}>Siguiente →</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros Adicionales</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <DatePickerField label="Desde (Fecha)" value={fromDate} onChange={setFromDate} accentColor={Colors.primary} />
              <DatePickerField label="Hasta (Fecha)" value={toDate} onChange={setToDate} accentColor={Colors.primary} />
              
              <Text style={styles.filterLabel}>Aportante</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>
                <TouchableOpacity style={[styles.filterChip, !contributor && styles.filterChipActive]} onPress={() => setContributor('')}>
                  <Text style={[styles.filterChipText, !contributor && styles.filterChipTextActive]}>Todos</Text>
                </TouchableOpacity>
                {Array.isArray(contributors) && contributors.map((c: any) => (
                  <TouchableOpacity key={c.id} style={[styles.filterChip, contributor === c.id && styles.filterChipActive]} onPress={() => setContributor(c.id)}>
                    <Text style={[styles.filterChipText, contributor === c.id && styles.filterChipTextActive]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <Button title="Aplicar" onPress={() => { setPage(1); setShowFilters(false); }} style={{ marginTop: 16 }} />
              <Button title="Limpiar Filtros" variant="outline" onPress={() => { setFromDate(''); setToDate(''); setContributor(''); setPage(1); setShowFilters(false); }} style={{ marginTop: 8, marginBottom: 32 }} />
            </ScrollView>
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
  addBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.base, paddingVertical: 8, borderRadius: BorderRadius.full },
  addBtnText: { color: Colors.white, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  searchContainer: { paddingHorizontal: Spacing.base, marginBottom: Spacing.sm },
  searchInput: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: 10, fontSize: Typography.sizes.base, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  filterRowContainer: { flexDirection: 'row', paddingHorizontal: Spacing.base, marginBottom: Spacing.sm, alignItems: 'center' },
  filterRow: { gap: 8, paddingRight: 16 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary + '20', borderColor: Colors.primary },
  filterChipText: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.primary, fontWeight: Typography.weights.semibold },
  loading: { padding: Spacing.xl, alignItems: 'center' },
  loadingText: { color: Colors.textSecondary },
  pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base, marginTop: Spacing.sm },
  pageBtn: { paddingHorizontal: Spacing.base, paddingVertical: 8, backgroundColor: Colors.surface, borderRadius: BorderRadius.md },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { color: Colors.primary, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium },
  pageIndicator: { color: Colors.textSecondary, fontSize: Typography.sizes.sm },
  
  filterBtn: { backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, marginLeft: 8 },
  filterBtnText: { color: Colors.primary, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.bg, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.text },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: Colors.textSecondary, fontSize: 16 },
  modalBody: { padding: Spacing.base },
  filterLabel: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginBottom: 8, marginTop: 16, fontWeight: Typography.weights.medium },
});
