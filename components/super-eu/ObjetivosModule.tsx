import { useMemo, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type AppTheme } from '@/lib/theme';
import { useSuperEuStore } from '@/stores/superEuStore';
import { getGoalInsight } from '@/services/oracleService';
import type { SEGoal } from '@/types/supereu';

type IconName = ComponentProps<typeof Ionicons>['name'];

type CategoryOption = {
  value: SEGoal['category'];
  label: string;
  icon: IconName;
  tone: 'primary' | 'accent' | 'success' | 'warning';
};

const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'Produto', label: 'Produto', icon: 'cube-outline', tone: 'primary' },
  { value: 'Negócio', label: 'Negocio', icon: 'briefcase-outline', tone: 'accent' },
  { value: 'Corpo', label: 'Corpo', icon: 'fitness-outline', tone: 'success' },
  { value: 'Finanças', label: 'Financas', icon: 'wallet-outline', tone: 'warning' },
  { value: 'Espiritual', label: 'Espiritual', icon: 'sparkles-outline', tone: 'primary' },
  { value: 'Relacionamentos', label: 'Relacoes', icon: 'people-outline', tone: 'accent' },
];

const getCategory = (category: SEGoal['category']) =>
  CATEGORY_OPTIONS.find((item) => item.value === category) ?? CATEGORY_OPTIONS[0];

const toneColor = (theme: AppTheme, tone: CategoryOption['tone']) => {
  if (tone === 'accent') return theme.colors.accent;
  if (tone === 'success') return theme.colors.success;
  if (tone === 'warning') return theme.colors.warning;
  return theme.colors.primary;
};

const formatDaysLeft = (deadline: string) => {
  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) return 'Sem prazo definido';
  const days = Math.ceil((parsed.getTime() - Date.now()) / 86400000);
  if (days > 1) return `${days} dias restantes`;
  if (days === 1) return '1 dia restante';
  if (days === 0) return 'Vence hoje';
  return 'Prazo vencido';
};

