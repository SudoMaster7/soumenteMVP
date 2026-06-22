import { useState, type ComponentProps } from 'react';
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
import { todayHermetic } from '@/constants/supereu';
import { useTheme } from '@/lib/theme';
import { useSuperEuStore } from '@/stores/superEuStore';
import { getDiaryReflection } from '@/services/oracleService';
import type { SEDiaryEntry } from '@/types/supereu';

type IconName = ComponentProps<typeof Ionicons>['name'];

type MoodOption = {
  value: string;
  label: string;
  icon: IconName;
};

const MOODS: MoodOption[] = [
  { value: 'neutro', label: 'Neutro', icon: 'ellipse-outline' },
  { value: 'calmo', label: 'Calmo', icon: 'leaf-outline' },
  { value: 'confuso', label: 'Confuso', icon: 'shuffle-outline' },
  { value: 'claro', label: 'Claro', icon: 'sunny-outline' },
  { value: 'intenso', label: 'Intenso', icon: 'flash-outline' },
  { value: 'sombra', label: 'Sombra', icon: 'moon-outline' },
];

const findMood = (value: string): MoodOption =>
  MOODS.find((mood) => mood.value === value || mood.label === value) ?? {
    value,
    label: value || 'Registro',
    icon: 'ellipse-outline',
  };

