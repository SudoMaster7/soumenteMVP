import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSuperEuStore } from '@/stores/superEuStore';
import { useTheme, type AppTheme } from '@/lib/theme';
import type { SEHabit } from '@/types/supereu';

const DAYS = [
  { short: 'S', label: 'Seg' },
  { short: 'T', label: 'Ter' },
  { short: 'Q', label: 'Qua' },
  { short: 'Q', label: 'Qui' },
  { short: 'S', label: 'Sex' },
  { short: 'S', label: 'Sab' },
  { short: 'D', label: 'Dom' },
];

const ICONS = ['*', 'o', '+', '#', '@', '~', '^', '!', '%', '&'];

export default function RituaisModule() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const { habits, toggleHabitDay, addHabit, updateHabit, deleteHabit } = useSuperEuStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [form, setForm] = useState({ icon: '*', name: '' });

  const todayIdx = (() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  })();

  const completedToday = habits.filter((h) => h.days[todayIdx]).length;
  const percentToday = habits.length ? Math.round((completedToday / habits.length) * 100) : 0;
  const totalCheckmarks = habits.reduce((a, h) => a + h.days.filter(Boolean).length, 0);

  function resetForm() {
    setForm({ icon: '*', name: '' });
    setEditingHabitId(null);
  }

  function openAdd() {
    resetForm();
    setShowAdd(true);
  }

  function openEdit(habit: SEHabit) {
    setForm({ icon: habit.icon, name: habit.name });
    setEditingHabitId(habit.id);
    setShowAdd(true);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    if (editingHabitId) {
      updateHabit(editingHabitId, { icon: form.icon, name: form.name.trim() });
      resetForm();
      setShowAdd(false);
      return;
    }
    const newHabit: SEHabit = {
      id: Date.now().toString(),
      icon: form.icon,
      name: form.name.trim(),
      streak: 0,
      days: [false, false, false, false, false, false, false],
    };
    addHabit(newHabit);
    resetForm();
    setShowAdd(false);
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroIcon}>
            <Ionicons name="flame-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Rituais da semana</Text>
            <Text style={styles.heroText}>Toque no dia em que voce completou cada ritual. A coluna marcada e o dia de hoje.</Text>
          </View>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${percentToday}%` }]} />
        </View>
        <Text style={styles.progressHint}>{completedToday} de {habits.length} rituais feitos hoje</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{completedToday}/{habits.length}</Text>
          <Text style={styles.statLabel}>HOJE</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{percentToday}%</Text>
          <Text style={styles.statLabel}>DO DIA</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalCheckmarks}</Text>
          <Text style={styles.statLabel}>NA SEMANA</Text>
        </View>
      </View>

      <View style={styles.ritualList}>
        {habits.map((habit) => {
          const doneCount = habit.days.filter(Boolean).length;
          return (
            <View key={habit.id} style={styles.habitCard}>
              <View style={styles.habitHeader}>
                <View style={styles.habitLeft}>
                  <View style={styles.habitIconWrap}><Text style={styles.habitIcon}>{habit.icon}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.habitName} numberOfLines={2}>{habit.name}</Text>
                    <Text style={styles.habitMeta}>{doneCount}/7 dias nesta semana</Text>
                  </View>
                </View>
                <View style={styles.rowActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(habit)} accessibilityRole="button" accessibilityLabel={`Editar ritual ${habit.name}`}>
                    <Ionicons name="create-outline" size={15} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteHabit(habit.id)} accessibilityRole="button" accessibilityLabel={`Excluir ritual ${habit.name}`}>
                    <Ionicons name="trash-outline" size={15} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.daysGrid}>
                {habit.days.map((done, di) => (
                  <TouchableOpacity
                    key={di}
                    onPress={() => toggleHabitDay(habit.id, di)}
                    style={[styles.dayButton, di === todayIdx && styles.dayButtonToday, done && styles.dayButtonDone]}
                    activeOpacity={0.75}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: done }}
                    accessibilityLabel={`${habit.name}, ${DAYS[di].label}`}
                  >
                    <Ionicons
                      name={done ? 'checkmark-circle' : 'ellipse-outline'}
                      size={16}
                      color={done ? colors.primaryText : di === todayIdx ? colors.primary : colors.subtle}
                    />
                    <Text style={[styles.dayButtonLabel, done && styles.dayButtonLabelDone]}>{DAYS[di].label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
        <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
        <Text style={styles.addBtnTxt}>Novo ritual</Text>
      </TouchableOpacity>

      <View style={styles.principleCard}>
        <Ionicons name="sparkles-outline" size={18} color={colors.accent} />
        <View style={{ flex: 1 }}>
          <Text style={styles.principleText}>Cada marca e uma prova pequena de compromisso. Nao busque perfeicao: busque voltar.</Text>
          <Text style={styles.principleAuthor}>Consistencia antes de intensidade</Text>
        </View>
      </View>

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => { resetForm(); setShowAdd(false); }}>
        <Pressable style={styles.overlay} onPress={() => { resetForm(); setShowAdd(false); }} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{editingHabitId ? 'Editar ritual' : 'Novo ritual'}</Text>
          <Text style={styles.sheetHint}>Escolha um simbolo simples e de um nome claro para o habito.</Text>
          <View style={styles.iconRow}>
            {ICONS.map((ic) => (
              <TouchableOpacity key={ic} onPress={() => setForm((f) => ({ ...f, icon: ic }))} style={[styles.iconBtn, form.icon === ic && styles.iconBtnActive]}>
                <Text style={[styles.iconEmoji, form.icon === ic && styles.iconEmojiActive]}>{ic}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Nome do ritual..."
            placeholderTextColor={colors.subtle}
            value={form.name}
            onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
          />
          <TouchableOpacity style={styles.manifestBtn} onPress={handleSave}>
            <Text style={styles.manifestTxt}>{editingHabitId ? 'Salvar alteracoes' : 'Criar ritual'}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

function makeStyles(theme: AppTheme) {
  const colors = theme.colors;
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 40 },
    heroCard: { backgroundColor: colors.surface, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14 },
    heroHeader: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' },
    heroIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    heroTitle: { fontSize: 18, color: colors.text, fontWeight: '800', marginBottom: 4 },
    heroText: { fontSize: 13, color: colors.muted, lineHeight: 19 },
    progressBg: { height: 5, backgroundColor: colors.backgroundAlt, borderRadius: 100, overflow: 'hidden' },
    progressFill: { height: 5, backgroundColor: colors.success, borderRadius: 100 },
    progressHint: { fontSize: 12, color: colors.muted, marginTop: 9 },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 10, padding: 13, borderWidth: 1, borderColor: colors.border, alignItems: 'center', minHeight: 76 },
    statValue: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 4 },
    statLabel: { fontSize: 8, letterSpacing: 1.5, color: colors.muted, textAlign: 'center' },
    ritualList: { gap: 10, marginBottom: 12 },
    habitCard: { backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 12 },
    habitHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
    habitLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0 },
    habitIconWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    habitIcon: { fontSize: 16, color: colors.accent, fontWeight: '800' },
    habitName: { fontSize: 14, color: colors.text, fontWeight: '800' },
    habitMeta: { fontSize: 11, color: colors.muted, marginTop: 2 },
    rowActions: { flexDirection: 'row', gap: 6, marginLeft: 2 },
    editBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    deleteBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center' },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    dayButton: { flexGrow: 1, flexBasis: '30%', minWidth: 76, height: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, paddingHorizontal: 8 },
    dayButtonToday: { borderColor: colors.primary, borderWidth: 2 },
    dayButtonDone: { backgroundColor: colors.success, borderColor: colors.success },
    dayButtonLabel: { fontSize: 12, color: colors.text, fontWeight: '800' },
    dayButtonLabelDone: { color: colors.primaryText },
    addBtn: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 10, padding: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4, marginBottom: 16, flexDirection: 'row', gap: 8 },
    addBtnTxt: { color: colors.primary, fontSize: 13, fontWeight: '800', letterSpacing: 1 },
    principleCard: { flexDirection: 'row', gap: 12, backgroundColor: colors.surface, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: colors.border },
    principleText: { fontSize: 14, color: colors.text, lineHeight: 21, marginBottom: 6 },
    principleAuthor: { fontSize: 10, color: colors.accent, letterSpacing: 1.3, fontWeight: '800', textTransform: 'uppercase' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
    sheet: { backgroundColor: colors.surfaceElevated, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: colors.border },
    sheetTitle: { fontSize: 18, color: colors.text, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
    sheetHint: { fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 19, marginBottom: 18 },
    iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20, justifyContent: 'center' },
    iconBtn: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
    iconBtnActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
    iconEmoji: { fontSize: 17, color: colors.muted, fontWeight: '800' },
    iconEmojiActive: { color: colors.primary },
    input: { backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border, color: colors.text, padding: 14, fontSize: 15, marginBottom: 16 },
    manifestBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
    manifestTxt: { fontSize: 13, letterSpacing: 1.2, color: colors.primaryText, fontWeight: '800' },
  });
}
