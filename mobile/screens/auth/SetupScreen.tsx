import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { authService } from '../../services/api';
import { useAuthStore } from '../../store';
import { Button } from '../../components/ui';

const CURRENCIES = [
  { value: 'PEN', label: 'Sol (S/)', symbol: 'S/' },
  { value: 'USD', label: 'Dólar ($)', symbol: '$' },
  { value: 'EUR', label: 'Euro (€)', symbol: '€' },
  { value: 'COP', label: 'Peso (COP)', symbol: '$' },
];

export default function SetupScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    familyName: '',
    currency: 'PEN',
    currencySymbol: 'S/',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
  });

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSetup = async () => {
    if (form.adminPassword !== form.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    if (form.adminPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const data = await authService.setup({
        familyName: form.familyName,
        currency: form.currency,
        currencySymbol: form.currencySymbol,
        adminName: form.adminName,
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword,
      });
      await setAuth(data.user, data.accessToken, data.refreshToken);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Error al configurar la familia.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}><Text style={styles.logoEmoji}>👨‍👩‍👧‍👦</Text></View>
          <Text style={styles.title}>Configura tu familia</Text>
          <Text style={styles.subtitle}>Crea el grupo financiero familiar</Text>
        </View>

        {/* Step Indicators */}
        <View style={styles.steps}>
          {[1, 2].map(s => (
            <View key={s} style={[styles.stepDot, step >= s && styles.stepDotActive]} />
          ))}
        </View>

        <View style={styles.card}>
          {step === 1 ? (
            <>
              <Text style={styles.stepTitle}>1. Información familiar</Text>
              <Field label="Nombre de la familia *" value={form.familyName} onChange={v => update('familyName', v)} placeholder="Ej: Familia García" />

              <Text style={styles.inputLabel}>Moneda *</Text>
              <View style={styles.currencyRow}>
                {CURRENCIES.map(c => (
                  <TouchableOpacity
                    key={c.value}
                    style={[styles.currencyOption, form.currency === c.value && styles.currencySelected]}
                    onPress={() => { update('currency', c.value); update('currencySymbol', c.symbol); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.currencyLabel, form.currency === c.value && styles.currencyLabelSelected]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button
                title="Siguiente →"
                onPress={() => {
                  if (!form.familyName.trim()) { Alert.alert('Error', 'Ingresa el nombre de la familia.'); return; }
                  setStep(2);
                }}
                style={{ marginTop: Spacing.base }}
              />
            </>
          ) : (
            <>
              <Text style={styles.stepTitle}>2. Administrador</Text>
              <Field label="Nombre completo *" value={form.adminName} onChange={v => update('adminName', v)} placeholder="Juan García" />
              <Field label="Correo electrónico *" value={form.adminEmail} onChange={v => update('adminEmail', v)} placeholder="juan@email.com" keyboard="email-address" />
              <Field label="Contraseña *" value={form.adminPassword} onChange={v => update('adminPassword', v)} placeholder="Mínimo 6 caracteres" secure />
              <Field label="Confirmar contraseña *" value={form.confirmPassword} onChange={v => update('confirmPassword', v)} placeholder="Repite la contraseña" secure />

              <View style={styles.btnRow}>
                <Button title="← Atrás" onPress={() => setStep(1)} variant="ghost" style={{ flex: 1, marginRight: 8 }} />
                <Button title="Crear familia" onPress={handleSetup} loading={loading} style={{ flex: 2 }} />
              </View>
            </>
          )}
        </View>

        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backLinkText}>← Volver al inicio de sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, placeholder, keyboard, secure }: any) {
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
        autoCapitalize={keyboard === 'email-address' ? 'none' : 'words'}
        secureTextEntry={secure}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  logoContainer: { width: 70, height: 70, borderRadius: 20, backgroundColor: Colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.primary + '40' },
  logoEmoji: { fontSize: 36 },
  title: { fontSize: Typography.sizes['2xl'], color: Colors.text, fontWeight: Typography.weights.bold },
  subtitle: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 4 },
  steps: { flexDirection: 'row', justifyContent: 'center', marginBottom: Spacing.lg, gap: 8 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  stepDotActive: { backgroundColor: Colors.primary, width: 24 },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius['2xl'], padding: Spacing.xl, ...Shadows.md, borderWidth: 1, borderColor: Colors.border },
  stepTitle: { fontSize: Typography.sizes.lg, color: Colors.text, fontWeight: Typography.weights.semibold, marginBottom: Spacing.base },
  inputGroup: { marginBottom: Spacing.base },
  inputLabel: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, fontWeight: Typography.weights.medium, marginBottom: 6 },
  input: { backgroundColor: Colors.surfaceHigh, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: 12, fontSize: Typography.sizes.base, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  currencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.base },
  currencyOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceHigh, borderWidth: 1, borderColor: Colors.border },
  currencySelected: { backgroundColor: Colors.primary + '20', borderColor: Colors.primary },
  currencyLabel: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  currencyLabelSelected: { color: Colors.primary, fontWeight: Typography.weights.semibold },
  btnRow: { flexDirection: 'row', marginTop: Spacing.base },
  backLink: { alignItems: 'center', marginTop: Spacing.xl },
  backLinkText: { color: Colors.textSecondary, fontSize: Typography.sizes.sm },
});
