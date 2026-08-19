import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { ScreenHeader } from '../../components/ui';

export default function GoalDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Detalle de Meta" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.text}>Próximamente: Detalles y aportes de la meta.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  text: { color: Colors.textSecondary, fontSize: Typography.sizes.base, textAlign: 'center' },
});
