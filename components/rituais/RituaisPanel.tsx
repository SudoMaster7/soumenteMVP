import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSuperEuStore } from '@/stores/superEuStore';
import { useTheme, type AppTheme } from '@/lib/theme';
import { requestPermissions, scheduleRitualNotification, cancelRitualNotification } from '@/lib/notifications';
import type { SEHabit } from '@/types/supereu';

const DAYS = [
  { short: 'S', label: 'Seg' },
  { short: 'T', label: 'Ter' },
  { short: 'Q', label: 'Qua' },
  { short: 'Q', label: 'Qui' },
  { short: 'S', label: 'Sex' },
  { short: 'S', label: 'Sáb' },
  { short: 'D', label: 'Dom' },
];

const ICONS = ['*', 'o', '+', '#', '@', '~', '^', '!', '%', '&'];

const CATEGORIES: { id: SEHabit['category']; label: string }[] = [
  { id: 'manha', label: 'Manhã' },
  { id: 'tarde', label: 'Tarde' },
  { id: 'noite', label: 'Noite' },
];

function pad2(n: number) {
  return String(Math.max(0, Math.min(99, n))).padStart(2, '0');
}

export default function RituaisPanel() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const { habits, toggleHabitDay, addHabit, updateHabit, deleteHabit } = useSuperEuStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [form, setForm] = useState({ icon: '*', name: '', category: 'manha' as SEHabit['category'], hour: '', minute: '' });

  const todayIdx = (() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  })();

  const completedToday = habits.filter((h) => h.days[todayIdx]).length;
  const percentToday = habits.length ? Math.round((completedToday / habits.length) * 100) : 0;

  function resetForm() {
    setForm({ icon: '*', name: '', category: 'manha', hour: '', minute: '' });
    setEditingHabitId(null);
  }

  function openAdd() {
    resetForm();
    setShowAdd(true);
  }

  function openEdit(habit: SEHabit) {
    const [hour, minute] = (habit.time ?? '').split(':');
    setForm({ icon: habit.icon, name: habit.name, category: habit.category, hour: hour ?? '', minute: minute ?? '' });
    setEditingHabitId(habit.id);
    setShowAdd(true);
  }

  async function applyNotification(habitId: string, habitName: string) {
    const hasHour = form.hour.trim().length > 0;
    const hasMinute = form.minute.trim().length > 0;
    if (!hasHour && !hasMinute) {
      await cancelRitualNotification(habitId);
      return undefined;
    }
    const hour = Math.min(23, Math.max(0, parseInt(form.hour || '0', 10) || 0));
    const minute = Math.min(59, Math.max(0, parseInt(form.minute || '0', 10) || 0));
    const granted = await requestPermissions();
    if (granted) {
      await scheduleRitualNotification(habitId, hour, minute, habitName);
    }
    return `${pad2(hour)}:${pad2(minute)}`;
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    const name = form.name.trim();

    if (editingHabitId) {
      const time = await applyNotification(editingHabitId, name);
      updateHabit(editingHabitId, { icon: form.icon, name, category: form.category, time });
      resetForm();
      setShowAdd(false);
      return;
    }

    const id = Date.now().toString();
    const time = await applyNotification(id, name);
    const newHabit: SEHabit = {
      id,
      icon: form.icon,
      name,
      streak: 0,
      days: [false, false, false, false, false, false, false],
      category: form.category,
      time,
    };
    addHabit(newHabit);
    resetForm();
    setShowAdd(false);
  }

  function handleDelete(habit: SEHabit) {
    void cancelRitualNotification(habit.id);
    deleteHabit(habit.id);
  }

  const sections = CATEGORIES.map((cat) => ({
    ...cat,
    items: habits.filter((h) => h.category === cat.id),
  }));

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>RITUAIS</Text>
      <Text style={styles.title}>Seus rituais diários</Text>
      <Text style={styles.subtitle}>{completedToday} de {habits.length} rituais completos hoje</Text>

      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${percentToday}%` }]} />
      </View>

      {sections.map((section) => (
        <View key={section.id} style={styles.section}>
          <Text style={styles.sectionLabel}>{section.label.toUpperCase()}</Text>
          {section.items.length === 0 ? (
            <Text style={styles.emptyHint}>Nenhum ritual nesse período</Text>
          ) : (
            <View style={styles.ritualList}>
              {section.items.map((habit) => {
                const doneCount = habit.days.filter(Boolean).length;
                return (
                  <View key={habit.id} style={styles.habitCard}>
                    <View style={styles.habitHeader}>
                      <View style={styles.habitLeft}>
                        <View style={styles.habitIconWrap}><Text style={styles.habitIcon}>{habit.icon}</Text></View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.habitName} numberOfLines={2}>{habit.name}</Text>
                          <Text style={styles.habitMeta}>
                            {doneCount}/7 dias · streak {habit.streak}{habit.time ? ` · ${habit.time}` : ''}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.rowActions}>
                        <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(habit)} accessibilityRole="button" accessibilityLabel={`Editar ritual ${habit.name}`}>
                          <Ionicons name="create-outline" size={15} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(habit)} accessibilityRole="button" accessibilityLabel={`Excluir ritual ${habit.name}`}>
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
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
        <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
        <Text style={styles.addBtnTxt}>Novo ritual</Text>
      </TouchableOpacity>

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => { resetForm(); setShowAdd(false); }}>
        <Pressable style={styles.overlay} onPress={() => { resetForm(); setShowAdd(false); }} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{editingHabitId ? 'Editar ritual' : 'Novo ritual'}</Text>
          <Text style={styles.sheetHint}>Escolha um símbolo, categoria e um horário opcional para notificar.</Text>
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

          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryBtn, form.category === cat.id && styles.categoryBtnActive]}
                onPress={() => setForm((f) => ({ ...f, category: cat.id }))}
              >
                <Text style={[styles.categoryBtnTxt, form.category === cat.id && styles.categoryBtnTxtActive]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.timeLabel}>Horário da notificação (opcional)</Text>
          <View style={styles.timeRow}>
            <TextInput
              style={styles.timeInput}
              placeholder="HH"
              placeholderTextColor={colors.subtle}
              value={form.hour}
              onChangeText={(t) => setForm((f) => ({ ...f, hour: t.replace(/\D/g, '').slice(0, 2) }))}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={styles.timeSeparator}>:</Text>
            <TextInput
              style={styles.timeInput}
              placeholder="MM"
              placeholderTextColor={colors.subtle}
              value={form.minute}
              onChangeText={(t) => setForm((f) => ({ ...f, minute: t.replace(/\D/g, '').slice(0, 2) }))}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>

          <TouchableOpacity style={styles.manifestBtn} onPress={handleSave}>
            <Text style={styles.manifestTxt}>{editingHabitId ? 'Salvar alterações' : 'Criar ritual'}</Text>
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
    content: { padding: 24, paddingTop: 58, paddingBottom: 40 },
    eyebrow: { fontSize: 9, letterSpacing: 4, color: colors.primary, fontWeight: '800', marginBottom: 8 },
    title: { fontSize: 34, fontWeight: '800', color: colors.text, lineHeight: 39 },
    subtitle: { fontSize: 14, color: colors.muted, lineHeight: 20, marginTop: 6, marginBottom: 14 },
    progressBg: { height: 6, backgroundColor: colors.backgroundAlt, borderRadius: 100, overflow: 'hidden', marginBottom: 24 },
    progressFill: { height: 6, backgroundColor: colors.success, borderRadius: 100 },
    section: { marginBottom: 20 },
    sectionLabel: { fontSize: 10, letterSpacing: 2, color: colors.muted, fontWeight: '800', marginBottom: 10 },
    emptyHint: { fontSize: 12, color: colors.subtle, fontStyle: 'italic' },
    ritualList: { gap: 10 },
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
    addBtn: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 10, padding: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4, flexDirection: 'row', gap: 8 },
    addBtnTxt: { color: colors.primary, fontSize: 13, fontWeight: '800', letterSpacing: 1 },
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
    categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    categoryBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center' },
    categoryBtnActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
    categoryBtnTxt: { fontSize: 12, color: colors.muted, fontWeight: '800' },
    categoryBtnTxtActive: { color: colors.primary },
    timeLabel: { fontSize: 11, color: colors.muted, fontWeight: '700', marginBottom: 8 },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
    timeInput: { width: 60, backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border, color: colors.text, padding: 12, fontSize: 15, textAlign: 'center' },
    timeSeparator: { fontSize: 18, color: colors.text, fontWeight: '800' },
    manifestBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
    manifestTxt: { fontSize: 13, letterSpacing: 1.2, color: colors.primaryText, fontWeight: '800' },
  });
}
