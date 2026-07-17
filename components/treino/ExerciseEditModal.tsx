import { useEffect, useState } from 'react';
import {
  Modal, Pressable, View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Stepper from '@/components/shared/Stepper';
import DifficultyPicker from '@/components/treino/DifficultyPicker';
import { useTheme, type AppTheme } from '@/lib/theme';
import type { TreinoExercise } from '@/types/treino';

interface Props {
  visible: boolean;
  exercise: TreinoExercise | null;
  onSave: (exercise: TreinoExercise) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const EMPTY: Omit<TreinoExercise, 'id'> = { name: '', sets: 3, reps: 10, load: 0, difficulty: 'medio' };

export default function ExerciseEditModal({ visible, exercise, onSave, onDelete, onClose }: Props) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const [form, setForm] = useState<Omit<TreinoExercise, 'id'>>(EMPTY);

  useEffect(() => {
    if (visible) setForm(exercise ? { ...exercise } : EMPTY);
  }, [visible, exercise]);

  function handleSave() {
    if (!form.name.trim()) return;
    onSave({ id: exercise?.id ?? Date.now().toString(), ...form, name: form.name.trim() });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
        <ScrollView style={styles.sheet} keyboardShouldPersistTaps="handled">
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{exercise ? 'Editar exercício' : 'Novo exercício'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Nome do exercício"
            placeholderTextColor={colors.subtle}
            value={form.name}
            onChangeText={(name) => setForm((f) => ({ ...f, name }))}
          />

          <View style={styles.stepperRow}>
            <Stepper label="Séries" value={form.sets} onChange={(sets) => setForm((f) => ({ ...f, sets }))} min={1} max={20} />
            <Stepper label="Repetições" value={form.reps} onChange={(reps) => setForm((f) => ({ ...f, reps }))} min={1} max={50} />
          </View>
          <View style={styles.stepperRow}>
            <Stepper label="Carga" value={form.load} onChange={(load) => setForm((f) => ({ ...f, load }))} min={0} max={500} step={2.5} unit="kg" />
          </View>

          <DifficultyPicker value={form.difficulty} onChange={(difficulty) => setForm((f) => ({ ...f, difficulty }))} />

          <TouchableOpacity style={[styles.submitButton, !form.name.trim() && styles.submitButtonDisabled]} onPress={handleSave} disabled={!form.name.trim()}>
            <Text style={styles.submitButtonText}>{exercise ? 'Salvar alterações' : 'Adicionar exercício'}</Text>
          </TouchableOpacity>

          {exercise && onDelete ? (
            <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
              <Text style={styles.deleteButtonText}>Remover exercício</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(theme: AppTheme) {
  const colors = theme.colors;
  return StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
    sheetWrap: { maxHeight: '85%' },
    sheet: { backgroundColor: colors.surfaceElevated, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20, paddingBottom: 32 },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    sheetTitle: { fontSize: 18, fontWeight: '900', color: colors.text },
    closeButton: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundAlt },
    input: { borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, padding: 14, fontSize: 15, marginBottom: 16 },
    stepperRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    submitButton: { backgroundColor: colors.primary, borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 4 },
    submitButtonDisabled: { opacity: 0.5 },
    submitButtonText: { color: colors.primaryText, fontSize: 14, fontWeight: '900' },
    deleteButton: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
    deleteButtonText: { color: colors.danger, fontSize: 12, fontWeight: '800' },
  });
}
