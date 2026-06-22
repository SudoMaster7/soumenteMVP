import { useMemo, useState, type ComponentProps } from 'react';
import {
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
import { fmtBRL } from '@/constants/supereu';
import { useTheme } from '@/lib/theme';
import { useSuperEuStore } from '@/stores/superEuStore';
import type { SEPurchase } from '@/types/supereu';

type Phase = SEPurchase['phase'] | 'all';

type PhaseOption = {
  id: Phase;
  label: string;
  short: string;
};

const PHASES: PhaseOption[] = [
  { id: 'all', label: 'Todos', short: 'Todos' },
  { id: 'immediate', label: 'Imediato', short: 'Agora' },
  { id: 'week1', label: 'Semana 1', short: 'S1' },
  { id: 'month1', label: 'Mes 1', short: 'M1' },
  { id: 'month23', label: 'Meses 2-3', short: 'M2-3' },
];

const PHASE_LABEL: Record<SEPurchase['phase'], string> = {
  immediate: 'Imediato',
  week1: 'Semana 1',
  month1: 'Mes 1',
  month23: 'Meses 2-3',
};

export default function PlanoModule() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { purchases, togglePurchase, addPurchase, updatePurchase, deletePurchase } = useSuperEuStore();
  const [activePhase, setActivePhase] = useState<Phase>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', why: '', phase: 'immediate' as SEPurchase['phase'], min: '', max: '' });

  const filtered = activePhase === 'all' ? purchases : purchases.filter((item) => item.phase === activePhase);

  const stats = useMemo(() => {
    const done = purchases.filter((item) => item.done).length;
    const pending = purchases.length - done;
    const progress = purchases.length ? Math.round((done / purchases.length) * 100) : 0;
    const remainingMin = purchases.filter((item) => !item.done).reduce((total, item) => total + item.min, 0);
    const remainingMax = purchases.filter((item) => !item.done).reduce((total, item) => total + item.max, 0);
    return { done, pending, progress, remainingMin, remainingMax };
  }, [purchases]);

  function resetForm() {
    setForm({ name: '', why: '', phase: 'immediate', min: '', max: '' });
    setEditingPurchaseId(null);
  }

  function openAdd() {
    resetForm();
    setShowAdd(true);
  }

  function openEdit(item: SEPurchase) {
    setForm({
      name: item.name,
      why: item.why,
      phase: item.phase,
      min: item.min ? String(item.min) : '',
      max: item.max ? String(item.max) : '',
    });
    setEditingPurchaseId(item.id);
    setShowAdd(true);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    const min = Number(form.min.replace(',', '.')) || 0;
    const max = Number(form.max.replace(',', '.')) || min;
    if (editingPurchaseId) {
      updatePurchase(editingPurchaseId, {
        phase: form.phase,
        name: form.name.trim(),
        why: form.why.trim(),
        min,
        max,
      });
      resetForm();
      setShowAdd(false);
      return;
    }
    const newPurchase: SEPurchase = {
      id: Date.now().toString(),
      phase: form.phase,
      category: 'Outros',
      name: form.name.trim(),
      why: form.why.trim(),
      min,
      max,
      done: false,
    };
    addPurchase(newPurchase);
    resetForm();
    setShowAdd(false);
  }

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <View style={styles.heroTopRow}>
          <View style={[styles.heroIcon, { backgroundColor: colors.accentSoft }]}> 
            <Ionicons name="map-outline" size={22} color={colors.accent} />
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Plano de aquisicoes</Text>
            <Text style={[styles.heroSubtitle, { color: colors.muted }]}>Priorize o que desbloqueia energia, foco e execucao.</Text>
          </View>
        </View>
        <View style={[styles.remainingBox, { backgroundColor: colors.backgroundAlt }]}> 
          <Text style={[styles.remainingLabel, { color: colors.muted }]}>Investimento pendente</Text>
          <Text style={[styles.remainingValue, { color: colors.primary }]}> 
            {fmtBRL(stats.remainingMin)}{stats.remainingMax > stats.remainingMin ? ` a ${fmtBRL(stats.remainingMax)}` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <Stat label="Comprados" value={stats.done.toString()} icon="bag-check-outline" />
        <Stat label="Pendentes" value={stats.pending.toString()} icon="time-outline" />
        <Stat label="Progresso" value={`${stats.progress}%`} icon="analytics-outline" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.phaseRow}>
        {PHASES.map((phase) => {
          const active = activePhase === phase.id;
          return (
            <TouchableOpacity
              key={phase.id}
              onPress={() => setActivePhase(phase.id)}
              style={[styles.phaseChip, { backgroundColor: active ? colors.primarySoft : colors.surface, borderColor: active ? colors.primary : colors.border }]}
            >
              <Text style={[styles.phaseChipText, { color: active ? colors.primary : colors.muted }]}>{phase.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {filtered.map((item) => (
        <View key={item.id} style={[styles.purchaseRow, { backgroundColor: colors.surface, borderColor: item.done ? colors.success : colors.border, opacity: item.done ? 0.72 : 1 }]}> 
          <TouchableOpacity
            style={[styles.checkbox, { borderColor: item.done ? colors.success : colors.border, backgroundColor: item.done ? colors.success : colors.backgroundAlt }]}
            onPress={() => togglePurchase(item.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.done }}
            accessibilityLabel={`Marcar ${item.name} como ${item.done ? 'pendente' : 'comprado'}`}
          >
            {item.done ? <Ionicons name="checkmark" size={16} color={theme.isDark ? colors.background : colors.primaryText} /> : null}
          </TouchableOpacity>

          <TouchableOpacity style={styles.purchaseInfo} onPress={() => togglePurchase(item.id)} activeOpacity={0.8}>
            <View style={styles.purchaseTitleRow}>
              <Text style={[styles.purchaseName, { color: colors.text }, item.done && styles.purchaseNameDone]}>{item.name}</Text>
              <View style={[styles.phaseBadge, { backgroundColor: colors.accentSoft }]}> 
                <Text style={[styles.phaseBadgeText, { color: colors.accent }]}>{PHASE_LABEL[item.phase]}</Text>
              </View>
            </View>
            {item.why ? <Text style={[styles.purchaseWhy, { color: colors.muted }]}>{item.why}</Text> : null}
            {(item.min > 0 || item.max > 0) ? (
              <Text style={[styles.priceRange, { color: colors.primary }]}> 
                {fmtBRL(item.min)}{item.max > item.min ? ` a ${fmtBRL(item.max)}` : ''}
              </Text>
            ) : null}
          </TouchableOpacity>

          <View style={styles.rowActions}>
            <TouchableOpacity
              style={[styles.smallActionButton, { backgroundColor: colors.primarySoft }]}
              onPress={() => openEdit(item)}
              accessibilityRole="button"
              accessibilityLabel={`Editar item ${item.name}`}
            >
              <Ionicons name="create-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallActionButton, { backgroundColor: colors.dangerSoft }]}
              onPress={() => deletePurchase(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Excluir item ${item.name}`}
            >
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {filtered.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Ionicons name="file-tray-outline" size={24} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Nada nesta fase</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>Adicione um item ou veja todos para reorganizar seu plano.</Text>
        </View>
      ) : null}

      <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={openAdd}>
        <Ionicons name="add-circle-outline" size={18} color={colors.primaryText} />
        <Text style={[styles.addButtonText, { color: colors.primaryText }]}>Novo item</Text>
      </TouchableOpacity>

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => { resetForm(); setShowAdd(false); }}>
        <Pressable style={styles.overlay} onPress={() => { resetForm(); setShowAdd(false); }} />
        <ScrollView style={[styles.sheet, { backgroundColor: colors.surfaceElevated }]} keyboardShouldPersistTaps="handled">
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>{editingPurchaseId ? 'Editar item do plano' : 'Novo item do plano'}</Text>
            <TouchableOpacity onPress={() => { resetForm(); setShowAdd(false); }} style={[styles.closeButton, { backgroundColor: colors.backgroundAlt }]}> 
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
          <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} placeholder="Nome do item" placeholderTextColor={colors.subtle} value={form.name} onChangeText={(name) => setForm((current) => ({ ...current, name }))} />
          <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} placeholder="Por que isso importa?" placeholderTextColor={colors.subtle} value={form.why} onChangeText={(why) => setForm((current) => ({ ...current, why }))} />
          <View style={styles.priceRow}>
            <TextInput style={[styles.input, styles.priceInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} placeholder="Minimo" placeholderTextColor={colors.subtle} keyboardType="numeric" value={form.min} onChangeText={(min) => setForm((current) => ({ ...current, min }))} />
            <TextInput style={[styles.input, styles.priceInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} placeholder="Maximo" placeholderTextColor={colors.subtle} keyboardType="numeric" value={form.max} onChangeText={(max) => setForm((current) => ({ ...current, max }))} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.phaseRow}>
            {(PHASES.filter((phase): phase is PhaseOption & { id: SEPurchase['phase'] } => phase.id !== 'all')).map((phase) => {
              const active = form.phase === phase.id;
              return (
                <TouchableOpacity key={phase.id} onPress={() => setForm((current) => ({ ...current, phase: phase.id }))} style={[styles.phaseChip, { backgroundColor: active ? colors.primarySoft : colors.surface, borderColor: active ? colors.primary : colors.border }]}> 
                  <Text style={[styles.phaseChipText, { color: active ? colors.primary : colors.muted }]}>{phase.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
            <Text style={[styles.submitButtonText, { color: colors.primaryText }]}>{editingPurchaseId ? 'Salvar alteracoes' : 'Adicionar ao plano'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </ScrollView>
  );

  function Stat({ label, value, icon }: { label: string; value: string; icon: ComponentProps<typeof Ionicons>['name'] }) {
    return (
      <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <Ionicons name={icon} size={18} color={colors.accent} />
        <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  heroCard: { borderRadius: 10, borderWidth: 1, padding: 16, marginBottom: 14 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  heroIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  heroTextWrap: { flex: 1 },
  heroTitle: { fontSize: 18, fontWeight: '900', marginBottom: 4 },
  heroSubtitle: { fontSize: 13, lineHeight: 19 },
  remainingBox: { borderRadius: 8, padding: 12 },
  remainingLabel: { fontSize: 12, fontWeight: '700', marginBottom: 5 },
  remainingValue: { fontSize: 20, fontWeight: '900' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, borderRadius: 10, padding: 12, borderWidth: 1, minHeight: 88, justifyContent: 'space-between' },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '700' },
  phaseRow: { gap: 8, paddingBottom: 14 },
  phaseChip: { borderRadius: 9, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9 },
  phaseChipText: { fontSize: 12, fontWeight: '800' },
  purchaseRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, borderWidth: 1, borderRadius: 10, padding: 13, marginBottom: 10 },
  checkbox: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  purchaseInfo: { flex: 1 },
  purchaseTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, justifyContent: 'space-between', marginBottom: 4 },
  purchaseName: { flex: 1, fontSize: 14, fontWeight: '800', lineHeight: 19 },
  purchaseNameDone: { textDecorationLine: 'line-through' },
  purchaseWhy: { fontSize: 12, lineHeight: 18, marginBottom: 6 },
  phaseBadge: { borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4 },
  phaseBadgeText: { fontSize: 10, fontWeight: '900' },
  priceRange: { fontSize: 12, fontWeight: '900' },
  rowActions: { gap: 7 },
  smallActionButton: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { borderRadius: 10, borderWidth: 1, padding: 18, alignItems: 'center', gap: 7, marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '900' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  addButton: { borderRadius: 10, padding: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 4 },
  addButtonText: { fontSize: 14, fontWeight: '900' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20, paddingBottom: 32 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '900' },
  closeButton: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  input: { borderRadius: 10, borderWidth: 1, padding: 14, fontSize: 15, marginBottom: 12 },
  priceRow: { flexDirection: 'row', gap: 10 },
  priceInput: { flex: 1 },
  submitButton: { borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 2, marginBottom: 22 },
  submitButtonText: { fontSize: 14, fontWeight: '900' },
});
