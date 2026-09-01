import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store';
import { authService } from '../../services/api';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { Button } from '../../components/ui';

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      Alert.alert('Éxito', 'Contraseña actualizada correctamente', [
        { text: 'OK', onPress: () => updateUser({ mustChangePassword: false }) }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'No se pudo cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Actualizar Contraseña</Text>
        <Text style={styles.subtitle}>
          Hola {user?.name}, como es tu primer ingreso o tu cuenta ha sido restablecida, por tu seguridad debes cambiar la contraseña.
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Contraseña Actual Temporal</Text>
        <TextInput
          style={styles.input}
          placeholder="Ingresa la clave temporal"
          placeholderTextColor={Colors.textMuted}
          secureTextEntry
          value={form.currentPassword}
          onChangeText={v => setForm({ ...form, currentPassword: v })}
        />

        <Text style={styles.label}>Nueva Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Ingresa tu nueva clave secreta"
          placeholderTextColor={Colors.textMuted}
          secureTextEntry
          value={form.newPassword}
          onChangeText={v => setForm({ ...form, newPassword: v })}
        />

        <Text style={styles.label}>Confirmar Nueva Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Repite tu nueva clave secreta"
          placeholderTextColor={Colors.textMuted}
          secureTextEntry
          value={form.confirmPassword}
          onChangeText={v => setForm({ ...form, confirmPassword: v })}
        />

        <Button title="Actualizar y Continuar" onPress={handleSubmit} loading={loading} style={{ marginTop: Spacing.xl }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { padding: Spacing.xl, paddingTop: Spacing.xxl },
  title: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.heavy, color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: Typography.sizes.base, color: Colors.textSecondary, lineHeight: 24 },
  form: { padding: Spacing.xl },
  label: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginBottom: 6, fontWeight: Typography.weights.medium, marginTop: Spacing.base },
  input: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border, color: Colors.text, fontSize: Typography.sizes.base },
});
