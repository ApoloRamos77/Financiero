import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { movementService, contributorService, categoryService, accountService } from '../../services/api';
import { useAppStore, flatCategories } from '../../store';
import { Button, ScreenHeader, DatePickerField } from '../../components/ui';
import { PAYMENT_METHODS } from '../../constants/theme';
import { todayString } from '../../utils/helpers';

type RouteParams = { movementId?: string };

interface IncomeScreenProps {
  type: 'Income' | 'Expense';
}

function MovementFormScreen({ type }: IncomeScreenProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, RouteParams>>>();
  const movementId = route.params?.movementId;
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [date, setDate] = useState(todayString());
  const [notes, setNotes] = useState('');
  const [selectedContributor, setSelectedContributor] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedVenture, setSelectedVenture] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const { data: contributors } = useQuery({ queryKey: ['contributors'], queryFn: contributorService.getAll });
  const { data: rawCategories } = useQuery({ queryKey: ['categories'], queryFn: categoryService.getAll });
  const { data: accounts } = useQuery({ queryKey: ['accounts'], queryFn: accountService.getAll });
  const { ventures } = useAppStore();

  const categories = Array.isArray(rawCategories) ? flatCategories(rawCategories).filter((c: any) =>
    c.type === type || c.type === 'Both'
  ) : [];

  const accentColor = type === 'Income' ? Colors.income : Colors.expense;
  const title = type === 'Income' ? '+ Registrar Ingreso' : '- Registrar Gasto';
  const icon = type === 'Income' ? '📈' : '📉';

  const createMutation = useMutation({
    mutationFn: (data: object) => movementService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      Alert.alert('✅ Registrado', `${type === 'Income' ? 'Ingreso' : 'Gasto'} registrado correctamente.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
        { text: 'Otro', style: 'cancel', onPress: () => {
          setAmount(''); setConcept(''); setNotes('');
        }},
      ]);
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.message || 'Error al registrar.');
    },
  });

  const handleSave = () => {
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido mayor a cero.');
      return;
    }
    if (!concept.trim()) {
      Alert.alert('Error', 'Ingresa un concepto o descripción.');
      return;
    }

    createMutation.mutate({
      movementDate: date,
      type,
      amount: parsedAmount,
      concept: concept.trim(),
      contributorId: selectedContributor || undefined,
      categoryId: selectedCategory || undefined,
      ventureId: selectedVenture || undefined,
      accountId: selectedAccount || undefined,
      paymentMethod,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: accentColor + '30' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn} activeOpacity={0.7}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: accentColor }]}>
          {icon} {type === 'Income' ? 'Registrar Ingreso' : 'Registrar Gasto'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>

        {/* Amount */}
        <View style={[styles.amountSection, { backgroundColor: accentColor + '10' }]}>
          <Text style={styles.amountCurrency}>S/</Text>
          <TextInput
            style={[styles.amountInput, { color: accentColor }]}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={accentColor + '50'}
            keyboardType="decimal-pad"
            autoFocus
          />
        </View>

        <View style={styles.form}>
          {/* Concept */}
          <View style={styles.field}>
            <Text style={styles.label}>Concepto *</Text>
            <TextInput
              style={styles.input}
              value={concept}
              onChangeText={setConcept}
              placeholder={type === 'Income' ? 'Ej: Salario Enero' : 'Ej: Compras supermercado'}
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          {/* Date */}
          <DatePickerField
            label="Fecha *"
            value={date}
            onChange={setDate}
            accentColor={accentColor}
          />

          {/* Contributor */}
          {(contributors?.length ?? 0) > 0 && (
            <View style={styles.field}>
              <Text style={styles.label}>Responsable</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                <TouchableOpacity
                  style={[styles.chip, !selectedContributor && styles.chipSelected]}
                  onPress={() => setSelectedContributor('')}
                >
                  <Text style={[styles.chipText, !selectedContributor && styles.chipTextSelected]}>Ninguno</Text>
                </TouchableOpacity>
                {Array.isArray(contributors) && contributors.map((c: any) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.chip, selectedContributor === c.id && styles.chipSelected]}
                    onPress={() => setSelectedContributor(c.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, selectedContributor === c.id && styles.chipTextSelected]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Category */}
          {categories.length > 0 && (
            <View style={styles.field}>
              <Text style={styles.label}>Categoría</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {categories.map((c: any) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.chip, selectedCategory === c.id && { ...styles.chipSelected, borderColor: c.color }]}
                    onPress={() => setSelectedCategory(selectedCategory === c.id ? '' : c.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, selectedCategory === c.id && { ...styles.chipTextSelected, color: c.color }]}>
                      {c.icon} {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Venture */}
          {ventures.length > 0 && (
            <View style={styles.field}>
              <Text style={styles.label}>Emprendimiento</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                <TouchableOpacity
                  style={[styles.chip, !selectedVenture && styles.chipSelected]}
                  onPress={() => setSelectedVenture('')}
                >
                  <Text style={[styles.chipText, !selectedVenture && styles.chipTextSelected]}>Ninguno</Text>
                </TouchableOpacity>
                {Array.isArray(ventures) && ventures.filter((v: any) => v.status === 'Active').map((v: any) => (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.chip, selectedVenture === v.id && styles.chipSelected]}
                    onPress={() => setSelectedVenture(v.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, selectedVenture === v.id && styles.chipTextSelected]}>
                      {v.icon} {v.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Account */}
          {(accounts?.length ?? 0) > 0 && (
            <View style={styles.field}>
              <Text style={styles.label}>Cuenta</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                <TouchableOpacity
                  style={[styles.chip, !selectedAccount && styles.chipSelected]}
                  onPress={() => setSelectedAccount('')}
                >
                  <Text style={[styles.chipText, !selectedAccount && styles.chipTextSelected]}>Sin cuenta</Text>
                </TouchableOpacity>
                {Array.isArray(accounts) && accounts.filter((a: any) => a.isActive).map((a: any) => (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.chip, selectedAccount === a.id && styles.chipSelected]}
                    onPress={() => setSelectedAccount(a.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, selectedAccount === a.id && styles.chipTextSelected]}>
                      {a.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Payment Method */}
          <View style={styles.field}>
            <Text style={styles.label}>Medio de pago</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {PAYMENT_METHODS.map(pm => (
                <TouchableOpacity
                  key={pm.value}
                  style={[styles.chip, paymentMethod === pm.value && styles.chipSelected]}
                  onPress={() => setPaymentMethod(pm.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, paymentMethod === pm.value && styles.chipTextSelected]}>
                    {pm.icon} {pm.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Notes */}
          <View style={styles.field}>
            <Text style={styles.label}>Notas (opcional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Observaciones adicionales..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Save Button */}
        <View style={{ paddingHorizontal: Spacing.base }}>
          <Button
            title={`Registrar ${type === 'Income' ? 'Ingreso' : 'Gasto'}`}
            onPress={handleSave}
            loading={createMutation.isPending}
            style={{ backgroundColor: accentColor }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function IncomeScreen() {
  return <MovementFormScreen type="Income" />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm, borderBottomWidth: 1 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 16, color: Colors.textSecondary },
  headerTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  scroll: { paddingTop: Spacing.base },
  amountSection: { marginHorizontal: Spacing.base, borderRadius: BorderRadius.xl, padding: Spacing.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  amountCurrency: { fontSize: Typography.sizes['3xl'], color: Colors.textSecondary, marginRight: 8, fontWeight: Typography.weights.bold },
  amountInput: { fontSize: 48, fontWeight: Typography.weights.extrabold, minWidth: 150, textAlign: 'center' },
  form: { paddingHorizontal: Spacing.base },
  field: { marginBottom: Spacing.base },
  label: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, fontWeight: Typography.weights.medium, marginBottom: 6 },
  input: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: 12, fontSize: Typography.sizes.base, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  notesInput: { height: 80, textAlignVertical: 'top' },
  chipRow: { gap: 8, paddingVertical: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  chipSelected: { backgroundColor: Colors.primary + '20', borderColor: Colors.primary },
  chipText: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  chipTextSelected: { color: Colors.primary, fontWeight: Typography.weights.semibold },
});
