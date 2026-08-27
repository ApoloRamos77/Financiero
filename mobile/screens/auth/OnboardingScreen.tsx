import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { contributorService, accountService } from '../../services/api';
import { useAuthStore } from '../../store';

// ─── Types ────────────────────────────────────────────────────

type ContributorForm = {
  name: string;
  contributorType: string;
  fixedIncome: string;
  frequency: string;
  paymentDay: string;
};

type AccountForm = {
  name: string;
  accountType: string;
  balance: string;
  color: string;
  bankName: string;
};

const CONTRIBUTOR_TYPES = [
  { value: 'Salary', label: 'Salario', icon: '💼' },
  { value: 'Freelance', label: 'Freelance', icon: '💻' },
  { value: 'Business', label: 'Negocio', icon: '🏪' },
  { value: 'Investment', label: 'Inversión', icon: '📈' },
  { value: 'Other', label: 'Otro', icon: '➕' },
];

const FREQUENCIES = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'biweekly', label: 'Quincenal' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'variable', label: 'Variable' },
];

const ACCOUNT_TYPES = [
  { value: 'Cash', label: 'Efectivo', icon: '💵' },
  { value: 'BankAccount', label: 'Banco', icon: '🏦' },
  { value: 'CreditCard', label: 'Crédito', icon: '💳' },
  { value: 'DebitCard', label: 'Débito', icon: '💳' },
  { value: 'DigitalWallet', label: 'Digital', icon: '📱' },
];

const ACCOUNT_COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B',
  '#EF4444', '#EC4899', '#06B6D4', '#F97316',
];

const ACCOUNT_QUICK = [
  { name: 'Efectivo', accountType: 'Cash', color: '#10B981' },
  { name: 'BCP', accountType: 'BankAccount', color: '#3B82F6' },
  { name: 'Yape', accountType: 'DigitalWallet', color: '#8B5CF6' },
  { name: 'Interbank', accountType: 'BankAccount', color: '#F59E0B' },
  { name: 'Plin', accountType: 'DigitalWallet', color: '#EC4899' },
];

const emptyContributor = (): ContributorForm => ({
  name: '', contributorType: 'Salary', fixedIncome: '', frequency: 'monthly', paymentDay: '',
});

const emptyAccount = (): AccountForm => ({
  name: '', accountType: 'Cash', balance: '', color: ACCOUNT_COLORS[0], bankName: '',
});

