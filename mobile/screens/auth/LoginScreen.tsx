import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { authService } from '../../services/api';
import { useAuthStore } from '../../store';
import { Button } from '../../components/ui';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu correo y contraseña.');
      return;
    }
    setLoading(true);
    try {
      const data = await authService.login(email.trim().toLowerCase(), password);
      await setAuth(data.user, data.accessToken, data.refreshToken);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Credenciales inválidas. Intenta nuevamente.';
      Alert.alert('Error de acceso', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo & Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>💰</Text>
          </View>
          <Text style={styles.appName}>FamilyFinance</Text>
          <Text style={styles.appTagline}>Gestión financiera familiar inteligente</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Iniciar Sesión</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="familia@ejemplo.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
            />
          </View>

          <Button
            title={loading ? '' : 'Entrar'}
            onPress={handleLogin}
            loading={loading}
            style={styles.loginBtn}
          />
        </View>

        {/* Setup Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Primera vez? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Setup')} activeOpacity={0.7}>
            <Text style={styles.footerLink}>Configura tu familia →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl },

  header: { alignItems: 'center', marginBottom: Spacing['3xl'] },
  logoContainer: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.base,
    borderWidth: 1, borderColor: Colors.primary + '40',
  },
  logoEmoji: { fontSize: 40 },
  appName: { fontSize: Typography.sizes['4xl'], color: Colors.text, fontWeight: Typography.weights.extrabold },
  appTagline: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },

  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl, ...Shadows.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardTitle: { fontSize: Typography.sizes.xl, color: Colors.text, fontWeight: Typography.weights.bold, marginBottom: Spacing.xl },

  inputGroup: { marginBottom: Spacing.base },
  inputLabel: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, fontWeight: Typography.weights.medium, marginBottom: 6 },
  input: {
    backgroundColor: Colors.surfaceHigh, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base, paddingVertical: 12,
    fontSize: Typography.sizes.base, color: Colors.text,
    borderWidth: 1, borderColor: Colors.border,
  },

  loginBtn: { marginTop: Spacing.base },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl, alignItems: 'center' },
  footerText: { color: Colors.textSecondary, fontSize: Typography.sizes.sm },
  footerLink: { color: Colors.primary, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
});
