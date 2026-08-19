import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { movementService } from '../../services/api';
import { getCalendarDayColor } from '../../utils/helpers';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS_OF_WEEK = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { data: calendarData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['calendar', year, month],
    queryFn: () => movementService.getCalendar(year, month),
  });

  const { data: compliance } = useQuery({
    queryKey: ['compliance', year, month],
    queryFn: () => movementService.getCompliance(year, month),
  });

  const { data: dayMovements } = useQuery({
    queryKey: ['movements', selectedDay],
    queryFn: () => selectedDay ? movementService.getAll({ from: selectedDay, to: selectedDay, page: 1, pageSize: 50 }) : null,
    enabled: !!selectedDay,
  });

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const dayMap = new Map((calendarData?.days || []).map((d: any) => [d.date, d]));
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(adjustedFirstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Calendario Financiero</Text>

      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}><Text style={styles.navBtnText}>‹</Text></TouchableOpacity>
        <Text style={styles.monthLabel}>{MONTHS[month - 1]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}><Text style={styles.navBtnText}>›</Text></TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {compliance && (
          <View style={styles.complianceBanner}>
            <View style={styles.complianceStat}>
              <Text style={styles.complianceNum}>{compliance.daysWithRecords}</Text>
              <Text style={styles.complianceLabel}>Con registros</Text>
            </View>
            <View style={styles.complianceStat}>
              <Text style={[styles.complianceNum, { color: Colors.expense }]}>{compliance.daysWithoutRecords}</Text>
              <Text style={styles.complianceLabel}>Sin registros</Text>
            </View>
            <View style={styles.complianceStat}>
              <Text style={[styles.complianceNum, { color: compliance.compliancePercentage >= 80 ? Colors.income : compliance.compliancePercentage >= 50 ? Colors.warning : Colors.expense }]}>
                {compliance.compliancePercentage.toFixed(0)}%
              </Text>
              <Text style={styles.complianceLabel}>Cumplimiento</Text>
            </View>
          </View>
        )}

        <View style={styles.dayHeaders}>
          {DAYS_OF_WEEK.map(d => <View key={d} style={styles.dayHeader}><Text style={styles.dayHeaderText}>{d}</Text></View>)}
        </View>

        <View style={styles.legend}>
          {[{ color: Colors.income, label: 'Ingreso' }, { color: Colors.warning, label: 'Gasto' }, { color: Colors.primary, label: 'Ambos' }, { color: Colors.expense, label: 'Sin registro' }].map(l => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.color }]} />
              <Text style={styles.legendText}>{l.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {cells.map((day, index) => {
            if (day === null) return <View key={`empty-${index}`} style={styles.calendarCell} />;
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayData = dayMap.get(dateStr);
            const isToday = today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day;
            const isPast = new Date(dateStr) < new Date(today.toDateString());
            const isSelected = selectedDay === dateStr;

            let dotColor = 'transparent';
            if (dayData?.hasRecords) dotColor = getCalendarDayColor(dayData.hasIncome, dayData.hasExpense, dayData.hasRecords);
            else if (isPast && !isToday) dotColor = Colors.expense;

            return (
              <TouchableOpacity key={dateStr} style={[styles.calendarCell, isToday && styles.cellToday, isSelected && styles.cellSelected]} onPress={() => setSelectedDay(isSelected ? null : dateStr)} activeOpacity={0.7}>
                <Text style={[styles.dayText, isToday && styles.dayTextToday, isSelected && styles.dayTextSelected]}>{day}</Text>
                {dotColor !== 'transparent' && <View style={[styles.calendarDot, { backgroundColor: dotColor }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedDay && (
          <View style={styles.dayDetail}>
            <Text style={styles.dayDetailTitle}>
              {new Date(selectedDay + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            {(!dayMovements?.items || dayMovements.items.length === 0) ? (
              <View style={styles.noRecords}>
                <Text style={styles.noRecordsText}>📋 Sin movimientos</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('Income')}><Text style={styles.addBtnText}>+ Agregar</Text></TouchableOpacity>
              </View>
            ) : (
              <>
                {dayMovements.items.map((m: any) => (
                  <TouchableOpacity key={m.id} style={styles.movementRow} onPress={() => navigation.navigate('MovementDetail', { movementId: m.id })}>
                    <View style={[styles.movDot, { backgroundColor: m.type === 'Income' ? Colors.income : Colors.expense }]} />
                    <Text style={styles.movConcept} numberOfLines={1}>{m.concept}</Text>
                    <Text style={[styles.movAmount, { color: m.type === 'Income' ? Colors.income : Colors.expense }]}>
                      {m.type === 'Income' ? '+' : '-'} S/ {m.amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  title: { fontSize: Typography.sizes['2xl'], color: Colors.text, fontWeight: Typography.weights.bold, paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, marginBottom: Spacing.sm },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  navBtnText: { fontSize: 22, color: Colors.text, fontWeight: Typography.weights.bold },
  monthLabel: { fontSize: Typography.sizes.lg, color: Colors.text, fontWeight: Typography.weights.semibold },
  complianceBanner: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: Colors.surface, marginHorizontal: Spacing.base, borderRadius: BorderRadius.lg, padding: Spacing.sm, marginBottom: Spacing.sm },
  complianceStat: { alignItems: 'center' },
  complianceNum: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.income },
  complianceLabel: { fontSize: Typography.sizes.xs, color: Colors.textMuted },
  dayHeaders: { flexDirection: 'row', paddingHorizontal: Spacing.sm, marginBottom: 4 },
  dayHeader: { flex: 1, alignItems: 'center' },
  dayHeaderText: { fontSize: Typography.sizes.xs, color: Colors.textMuted, fontWeight: Typography.weights.semibold },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: Spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: Typography.sizes.xs, color: Colors.textMuted },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.sm },
  calendarCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  cellToday: { backgroundColor: Colors.primary + '20', borderRadius: BorderRadius.md },
  cellSelected: { backgroundColor: Colors.primary + '30', borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.primary },
  dayText: { fontSize: Typography.sizes.sm, color: Colors.text, fontWeight: Typography.weights.medium },
  dayTextToday: { color: Colors.primary, fontWeight: Typography.weights.bold },
  dayTextSelected: { color: Colors.primary },
  calendarDot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
  dayDetail: { backgroundColor: Colors.surface, marginHorizontal: Spacing.base, borderRadius: BorderRadius.xl, padding: Spacing.base, marginTop: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  dayDetailTitle: { fontSize: Typography.sizes.base, color: Colors.text, fontWeight: Typography.weights.semibold, marginBottom: Spacing.sm, textTransform: 'capitalize' },
  noRecords: { alignItems: 'center', paddingVertical: Spacing.base },
  noRecordsText: { color: Colors.textMuted, fontSize: Typography.sizes.sm },
  addBtn: { marginTop: Spacing.sm, backgroundColor: Colors.primary, paddingHorizontal: Spacing.base, paddingVertical: 8, borderRadius: BorderRadius.full },
  addBtnText: { color: Colors.white, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  movementRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  movDot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.sm },
  movConcept: { flex: 1, fontSize: Typography.sizes.sm, color: Colors.text },
  movAmount: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
});