// ─── Main Component ───────────────────────────────────────────

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { setOnboardingComplete } = useAuthStore();

  const [step, setStep] = useState<3 | 4>(3);
  const [loading, setLoading] = useState(false);

  const [contributors, setContributors] = useState<ContributorForm[]>([emptyContributor()]);
  const [accounts, setAccounts] = useState<AccountForm[]>([emptyAccount()]);

  // ─── Contributor helpers ──────────────────────────────────────
  const updateContributor = (index: number, field: keyof ContributorForm, value: string) => {
    setContributors(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };
  const addContributor = () => setContributors(prev => [...prev, emptyContributor()]);
  const removeContributor = (index: number) => {
    if (contributors.length === 1) return;
    setContributors(prev => prev.filter((_, i) => i !== index));
  };

  // ─── Account helpers ──────────────────────────────────────────
  const updateAccount = (index: number, field: keyof AccountForm, value: string) => {
    setAccounts(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a));
  };
  const addAccount = () => setAccounts(prev => [...prev, emptyAccount()]);
  const removeAccount = (index: number) => {
    if (accounts.length === 1) return;
    setAccounts(prev => prev.filter((_, i) => i !== index));
  };
  const addQuickAccount = (template: typeof ACCOUNT_QUICK[0]) => {
    const exists = accounts.some(a => a.name === template.name);
    if (exists) return;
    const newAcc: AccountForm = {
      ...emptyAccount(),
      name: template.name,
      accountType: template.accountType,
      color: template.color,
    };
    setAccounts(prev => {
      const lastEmptyIdx = prev.findIndex(a => !a.name.trim());
      if (lastEmptyIdx >= 0) {
        return prev.map((a, i) => i === lastEmptyIdx ? newAcc : a);
      }
      return [...prev, newAcc];
    });
  };

  // ─── Save contributors ────────────────────────────────────────
  const saveContributors = async () => {
    const valid = contributors.filter(c => c.name.trim());
    setLoading(true);
    try {
      for (const c of valid) {
        await contributorService.create({
          name: c.name.trim(),
          contributorType: c.contributorType,
          fixedIncome: parseFloat(c.fixedIncome) || 0,
          frequency: c.frequency,
          paymentDay: c.paymentDay ? parseInt(c.paymentDay) : null,
          isActive: true,
        });
      }
      setStep(4);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'No se pudieron guardar los aportantes.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Save accounts and finish ─────────────────────────────────
  const saveAccountsAndFinish = async () => {
    const valid = accounts.filter(a => a.name.trim());
    setLoading(true);
    try {
      for (const a of valid) {
        await accountService.create({
          name: a.name.trim(),
          accountType: a.accountType,
          balance: parseFloat(a.balance) || 0,
          color: a.color,
          bankName: a.bankName.trim() || undefined,
          isActive: true,
        });
      }
    } catch (e: any) {
      console.warn('Account save error:', e?.response?.data?.message);
    } finally {
      setLoading(false);
      await setOnboardingComplete();
    }
  };

  const skipAndFinish = async () => await setOnboardingComplete();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>{step === 3 ? '👥' : '💳'}</Text>
          </View>
          <Text style={styles.title}>
            {step === 3 ? 'Aportantes al hogar' : 'Cuentas y medios de pago'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 3
              ? '¿Quiénes generan ingresos en tu familia?'
              : '¿Qué cuentas o billeteras usas?'}
          </Text>
        </View>

        {/* Step indicators */}
        <View style={styles.stepsRow}>
          {([3, 4] as const).map((s, i) => (
            <React.Fragment key={s}>
              <View style={styles.stepWrapper}>
                <View style={[styles.stepCircle, step >= s && styles.stepCircleActive]}>
                  <Text style={[styles.stepNum, step >= s && styles.stepNumActive]}>{i + 1}</Text>
                </View>
                <Text style={[styles.stepLabel, step >= s && styles.stepLabelActive]}>
                  {s === 3 ? 'Aportantes' : 'Cuentas'}
                </Text>
              </View>
              {i < 1 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
            </React.Fragment>
          ))}
        </View>

        {/* ── Step 3: Contributors ─────────────────────────── */}
        {step === 3 && (
          <>
            {contributors.map((c, idx) => (
              <ContributorCard
                key={idx}
                data={c}
                index={idx}
                canRemove={contributors.length > 1}
                onUpdate={(field, value) => updateContributor(idx, field, value)}
                onRemove={() => removeContributor(idx)}
              />
            ))}

            <TouchableOpacity style={styles.addBtn} onPress={addContributor} activeOpacity={0.7}>
              <Text style={styles.addBtnText}>＋ Agregar otro aportante</Text>
            </TouchableOpacity>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.skipBtn} onPress={() => setStep(4)} activeOpacity={0.7}>
                <Text style={styles.skipText}>Saltar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                onPress={saveContributors}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={Colors.white} size="small" />
                  : <Text style={styles.primaryBtnText}>Siguiente →</Text>
                }
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── Step 4: Accounts ─────────────────────────────── */}
        {step === 4 && (
          <>
            {/* Quick suggestions */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Accesos rápidos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
                {ACCOUNT_QUICK.map(q => (
                  <TouchableOpacity
                    key={q.name}
                    style={[styles.quickChip, { borderColor: q.color }]}
                    onPress={() => addQuickAccount(q)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.quickChipText, { color: q.color }]}>+ {q.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {accounts.map((a, idx) => (
              <AccountCard
                key={idx}
                data={a}
                index={idx}
                canRemove={accounts.length > 1}
                onUpdate={(field, value) => updateAccount(idx, field, value)}
                onRemove={() => removeAccount(idx)}
              />
            ))}

            <TouchableOpacity style={styles.addBtn} onPress={addAccount} activeOpacity={0.7}>
              <Text style={styles.addBtnText}>＋ Agregar otra cuenta</Text>
            </TouchableOpacity>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.skipBtn} onPress={skipAndFinish} activeOpacity={0.7}>
                <Text style={styles.skipText}>Saltar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                onPress={saveAccountsAndFinish}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={Colors.white} size="small" />
                  : <Text style={styles.primaryBtnText}>Finalizar ✓</Text>
                }
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Contributor Card ─────────────────────────────────────────

function ContributorCard({ data, index, canRemove, onUpdate, onRemove }: {
  data: ContributorForm; index: number; canRemove: boolean;
  onUpdate: (field: keyof ContributorForm, value: string) => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Aportante {index + 1}</Text>
        {canRemove && (
          <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
            <Text style={styles.removeBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <Field label="Nombre completo *" value={data.name}
        onChange={v => onUpdate('name', v)} placeholder="Ej: Juan García" />

      <Text style={styles.inputLabel}>Tipo de ingreso</Text>
      <View style={styles.chipGrid}>
        {CONTRIBUTOR_TYPES.map(t => (
          <TouchableOpacity
            key={t.value}
            style={[styles.chip, data.contributorType === t.value && styles.chipActive]}
            onPress={() => onUpdate('contributorType', t.value)}
            activeOpacity={0.7}
          >
            <Text style={styles.chipIcon}>{t.icon}</Text>
            <Text style={[styles.chipText, data.contributorType === t.value && styles.chipTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Field label="Ingreso fijo" value={data.fixedIncome}
        onChange={v => onUpdate('fixedIncome', v)} placeholder="0.00" keyboard="numeric" />

      <Text style={styles.inputLabel}>Frecuencia</Text>
      <View style={styles.chipRowSmall}>
        {FREQUENCIES.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[styles.chipSmall, data.frequency === f.value && styles.chipSmallActive]}
            onPress={() => onUpdate('frequency', f.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipSmallText, data.frequency === f.value && styles.chipSmallTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Account Card ─────────────────────────────────────────────

function AccountCard({ data, index, canRemove, onUpdate, onRemove }: {
  data: AccountForm; index: number; canRemove: boolean;
  onUpdate: (field: keyof AccountForm, value: string) => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.accountDot, { backgroundColor: data.color }]} />
        <Text style={styles.cardTitle}>Cuenta {index + 1}</Text>
        {canRemove && (
          <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
            <Text style={styles.removeBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <Field label="Nombre *" value={data.name}
        onChange={v => onUpdate('name', v)} placeholder="Ej: Efectivo, BCP Ahorros..." />

      <Text style={styles.inputLabel}>Tipo</Text>
      <View style={styles.chipGrid}>
        {ACCOUNT_TYPES.map(t => (
          <TouchableOpacity
            key={t.value}
            style={[styles.chip, data.accountType === t.value && styles.chipActive]}
            onPress={() => onUpdate('accountType', t.value)}
            activeOpacity={0.7}
          >
            <Text style={styles.chipIcon}>{t.icon}</Text>
            <Text style={[styles.chipText, data.accountType === t.value && styles.chipTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Field label="Saldo inicial" value={data.balance}
        onChange={v => onUpdate('balance', v)} placeholder="0.00" keyboard="numeric" />

      <Text style={styles.inputLabel}>Color</Text>
      <View style={styles.colorRow}>
        {ACCOUNT_COLORS.map(color => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorDot,
              { backgroundColor: color },
              data.color === color && styles.colorDotSelected,
            ]}
            onPress={() => onUpdate('color', color)}
            activeOpacity={0.8}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Shared Field ─────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, keyboard }: {
  label: string; value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboard?: any;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboard || 'default'}
        autoCapitalize="sentences"
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.base },

  header: { alignItems: 'center', marginBottom: Spacing.xl },
  logoContainer: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.primary + '40',
  },
  logoEmoji: { fontSize: 36 },
  title: {
    fontSize: Typography.sizes['2xl'], color: Colors.text,
    fontWeight: Typography.weights.bold, textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sizes.sm, color: Colors.textSecondary,
    marginTop: 4, textAlign: 'center',
  },

  stepsRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginBottom: Spacing.xl,
  },
  stepWrapper: { flexDirection: 'row', alignItems: 'center' },
  stepCircle: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.surfaceHigh,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  stepCircleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepNum: { fontSize: 13, color: Colors.textMuted, fontWeight: Typography.weights.bold },
  stepNumActive: { color: Colors.white },
  stepLabel: {
    fontSize: Typography.sizes.xs, color: Colors.textMuted,
    marginLeft: 6, marginRight: 10,
  },
  stepLabelActive: { color: Colors.primary, fontWeight: Typography.weights.semibold },
  stepLine: { width: 28, height: 2, backgroundColor: Colors.border, marginHorizontal: 4 },
  stepLineActive: { backgroundColor: Colors.primary },

  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius['2xl'],
    padding: Spacing.base, marginBottom: Spacing.base,
    ...Shadows.md, borderWidth: 1, borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm,
  },
  cardTitle: {
    flex: 1, fontSize: Typography.sizes.base,
    color: Colors.text, fontWeight: Typography.weights.semibold,
  },
  accountDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  removeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.expense + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  removeBtnText: { color: Colors.expense, fontSize: 12, fontWeight: Typography.weights.bold },

  inputGroup: { marginBottom: Spacing.sm },
  inputLabel: {
    fontSize: Typography.sizes.xs, color: Colors.textSecondary,
    fontWeight: Typography.weights.medium, marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.surfaceHigh, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base, paddingVertical: 11,
    fontSize: Typography.sizes.base, color: Colors.text,
    borderWidth: 1, borderColor: Colors.border,
  },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceHigh,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary + '20', borderColor: Colors.primary },
  chipIcon: { fontSize: 13 },
  chipText: { fontSize: Typography.sizes.xs, color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary, fontWeight: Typography.weights.semibold },

  chipRowSmall: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.sm },
  chipSmall: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: BorderRadius.sm, backgroundColor: Colors.surfaceHigh,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipSmallActive: { backgroundColor: Colors.income + '20', borderColor: Colors.income },
  chipSmallText: { fontSize: Typography.sizes.xs, color: Colors.textSecondary },
  chipSmallTextActive: { color: Colors.income, fontWeight: Typography.weights.semibold },

  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.sm },
  colorDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  colorDotSelected: { borderColor: Colors.white, transform: [{ scale: 1.15 }] },

  section: { marginBottom: Spacing.sm },
  sectionLabel: {
    fontSize: Typography.sizes.xs, color: Colors.textMuted,
    fontWeight: Typography.weights.medium, marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  quickRow: { gap: 8, paddingBottom: 4 },
  quickChip: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: BorderRadius.full, borderWidth: 1,
    backgroundColor: Colors.surfaceHigh,
  },
  quickChipText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },

  addBtn: {
    alignItems: 'center', paddingVertical: 12,
    borderRadius: BorderRadius.lg, borderWidth: 1,
    borderStyle: 'dashed', borderColor: Colors.primary + '60',
    marginBottom: Spacing.xl,
  },
  addBtnText: { color: Colors.primary, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },

  actionRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  skipBtn: {
    paddingHorizontal: Spacing.base, paddingVertical: 13,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border,
  },
  skipText: { color: Colors.textSecondary, fontSize: Typography.sizes.sm },
  primaryBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary, ...Shadows.lg,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: Colors.white, fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold },
});
