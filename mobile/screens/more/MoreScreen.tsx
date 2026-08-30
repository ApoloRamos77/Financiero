import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal, TextInput
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import {
  authService, reportService, goalService, contributorService,
  alertService, categoryService, accountService, ventureService, userService
} from '../../services/api';
import { useAuthStore, useAppStore } from '../../store';
import { GoalCard, AlertItem, EmptyState, Button } from '../../components/ui';
import { formatDate, formatMonthYear } from '../../utils/helpers';
import { GOAL_TYPES } from '../../constants/theme';

type Section = 'home' | 'goals' | 'alerts' | 'contributors' | 'accounts' | 'reports' | 'analysis' | 'settings';

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, clearAuth } = useAuthStore();
  const { selectedYear, selectedMonth } = useAppStore();
  const queryClient = useQueryClient();
  const [section, setSection] = useState<Section>('home');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    name: '', goalType: 'EmergencyFund', targetAmount: '',
    monthlyContribution: '', icon: '🎯', color: '#3B82F6',
  });

  const { data: goals = [] } = useQuery({ queryKey: ['goals'], queryFn: goalService.getAll, enabled: section === 'goals' });
  const { data: alerts = [] } = useQuery({ queryKey: ['alerts'], queryFn: alertService.getAll, enabled: section === 'alerts' });
  const { data: contributors = [] } = useQuery({ queryKey: ['contributors'], queryFn: contributorService.getAll, enabled: section === 'contributors' });
  const { data: accounts = [] } = useQuery({ queryKey: ['accounts'], queryFn: accountService.getAll, enabled: section === 'accounts' });
  const { data: monthlyReport } = useQuery({ queryKey: ['report-monthly', selectedYear, selectedMonth], queryFn: () => reportService.getMonthly(selectedYear, selectedMonth), enabled: section === 'reports' });
  const { data: insights } = useQuery({ queryKey: ['insights'], queryFn: () => reportService.getMonthly(selectedYear, selectedMonth), enabled: section === 'analysis' });

  const createGoalMutation = useMutation({
    mutationFn: (data: object) => goalService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setShowGoalModal(false);
    },
    onError: () => Alert.alert('Error', 'No se pudo crear la meta.'),
  });

  const dismissAlertMutation = useMutation({
    mutationFn: (id: string) => alertService.dismiss(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const readAlertMutation = useMutation({
    mutationFn: (id: string) => alertService.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => clearAuth() },
    ]);
  };

  const handleCreateGoal = () => {
    const amount = parseFloat(goalForm.targetAmount);
    if (!goalForm.name || isNaN(amount) || amount <= 0) { Alert.alert('Error', 'Ingresa el nombre y monto objetivo.'); return; }
    createGoalMutation.mutate({
      name: goalForm.name, goalType: goalForm.goalType, targetAmount: amount,
      monthlyContribution: parseFloat(goalForm.monthlyContribution) || 0,
      icon: goalForm.icon, color: goalForm.color,
    });
  };

  const MenuItems = [
    { icon: '🎯', title: 'Metas de ahorro', subtitle: `${(goals as any[]).length} metas activas`, section: 'goals' as Section },
    { icon: '⚠️', title: 'Alertas', subtitle: `${(alerts as any[]).filter((a: any) => a.status === 'Active').length} pendientes`, section: 'alerts' as Section },
    { icon: '👥', title: 'Aportantes', subtitle: 'Gestionar responsables', section: 'contributors' as Section },
    { icon: '💳', title: 'Cuentas y billeteras', subtitle: 'Gestionar cuentas', section: 'accounts' as Section },
    { icon: '📊', title: 'Reportes mensuales', subtitle: 'Resumen financiero', section: 'reports' as Section },
    { icon: '🔍', title: 'Análisis', subtitle: 'Insights financieros', section: 'analysis' as Section },
    { icon: '⚙️', title: 'Configuración', subtitle: 'Perfil y preferencias', section: 'settings' as Section },
  ];

  if (section !== 'home') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setSection('home')} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Atrás</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
          {/* ─ Goals ─ */}
          {section === 'goals' && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🎯 Metas de Ahorro</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => setShowGoalModal(true)}><Text style={styles.addBtnText}>+ Nueva</Text></TouchableOpacity>
              </View>
              {(goals as any[]).length === 0 ? (
                <EmptyState icon="🎯" title="Sin metas" subtitle="Define tus metas financieras" action="Crear meta" onAction={() => setShowGoalModal(true)} />
              ) : (goals as any[]).map((g: any) => (
                <GoalCard key={g.id} name={g.name} targetAmount={g.targetAmount} currentAmount={g.currentAmount} progressPercentage={g.progressPercentage} monthsToAchieve={g.monthsToAchieve} icon={g.icon} color={g.color} />
              ))}
            </>
          )}

          {/* ─ Alerts ─ */}
          {section === 'alerts' && (
            <>
              <Text style={styles.sectionTitle2}>⚠️ Alertas financieras</Text>
              {(alerts as any[]).length === 0 ? (
                <EmptyState icon="✅" title="Sin alertas" subtitle="Todo en orden por el momento" />
              ) : (alerts as any[]).map((a: any) => (
                <AlertItem key={a.id} title={a.title} message={a.message} type={a.alertType} date={formatDate(a.alertDate, true)}
                  onRead={a.status === 'Active' ? () => readAlertMutation.mutate(a.id) : undefined}
                  onDismiss={a.status !== 'Dismissed' ? () => dismissAlertMutation.mutate(a.id) : undefined}
                />
              ))}
            </>
          )}

          {/* ─ Contributors ─ */}
          {section === 'contributors' && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>👥 Aportantes</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('ContributorDetail', { contributorId: 'new' })}>
                  <Text style={styles.addBtnText}>+ Nuevo</Text>
                </TouchableOpacity>
              </View>
              {(contributors as any[]).length === 0 ? (
                <EmptyState icon="👤" title="Sin aportantes" subtitle="Registra los miembros que generan ingresos" />
              ) : (contributors as any[]).map((c: any) => (
                <TouchableOpacity key={c.id} style={styles.listItem} onPress={() => navigation.navigate('ContributorDetail', { contributorId: c.id })} activeOpacity={0.7}>
                  <View style={[styles.avatar, { backgroundColor: Colors.primary + '20' }]}>
                    <Text style={styles.avatarText}>{c.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.listItemInfo}>
                    <Text style={styles.listItemName}>{c.name}</Text>
                    <Text style={styles.listItemSub}>{c.contributorType} · S/ {c.fixedIncome?.toLocaleString('es-PE') || 0}/mes</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: c.isActive ? Colors.income + '20' : Colors.textMuted + '20' }]}>
                    <Text style={{ color: c.isActive ? Colors.income : Colors.textMuted, fontSize: 11, fontWeight: '600' }}>
                      {c.isActive ? '● Activo' : '○ Inactivo'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* ─ Accounts ─ */}
          {section === 'accounts' && (
            <>
              <Text style={styles.sectionTitle2}>💳 Cuentas y Billeteras</Text>
              {(accounts as any[]).length === 0 ? (
                <EmptyState icon="💳" title="Sin cuentas" subtitle="Agrega tus cuentas bancarias y billeteras" />
              ) : (accounts as any[]).map((a: any) => (
                <View key={a.id} style={[styles.listItem, { borderLeftColor: a.color, borderLeftWidth: 4 }]}>
                  <View style={styles.listItemInfo}>
                    <Text style={styles.listItemName}>{a.name}</Text>
                    <Text style={styles.listItemSub}>{a.accountType} {a.bankName ? `· ${a.bankName}` : ''}</Text>
                  </View>
                  <Text style={[styles.accountBalance, { color: a.balance >= 0 ? Colors.income : Colors.expense }]}>
                    S/ {a.balance.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              ))}
            </>
          )}

          {/* ─ Reports ─ */}
          {section === 'reports' && monthlyReport && (
            <>
              <Text style={styles.sectionTitle2}>📊 {formatMonthYear(selectedYear, selectedMonth)}</Text>
              <View style={styles.reportGrid}>
                <View style={[styles.reportCard, { borderTopColor: Colors.income }]}>
                  <Text style={styles.reportCardLabel}>Ingresos</Text>
                  <Text style={[styles.reportCardValue, { color: Colors.income }]}>S/ {monthlyReport.totalIncome.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</Text>
                </View>
                <View style={[styles.reportCard, { borderTopColor: Colors.expense }]}>
                  <Text style={styles.reportCardLabel}>Gastos</Text>
                  <Text style={[styles.reportCardValue, { color: Colors.expense }]}>S/ {monthlyReport.totalExpense.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</Text>
                </View>
                <View style={[styles.reportCard, { borderTopColor: Colors.primary }]}>
                  <Text style={styles.reportCardLabel}>Resultado</Text>
                  <Text style={[styles.reportCardValue, { color: monthlyReport.netResult >= 0 ? Colors.income : Colors.expense }]}>
                    S/ {monthlyReport.netResult.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={[styles.reportCard, { borderTopColor: Colors.savings }]}>
                  <Text style={styles.reportCardLabel}>Ahorro</Text>
                  <Text style={[styles.reportCardValue, { color: Colors.savings }]}>S/ {monthlyReport.savings.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</Text>
                </View>
              </View>
              <Text style={styles.subSectionTitle}>Top gastos por categoría</Text>
              {monthlyReport.expenseByCategory.slice(0, 5).map((c: any) => (
                <View key={c.categoryName} style={styles.categoryRow}>
                  <View style={[styles.catDot, { backgroundColor: c.color }]} />
                  <Text style={styles.catName}>{c.categoryName}</Text>
                  <Text style={styles.catPct}>{c.percentage.toFixed(1)}%</Text>
                  <Text style={styles.catAmount}>S/ {c.amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</Text>
                </View>
              ))}
            </>
          )}

          {/* ─ Settings ─ */}
          {section === 'settings' && (
            <>
              <View style={styles.profileCard}>
                <View style={[styles.profileAvatar, { backgroundColor: user?.avatarColor || Colors.primary }]}>
                  <Text style={styles.profileAvatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.profileName}>{user?.name}</Text>
                  <Text style={styles.profileEmail}>{user?.email}</Text>
                  <Text style={styles.profileRole}>{user?.familyName ? `${user.familyName} · ` : ''}{user?.role === 'Admin' ? '👑 Administrador' : user?.role}</Text>
                </View>
              </View>

              <Button title="Cerrar sesión" onPress={handleLogout} variant="danger" style={{ margin: Spacing.base }} />
            </>
          )}
        </ScrollView>

        {/* Goal Modal */}
        <Modal visible={showGoalModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nueva Meta</Text>
              <Text style={styles.inputLabel}>Nombre *</Text>
              <TextInput style={styles.input} value={goalForm.name} onChangeText={v => setGoalForm(f => ({ ...f, name: v }))} placeholder="Ej: Fondo de emergencia" placeholderTextColor={Colors.textMuted} />
              <Text style={styles.inputLabel}>Tipo</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
                {GOAL_TYPES.map(gt => (
                  <TouchableOpacity key={gt.value} style={[styles.typeChip, goalForm.goalType === gt.value && styles.typeChipSelected]} onPress={() => setGoalForm(f => ({ ...f, goalType: gt.value }))}>
                    <Text style={{ color: goalForm.goalType === gt.value ? Colors.primary : Colors.textSecondary, fontSize: 12 }}>{gt.icon} {gt.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.inputLabel}>Monto objetivo *</Text>
              <TextInput style={styles.input} value={goalForm.targetAmount} onChangeText={v => setGoalForm(f => ({ ...f, targetAmount: v }))} placeholder="0.00" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />
              <Text style={styles.inputLabel}>Aporte mensual</Text>
              <TextInput style={styles.input} value={goalForm.monthlyContribution} onChangeText={v => setGoalForm(f => ({ ...f, monthlyContribution: v }))} placeholder="0.00" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />
              <View style={styles.modalActions}>
                <Button title="Cancelar" onPress={() => setShowGoalModal(false)} variant="ghost" style={{ flex: 1, marginRight: 8 }} />
                <Button title="Crear" onPress={handleCreateGoal} loading={createGoalMutation.isPending} style={{ flex: 2 }} />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Home menu
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.homeHeader}>
        <View style={[styles.homeAvatar, { backgroundColor: user?.avatarColor || Colors.primary }]}>
          <Text style={styles.homeAvatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.homeUserName}>{user?.name}</Text>
          <Text style={styles.homeUserRole}>{user?.familyName ? `${user.familyName} · ` : ''}{user?.role === 'Admin' ? '👑 Administrador' : user?.role === 'Contributor' ? 'Aportante' : 'Invitado'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {MenuItems.map(item => (
          <TouchableOpacity key={item.section} style={styles.menuItem} onPress={() => setSection(item.section)} activeOpacity={0.7}>
            <View style={styles.menuItemIcon}><Text style={{ fontSize: 22 }}>{item.icon}</Text></View>
            <View style={styles.menuItemInfo}>
              <Text style={styles.menuItemTitle}>{item.title}</Text>
              <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        ))}

        <View style={{ padding: Spacing.base, marginTop: Spacing.lg }}>
          <Button title="Cerrar sesión" onPress={handleLogout} variant="danger" />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  homeHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, gap: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  homeAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  homeAvatarText: { fontSize: 20, color: Colors.white, fontWeight: Typography.weights.bold },
  homeUserName: { fontSize: Typography.sizes.lg, color: Colors.text, fontWeight: Typography.weights.bold },
  homeUserRole: { fontSize: Typography.sizes.xs, color: Colors.textSecondary },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuItemIcon: { width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  menuItemInfo: { flex: 1 },
  menuItemTitle: { fontSize: Typography.sizes.base, color: Colors.text, fontWeight: Typography.weights.medium },
  menuItemSubtitle: { fontSize: Typography.sizes.xs, color: Colors.textMuted, marginTop: 2 },
  menuItemArrow: { fontSize: 20, color: Colors.textMuted },
  // Sub screens
  subHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backBtnText: { fontSize: Typography.sizes.base, color: Colors.primary, fontWeight: Typography.weights.medium },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  sectionTitle: { fontSize: Typography.sizes.xl, color: Colors.text, fontWeight: Typography.weights.bold },
  sectionTitle2: { fontSize: Typography.sizes.xl, color: Colors.text, fontWeight: Typography.weights.bold, padding: Spacing.base },
  addBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.base, paddingVertical: 8, borderRadius: BorderRadius.full },
  addBtnText: { color: Colors.white, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, backgroundColor: Colors.surface, marginHorizontal: Spacing.base, borderRadius: BorderRadius.md, marginBottom: Spacing.sm },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  avatarText: { fontSize: Typography.sizes.lg, color: Colors.primary, fontWeight: Typography.weights.bold },
  listItemInfo: { flex: 1 },
  listItemName: { fontSize: Typography.sizes.base, color: Colors.text, fontWeight: Typography.weights.medium },
  listItemSub: { fontSize: Typography.sizes.xs, color: Colors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  accountBalance: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold },
  reportGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.base, gap: 10 },
  reportCard: { width: '47%', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, borderTopWidth: 3 },
  reportCardLabel: { fontSize: Typography.sizes.xs, color: Colors.textMuted, marginBottom: 4 },
  reportCardValue: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  subSectionTitle: { fontSize: Typography.sizes.base, color: Colors.textSecondary, fontWeight: Typography.weights.semibold, paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: Spacing.sm },
  categoryRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  catDot: { width: 10, height: 10, borderRadius: 5, marginRight: Spacing.sm },
  catName: { flex: 1, fontSize: Typography.sizes.sm, color: Colors.text },
  catPct: { fontSize: Typography.sizes.xs, color: Colors.textMuted, marginRight: Spacing.sm },
  catAmount: { fontSize: Typography.sizes.sm, color: Colors.text, fontWeight: Typography.weights.medium },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, margin: Spacing.base, padding: Spacing.base, borderRadius: BorderRadius.xl },
  profileAvatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { fontSize: 24, color: Colors.white, fontWeight: Typography.weights.bold },
  profileName: { fontSize: Typography.sizes.lg, color: Colors.text, fontWeight: Typography.weights.bold },
  profileEmail: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  profileRole: { fontSize: Typography.sizes.xs, color: Colors.primary, marginTop: 2 },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl },
  modalTitle: { fontSize: Typography.sizes.xl, color: Colors.text, fontWeight: Typography.weights.bold, marginBottom: Spacing.base },
  inputLabel: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginBottom: 6, marginTop: Spacing.sm },
  input: { backgroundColor: Colors.surfaceHigh, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: 12, fontSize: Typography.sizes.base, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceHigh, marginRight: 8, borderWidth: 1, borderColor: Colors.border },
  typeChipSelected: { backgroundColor: Colors.primary + '20', borderColor: Colors.primary },
  modalActions: { flexDirection: 'row', marginTop: Spacing.base },
});