export default function ObjetivosModule() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { goals, addGoal, updateGoal, updateGoalProgress, deleteGoal } = useSuperEuStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [insight, setInsight] = useState<{ goalId: string; text: string } | null>(null);
  const [loadingInsight, setLoadingInsight] = useState<string | null>(null);
  const [form, setForm] = useState<{ title: string; category: SEGoal['category']; deadline: string }>({
    title: '',
    category: 'Produto',
    deadline: '',
  });

  const stats = useMemo(() => {
    const done = goals.filter((goal) => goal.progress === 100).length;
    const avg = goals.length
      ? Math.round(goals.reduce((total, goal) => total + goal.progress, 0) / goals.length)
      : 0;
    return { done, avg };
  }, [goals]);

  function resetForm() {
    setForm({ title: '', category: 'Produto', deadline: '' });
    setEditingGoalId(null);
  }

  function openAdd() {
    resetForm();
    setShowAdd(true);
  }

  function openEdit(goal: SEGoal) {
    setForm({ title: goal.title, category: goal.category, deadline: goal.deadline });
    setEditingGoalId(goal.id);
    setShowAdd(true);
  }

  function handleSave() {
    if (!form.title.trim()) return;
    if (editingGoalId) {
      updateGoal(editingGoalId, {
        title: form.title.trim(),
        category: form.category,
        deadline: form.deadline.trim() || '2026-12-31',
      });
      resetForm();
      setShowAdd(false);
      return;
    }
    const newGoal: SEGoal = {
      id: Date.now().toString(),
      title: form.title.trim(),
      category: form.category,
      deadline: form.deadline.trim() || '2026-12-31',
      progress: 0,
      priority: 'medium',
    };
    addGoal(newGoal);
    resetForm();
    setShowAdd(false);
  }

  async function handleInsight(goal: SEGoal) {
    setLoadingInsight(goal.id);
    setInsight({ goalId: goal.id, text: '' });
    const text = await getGoalInsight(goal);
    setInsight({ goalId: goal.id, text });
    setLoadingInsight(null);
  }

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <View style={[styles.heroIcon, { backgroundColor: colors.primarySoft }]}> 
          <Ionicons name="flag-outline" size={22} color={colors.primary} />
        </View>
        <View style={styles.heroTextWrap}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Objetivos em movimento</Text>
          <Text style={[styles.heroSubtitle, { color: colors.muted }]}>Avance em passos pequenos. Use +5 quando concluir uma acao real.</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Ativos" value={goals.length.toString()} icon="albums-outline" theme={theme} />
        <StatCard label="Concluidos" value={stats.done.toString()} icon="checkmark-done-outline" theme={theme} />
        <StatCard label="Media" value={`${stats.avg}%`} icon="trending-up-outline" theme={theme} />
      </View>

      {goals.map((goal) => {
        const category = getCategory(goal.category);
        const categoryColor = toneColor(theme, category.tone);
        return (
          <View key={goal.id} style={[styles.goalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <View style={styles.goalHeader}>
              <View style={styles.goalTitleWrap}>
                <Text style={[styles.goalTitle, { color: colors.text }]}>{goal.title}</Text>
                <View style={styles.goalMetaRow}>
                  <View style={[styles.catBadge, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}> 
                    <Ionicons name={category.icon} size={13} color={categoryColor} />
                    <Text style={[styles.catLabel, { color: categoryColor }]}>{category.label}</Text>
                  </View>
                  <Text style={[styles.deadline, { color: colors.muted }]}>{formatDaysLeft(goal.deadline)}</Text>
                </View>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={[styles.iconButton, { backgroundColor: colors.primarySoft }]}
                  onPress={() => openEdit(goal)}
                  accessibilityRole="button"
                  accessibilityLabel={`Editar objetivo ${goal.title}`}
                >
                  <Ionicons name="create-outline" size={17} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconButton, { backgroundColor: colors.dangerSoft }]}
                  onPress={() => deleteGoal(goal.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Excluir objetivo ${goal.title}`}
                >
                  <Ionicons name="trash-outline" size={17} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.progressTopRow}>
              <Text style={[styles.progressLabel, { color: colors.muted }]}>Progresso</Text>
              <Text style={[styles.progressValue, { color: colors.primary }]}>{goal.progress}%</Text>
            </View>
            <View style={[styles.progressBg, { backgroundColor: colors.backgroundAlt }]}> 
              <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${goal.progress}%` as `${number}%` }]} />
            </View>

            <View style={styles.goalActions}>
              <TouchableOpacity style={[styles.stepButton, { borderColor: colors.border }]} onPress={() => updateGoalProgress(goal.id, -5)}>
                <Ionicons name="remove" size={16} color={colors.text} />
                <Text style={[styles.stepText, { color: colors.text }]}>5</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.stepButton, { borderColor: colors.border }]} onPress={() => updateGoalProgress(goal.id, 5)}>
                <Ionicons name="add" size={16} color={colors.text} />
                <Text style={[styles.stepText, { color: colors.text }]}>5</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.oracleButton, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
                onPress={() => handleInsight(goal)}
                disabled={loadingInsight === goal.id}
              >
                {loadingInsight === goal.id ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="compass-outline" size={16} color={colors.primary} />
                    <Text style={[styles.oracleButtonText, { color: colors.primary }]}>Insight</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {insight?.goalId === goal.id && insight.text ? (
              <View style={[styles.insightCard, { backgroundColor: colors.backgroundAlt, borderColor: colors.accent }]}> 
                <Text style={[styles.insightText, { color: colors.text }]}>{insight.text}</Text>
              </View>
            ) : null}
          </View>
        );
      })}

      {goals.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Ionicons name="trail-sign-outline" size={26} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum objetivo ainda</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>Crie um objetivo simples para ter uma primeira vitoria visivel.</Text>
        </View>
      ) : null}

      <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={openAdd}>
        <Ionicons name="add-circle-outline" size={18} color={colors.primaryText} />
        <Text style={[styles.addButtonText, { color: colors.primaryText }]}>Novo objetivo</Text>
      </TouchableOpacity>

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => { resetForm(); setShowAdd(false); }}>
        <Pressable style={styles.overlay} onPress={() => { resetForm(); setShowAdd(false); }} />
        <View style={[styles.sheet, { backgroundColor: colors.surfaceElevated }]}> 
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>{editingGoalId ? 'Editar objetivo' : 'Novo objetivo'}</Text>
            <TouchableOpacity onPress={() => { resetForm(); setShowAdd(false); }} style={[styles.closeButton, { backgroundColor: colors.backgroundAlt }]}> 
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="Titulo do objetivo"
            placeholderTextColor={colors.subtle}
            value={form.title}
            onChangeText={(title) => setForm((current) => ({ ...current, title }))}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {CATEGORY_OPTIONS.map((category) => {
              const active = form.category === category.value;
              const categoryColor = toneColor(theme, category.tone);
              return (
                <TouchableOpacity
                  key={category.value}
                  onPress={() => setForm((current) => ({ ...current, category: category.value }))}
                  style={[
                    styles.categoryChip,
                    { borderColor: active ? categoryColor : colors.border, backgroundColor: active ? colors.primarySoft : colors.surface },
                  ]}
                >
                  <Ionicons name={category.icon} size={14} color={active ? categoryColor : colors.muted} />
                  <Text style={[styles.categoryChipText, { color: active ? categoryColor : colors.muted }]}>{category.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="Prazo: AAAA-MM-DD"
            placeholderTextColor={colors.subtle}
            value={form.deadline}
            onChangeText={(deadline) => setForm((current) => ({ ...current, deadline }))}
          />
          <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
            <Text style={[styles.submitButtonText, { color: colors.primaryText }]}>{editingGoalId ? 'Salvar alteracoes' : 'Criar objetivo'}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

function StatCard({ label, value, icon, theme }: { label: string; value: string; icon: IconName; theme: AppTheme }) {
  const colors = theme.colors;
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  heroCard: { borderRadius: 10, borderWidth: 1, padding: 16, marginBottom: 14, flexDirection: 'row', gap: 12, alignItems: 'center' },
  heroIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  heroTextWrap: { flex: 1 },
  heroTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  heroSubtitle: { fontSize: 13, lineHeight: 19 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, borderRadius: 10, padding: 12, borderWidth: 1, minHeight: 88, justifyContent: 'space-between' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '700' },
  goalCard: { borderRadius: 10, padding: 16, borderWidth: 1, marginBottom: 12 },
  goalHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 12 },
  goalTitleWrap: { flex: 1 },
  goalTitle: { fontSize: 16, fontWeight: '800', lineHeight: 22, marginBottom: 8 },
  goalMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  catBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 5 },
  catLabel: { fontSize: 11, fontWeight: '800' },
  deadline: { fontSize: 12, fontWeight: '600' },
  iconButton: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  headerActions: { flexDirection: 'row', gap: 7 },
  progressTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  progressLabel: { fontSize: 12, fontWeight: '700' },
  progressValue: { fontSize: 13, fontWeight: '900' },
  progressBg: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: 8, borderRadius: 4 },
  goalActions: { flexDirection: 'row', gap: 8 },
  stepButton: { height: 40, minWidth: 60, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 2 },
  stepText: { fontSize: 13, fontWeight: '800' },
  oracleButton: { flex: 1, height: 40, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  oracleButtonText: { fontSize: 13, fontWeight: '800' },
  insightCard: { marginTop: 12, borderRadius: 8, padding: 13, borderLeftWidth: 3 },
  insightText: { fontSize: 13, lineHeight: 20 },
  emptyCard: { borderRadius: 10, borderWidth: 1, padding: 18, alignItems: 'center', gap: 7, marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '800' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  addButton: { borderRadius: 10, padding: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 4 },
  addButtonText: { fontSize: 14, fontWeight: '900' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20, paddingBottom: 32 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '900' },
  closeButton: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  input: { borderRadius: 10, borderWidth: 1, padding: 14, fontSize: 15, marginBottom: 12 },
  chipRow: { gap: 8, paddingBottom: 12 },
  categoryChip: { borderRadius: 9, borderWidth: 1, paddingVertical: 9, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoryChipText: { fontSize: 12, fontWeight: '800' },
  submitButton: { borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 2 },
  submitButtonText: { fontSize: 14, fontWeight: '900' },
});