export default function GrimorioModule() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { goals, habits, purchases, finance, diary, addDiaryEntry, updateDiaryEntry, updateDiaryReflection, deleteDiaryEntry } = useSuperEuStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [form, setForm] = useState({ mood: MOODS[0].value, text: '', tags: '' });
  const [loadingReflection, setLoadingReflection] = useState<string | null>(null);

  function resetForm() {
    setForm({ mood: MOODS[0].value, text: '', tags: '' });
    setEditingEntryId(null);
  }

  function openAdd() {
    resetForm();
    setShowAdd(true);
  }

  function openEdit(entry: SEDiaryEntry) {
    setForm({ mood: findMood(entry.mood).value, text: entry.text, tags: entry.tags.join(', ') });
    setEditingEntryId(entry.id);
    setShowAdd(true);
  }

  function handleSave() {
    if (!form.text.trim() && !form.tags.trim()) return;
    const tags = form.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
    if (editingEntryId) {
      updateDiaryEntry(editingEntryId, {
        mood: form.mood,
        text: form.text.trim(),
        tags,
        aiReflection: undefined,
      });
      resetForm();
      setShowAdd(false);
      return;
    }
    const entry: SEDiaryEntry = {
      id: Date.now().toString(),
      date: todayHermetic(),
      mood: form.mood,
      text: form.text.trim(),
      tags,
    };
    addDiaryEntry(entry);
    resetForm();
    setShowAdd(false);
  }

  async function handleReflection(entry: SEDiaryEntry) {
    setLoadingReflection(entry.id);
    const mood = findMood(entry.mood).label;
    const reflection = await getDiaryReflection(mood, entry.text, { goals, habits, purchases, finance, diary });
    updateDiaryReflection(entry.id, reflection);
    setLoadingReflection(null);
  }

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.introCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <View style={[styles.introIcon, { backgroundColor: colors.primarySoft }]}> 
          <Ionicons name="book-outline" size={23} color={colors.primary} />
        </View>
        <View style={styles.introTextWrap}>
          <Text style={[styles.introTitle, { color: colors.text }]}>Grimorio interno</Text>
          <Text style={[styles.introSub, { color: colors.muted }]}>Registre percepcoes, padroes e sinais que voce quer lembrar.</Text>
        </View>
      </View>

      {diary.map((entry) => {
        const mood = findMood(entry.mood);
        return (
          <View key={entry.id} style={[styles.entryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <View style={styles.entryHeader}>
              <View style={styles.entryDateWrap}>
                <Text style={[styles.entryDate, { color: colors.muted }]}>{entry.date}</Text>
                <View style={[styles.moodPill, { backgroundColor: colors.accentSoft }]}> 
                  <Ionicons name={mood.icon} size={14} color={colors.accent} />
                  <Text style={[styles.moodPillText, { color: colors.accent }]}>{mood.label}</Text>
                </View>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={[styles.smallActionButton, { backgroundColor: colors.primarySoft }]}
                  onPress={() => openEdit(entry)}
                  accessibilityRole="button"
                  accessibilityLabel="Editar entrada do grimorio"
                >
                  <Ionicons name="create-outline" size={16} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallActionButton, { backgroundColor: colors.dangerSoft }]}
                  onPress={() => deleteDiaryEntry(entry.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Excluir entrada do grimorio"
                >
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>

            {entry.text ? <Text style={[styles.entryText, { color: colors.text }]}>{entry.text}</Text> : null}

            {entry.tags.length > 0 ? (
              <View style={styles.tagsRow}>
                {entry.tags.map((tag) => (
                  <View key={tag} style={[styles.tag, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}> 
                    <Text style={[styles.tagText, { color: colors.muted }]}>#{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {entry.aiReflection ? (
              <View style={[styles.reflectionCard, { backgroundColor: colors.backgroundAlt, borderColor: colors.primary }]}> 
                <View style={styles.reflectionHeader}>
                  <Ionicons name="sparkles-outline" size={15} color={colors.primary} />
                  <Text style={[styles.reflectionLabel, { color: colors.primary }]}>Reflexao do Oracle</Text>
                </View>
                <Text style={[styles.reflectionText, { color: colors.text }]}>{entry.aiReflection}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.oracleButton, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
                onPress={() => handleReflection(entry)}
                disabled={loadingReflection === entry.id}
              >
                {loadingReflection === entry.id ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
                    <Text style={[styles.oracleButtonText, { color: colors.primary }]}>Gerar reflexao</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {diary.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Ionicons name="journal-outline" size={28} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum registro ainda</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>Comece com uma frase simples sobre como voce esta hoje.</Text>
        </View>
      ) : null}

      <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={openAdd}>
        <Ionicons name="create-outline" size={18} color={colors.primaryText} />
        <Text style={[styles.addButtonText, { color: colors.primaryText }]}>Nova entrada</Text>
      </TouchableOpacity>

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => { resetForm(); setShowAdd(false); }}>
        <Pressable style={styles.overlay} onPress={() => { resetForm(); setShowAdd(false); }} />
        <ScrollView style={[styles.sheet, { backgroundColor: colors.surfaceElevated }]} keyboardShouldPersistTaps="handled">
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>{editingEntryId ? 'Editar entrada' : 'Nova entrada'}</Text>
            <TouchableOpacity onPress={() => { resetForm(); setShowAdd(false); }} style={[styles.closeButton, { backgroundColor: colors.backgroundAlt }]}> 
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.fieldLabel, { color: colors.muted }]}>Estado de hoje</Text>
          <View style={styles.moodGrid}>
            {MOODS.map((mood) => {
              const active = form.mood === mood.value;
              return (
                <TouchableOpacity
                  key={mood.value}
                  onPress={() => setForm((current) => ({ ...current, mood: mood.value }))}
                  style={[
                    styles.moodButton,
                    { backgroundColor: active ? colors.accentSoft : colors.surface, borderColor: active ? colors.accent : colors.border },
                  ]}
                >
                  <Ionicons name={mood.icon} size={18} color={active ? colors.accent : colors.muted} />
                  <Text style={[styles.moodButtonText, { color: active ? colors.accent : colors.muted }]}>{mood.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="O que o dia revelou?"
            placeholderTextColor={colors.subtle}
            value={form.text}
            onChangeText={(text) => setForm((current) => ({ ...current, text }))}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="Tags separadas por virgula"
            placeholderTextColor={colors.subtle}
            value={form.tags}
            onChangeText={(tags) => setForm((current) => ({ ...current, tags }))}
          />
          <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
            <Text style={[styles.submitButtonText, { color: colors.primaryText }]}>{editingEntryId ? 'Salvar alteracoes' : 'Salvar entrada'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  introCard: { borderRadius: 10, borderWidth: 1, padding: 16, marginBottom: 14, flexDirection: 'row', gap: 12, alignItems: 'center' },
  introIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  introTextWrap: { flex: 1 },
  introTitle: { fontSize: 18, fontWeight: '900', marginBottom: 4 },
  introSub: { fontSize: 13, lineHeight: 19 },
  entryCard: { borderRadius: 10, padding: 16, borderWidth: 1, marginBottom: 12 },
  entryHeader: { flexDirection: 'row', gap: 10, justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  entryDateWrap: { flex: 1, gap: 8 },
  entryDate: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  moodPill: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  moodPillText: { fontSize: 12, fontWeight: '900' },
  headerActions: { flexDirection: 'row', gap: 7 },
  smallActionButton: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  entryText: { fontSize: 14, lineHeight: 22, marginBottom: 12 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 12 },
  tag: { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  tagText: { fontSize: 11, fontWeight: '800' },
  reflectionCard: { borderRadius: 8, padding: 13, borderLeftWidth: 3, marginTop: 2 },
  reflectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 7 },
  reflectionLabel: { fontSize: 12, fontWeight: '900' },
  reflectionText: { fontSize: 13, lineHeight: 20 },
  oracleButton: { borderRadius: 8, borderWidth: 1, padding: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, marginTop: 2 },
  oracleButtonText: { fontSize: 13, fontWeight: '900' },
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
  fieldLabel: { fontSize: 12, fontWeight: '900', marginBottom: 10 },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  moodButton: { width: '31%', minWidth: 92, borderRadius: 9, borderWidth: 1, paddingVertical: 11, paddingHorizontal: 8, alignItems: 'center', gap: 5 },
  moodButtonText: { fontSize: 12, fontWeight: '900' },
  input: { borderRadius: 10, borderWidth: 1, padding: 14, fontSize: 15, marginBottom: 12 },
  textArea: { minHeight: 116 },
  submitButton: { borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 2, marginBottom: 22 },
  submitButtonText: { fontSize: 14, fontWeight: '900' },
});
