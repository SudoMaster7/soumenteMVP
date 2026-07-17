import { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTreinoStore } from '@/stores/treinoStore';
import { MUSCLE_GROUPS, MUSCLE_GROUP_LABEL, MUSCLE_GROUP_ICON } from '@/constants/treino';
import PillTabBar from '@/components/shared/PillTabBar';
import BarTrend from '@/components/shared/BarTrend';
import { useTheme, type AppTheme } from '@/lib/theme';
import type { MuscleGroup, TreinoExercise, TreinoSession, TreinoTemplate } from '@/types/treino';

type TreinoTab = 'treinos' | 'historico';

type ExerciseForm = { id: string; name: string; sets: string; reps: string; load: string };

function toExerciseForm(exercise: TreinoExercise): ExerciseForm {
  return { id: exercise.id, name: exercise.name, sets: String(exercise.sets), reps: String(exercise.reps), load: String(exercise.load) };
}

function fromExerciseForm(form: ExerciseForm): TreinoExercise {
  return {
    id: form.id,
    name: form.name.trim(),
    sets: Math.max(0, parseInt(form.sets, 10) || 0),
    reps: Math.max(0, parseInt(form.reps, 10) || 0),
    load: Math.max(0, Number(form.load.replace(',', '.')) || 0),
  };
}

export default function TreinoScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const { templates, sessions, updateTemplate, addSession } = useTreinoStore();

  const [tab, setTab] = useState<TreinoTab>('treinos');
  const [activeGroup, setActiveGroup] = useState<MuscleGroup>('costas');
  const [showSession, setShowSession] = useState(false);
  const [sessionExercises, setSessionExercises] = useState<ExerciseForm[]>([]);
  const [sessionDuration, setSessionDuration] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [selectedExerciseName, setSelectedExerciseName] = useState<string | null>(null);

  const template = templates.find((t) => t.group === activeGroup);

  const exerciseNames = useMemo(() => {
    const names = new Set<string>();
    sessions.forEach((session) => session.exercises.forEach((exercise) => names.add(exercise.name)));
    return Array.from(names);
  }, [sessions]);

  const activeExerciseName = selectedExerciseName ?? exerciseNames[0] ?? null;

  const exerciseTrend = useMemo(() => {
    if (!activeExerciseName) return [];
    return sessions
      .slice()
      .reverse()
      .flatMap((session) => {
        const found = session.exercises.find((ex) => ex.name === activeExerciseName);
        if (!found) return [];
        const date = new Date(session.date);
        return [{ label: `${date.getDate()}/${date.getMonth() + 1}`, value: found.load }];
      });
  }, [sessions, activeExerciseName]);

  function openSession(tpl: TreinoTemplate) {
    setSessionExercises(tpl.exercises.map(toExerciseForm));
    setSessionDuration('');
    setSessionNotes('');
    setShowSession(true);
  }

  function updateSessionExercise(id: string, patch: Partial<ExerciseForm>) {
    setSessionExercises((current) => current.map((ex) => (ex.id === id ? { ...ex, ...patch } : ex)));
  }

  function handleSaveSession() {
    if (!template) return;
    const exercises = sessionExercises.map(fromExerciseForm).filter((ex) => ex.name.length > 0);
    if (exercises.length === 0) return;
    const session: TreinoSession = {
      id: Date.now().toString(),
      templateId: template.id,
      group: template.group,
      date: new Date().toISOString(),
      durationMinutes: Math.max(0, parseInt(sessionDuration, 10) || 0),
      notes: sessionNotes.trim(),
      exercises,
    };
    addSession(session);
    setShowSession(false);
  }

  function handleAddExerciseToTemplate() {
    if (!template) return;
    const newExercise: TreinoExercise = { id: Date.now().toString(), name: 'Novo exercício', sets: 3, reps: 10, load: 0 };
    updateTemplate(template.id, { exercises: [...template.exercises, newExercise] });
  }

  function handleUpdateTemplateExercise(exerciseId: string, patch: Partial<TreinoExercise>) {
    if (!template) return;
    updateTemplate(template.id, {
      exercises: template.exercises.map((ex) => (ex.id === exerciseId ? { ...ex, ...patch } : ex)),
    });
  }

  function handleDeleteTemplateExercise(exerciseId: string) {
    if (!template) return;
    updateTemplate(template.id, { exercises: template.exercises.filter((ex) => ex.id !== exerciseId) });
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>TREINO</Text>
        <Text style={styles.title}>Seus treinos</Text>
      </View>
      <View style={styles.tabBarWrap}>
        <PillTabBar<TreinoTab>
          active={tab}
          onSelect={setTab}
          tabs={[
            { id: 'treinos', label: 'Treinos', icon: 'barbell-outline' },
            { id: 'historico', label: 'Histórico', icon: 'time-outline' },
          ]}
        />
      </View>

      {tab === 'treinos' ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupRow}>
            {MUSCLE_GROUPS.map((group) => {
              const active = group === activeGroup;
              return (
                <TouchableOpacity
                  key={group}
                  onPress={() => setActiveGroup(group)}
                  style={[styles.groupChip, { backgroundColor: active ? colors.primarySoft : colors.surface, borderColor: active ? colors.primary : colors.border }]}
                >
                  <Ionicons name={MUSCLE_GROUP_ICON[group]} size={15} color={active ? colors.primary : colors.muted} />
                  <Text style={[styles.groupChipText, { color: active ? colors.primary : colors.muted }]}>{MUSCLE_GROUP_LABEL[group]}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {template ? (
            <View style={styles.templateCard}>
              <Text style={styles.templateName}>{template.name}</Text>
              {template.exercises.map((exercise) => (
                <View key={exercise.id} style={styles.exerciseRow}>
                  <TextInput
                    style={[styles.exerciseInput, styles.exerciseNameInput]}
                    value={exercise.name}
                    onChangeText={(name) => handleUpdateTemplateExercise(exercise.id, { name })}
                    placeholder="Nome"
                    placeholderTextColor={colors.subtle}
                  />
                  <TextInput
                    style={styles.exerciseInput}
                    value={String(exercise.sets)}
                    onChangeText={(v) => handleUpdateTemplateExercise(exercise.id, { sets: Math.max(0, parseInt(v, 10) || 0) })}
                    keyboardType="number-pad"
                    placeholder="Séries"
                    placeholderTextColor={colors.subtle}
                  />
                  <TextInput
                    style={styles.exerciseInput}
                    value={String(exercise.reps)}
                    onChangeText={(v) => handleUpdateTemplateExercise(exercise.id, { reps: Math.max(0, parseInt(v, 10) || 0) })}
                    keyboardType="number-pad"
                    placeholder="Reps"
                    placeholderTextColor={colors.subtle}
                  />
                  <TextInput
                    style={styles.exerciseInput}
                    value={String(exercise.load)}
                    onChangeText={(v) => handleUpdateTemplateExercise(exercise.id, { load: Math.max(0, Number(v.replace(',', '.')) || 0) })}
                    keyboardType="decimal-pad"
                    placeholder="Kg"
                    placeholderTextColor={colors.subtle}
                  />
                  <TouchableOpacity onPress={() => handleDeleteTemplateExercise(exercise.id)} style={styles.exerciseDelete}>
                    <Ionicons name="trash-outline" size={15} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.addExerciseBtn} onPress={handleAddExerciseToTemplate}>
                <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
                <Text style={styles.addExerciseBtnTxt}>Adicionar exercício</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.startBtn} onPress={() => openSession(template)}>
                <Ionicons name="play-circle-outline" size={18} color={colors.primaryText} />
                <Text style={styles.startBtnTxt}>Iniciar treino</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {exerciseNames.length > 0 ? (
            <View style={styles.trendCard}>
              <Text style={styles.trendTitle}>Evolução de carga</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.exercisePickerRow}>
                {exerciseNames.map((name) => {
                  const active = name === activeExerciseName;
                  return (
                    <TouchableOpacity
                      key={name}
                      onPress={() => setSelectedExerciseName(name)}
                      style={[styles.exerciseChip, { backgroundColor: active ? colors.primarySoft : colors.surface, borderColor: active ? colors.primary : colors.border }]}
                    >
                      <Text style={[styles.exerciseChipText, { color: active ? colors.primary : colors.muted }]}>{name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <BarTrend data={exerciseTrend} emptyLabel="Registre ao menos 1 treino com este exercício" />
            </View>
          ) : null}

          {sessions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="barbell-outline" size={26} color={colors.primary} />
              <Text style={styles.emptyTitle}>Nenhum treino registrado</Text>
              <Text style={styles.emptyText}>Inicie um treino na aba Treinos para começar seu histórico.</Text>
            </View>
          ) : (
            sessions.map((session) => {
              const expanded = expandedSessionId === session.id;
              const date = new Date(session.date);
              return (
                <TouchableOpacity key={session.id} style={styles.sessionCard} onPress={() => setExpandedSessionId(expanded ? null : session.id)} activeOpacity={0.8}>
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionIconWrap}>
                      <Ionicons name={MUSCLE_GROUP_ICON[session.group]} size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sessionGroup}>{MUSCLE_GROUP_LABEL[session.group]}</Text>
                      <Text style={styles.sessionMeta}>{date.toLocaleDateString('pt-BR')} · {session.durationMinutes} min · {session.exercises.length} exercícios</Text>
                    </View>
                    <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
                  </View>
                  {expanded ? (
                    <View style={styles.sessionDetail}>
                      {session.exercises.map((exercise) => (
                        <Text key={exercise.id} style={styles.sessionExerciseLine}>
                          {exercise.name} — {exercise.sets}x{exercise.reps} · {exercise.load}kg
                        </Text>
                      ))}
                      {session.notes ? <Text style={styles.sessionNotes}>{session.notes}</Text> : null}
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      <Modal visible={showSession} transparent animationType="slide" onRequestClose={() => setShowSession(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowSession(false)} />
        <ScrollView style={styles.sheet} keyboardShouldPersistTaps="handled">
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Registrar treino</Text>
            <TouchableOpacity onPress={() => setShowSession(false)} style={styles.closeButton}>
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {sessionExercises.map((exercise) => (
            <View key={exercise.id} style={styles.exerciseRow}>
              <TextInput
                style={[styles.exerciseInput, styles.exerciseNameInput]}
                value={exercise.name}
                onChangeText={(name) => updateSessionExercise(exercise.id, { name })}
                placeholder="Nome"
                placeholderTextColor={colors.subtle}
              />
              <TextInput
                style={styles.exerciseInput}
                value={exercise.sets}
                onChangeText={(sets) => updateSessionExercise(exercise.id, { sets })}
                keyboardType="number-pad"
                placeholder="Séries"
                placeholderTextColor={colors.subtle}
              />
              <TextInput
                style={styles.exerciseInput}
                value={exercise.reps}
                onChangeText={(reps) => updateSessionExercise(exercise.id, { reps })}
                keyboardType="number-pad"
                placeholder="Reps"
                placeholderTextColor={colors.subtle}
              />
              <TextInput
                style={styles.exerciseInput}
                value={exercise.load}
                onChangeText={(load) => updateSessionExercise(exercise.id, { load })}
                keyboardType="decimal-pad"
                placeholder="Kg"
                placeholderTextColor={colors.subtle}
              />
            </View>
          ))}

          <TextInput
            style={styles.input}
            placeholder="Duração total (minutos)"
            placeholderTextColor={colors.subtle}
            value={sessionDuration}
            onChangeText={setSessionDuration}
            keyboardType="number-pad"
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Observações livres"
            placeholderTextColor={colors.subtle}
            value={sessionNotes}
            onChangeText={setSessionNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSaveSession}>
            <Text style={styles.submitButtonText}>Salvar treino</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

function makeStyles(theme: AppTheme) {
  const colors = theme.colors;
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 24, paddingTop: 58 },
    tabBarWrap: { paddingHorizontal: 24 },
    eyebrow: { fontSize: 9, letterSpacing: 4, color: colors.primary, fontWeight: '800', marginBottom: 8 },
    title: { fontSize: 28, fontWeight: '800', color: colors.text, lineHeight: 33, marginBottom: 4 },
    scroll: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },
    groupRow: { gap: 8, paddingBottom: 14 },
    groupChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 9, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9 },
    groupChipText: { fontSize: 12, fontWeight: '800' },
    templateCard: { backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 14 },
    templateName: { fontSize: 16, fontWeight: '900', color: colors.text, marginBottom: 12 },
    exerciseRow: { flexDirection: 'row', gap: 6, marginBottom: 8, alignItems: 'center' },
    exerciseInput: { flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: 8, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingVertical: 8, paddingHorizontal: 8, fontSize: 12 },
    exerciseNameInput: { flex: 2 },
    exerciseDelete: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.dangerSoft },
    addExerciseBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 16 },
    addExerciseBtnTxt: { color: colors.primary, fontSize: 12, fontWeight: '800' },
    startBtn: { backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    startBtnTxt: { color: colors.primaryText, fontSize: 13, fontWeight: '800', letterSpacing: 1 },
    trendCard: { backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 16 },
    trendTitle: { fontSize: 14, fontWeight: '900', color: colors.text, marginBottom: 10 },
    exercisePickerRow: { gap: 8, paddingBottom: 10 },
    exerciseChip: { borderRadius: 100, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
    exerciseChipText: { fontSize: 11, fontWeight: '800' },
    emptyCard: { backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 18, alignItems: 'center', gap: 7 },
    emptyTitle: { fontSize: 15, fontWeight: '900', color: colors.text },
    emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19, color: colors.muted },
    sessionCard: { backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10 },
    sessionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    sessionIconWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    sessionGroup: { fontSize: 14, fontWeight: '800', color: colors.text },
    sessionMeta: { fontSize: 11, color: colors.muted, marginTop: 2 },
    sessionDetail: { marginTop: 12, gap: 4 },
    sessionExerciseLine: { fontSize: 12, color: colors.text },
    sessionNotes: { fontSize: 12, color: colors.muted, marginTop: 6, fontStyle: 'italic' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
    sheet: { backgroundColor: colors.surfaceElevated, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20, paddingBottom: 32, maxHeight: '80%' },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    sheetTitle: { fontSize: 18, fontWeight: '900', color: colors.text },
    closeButton: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundAlt },
    input: { borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, padding: 14, fontSize: 15, marginBottom: 12 },
    textArea: { minHeight: 80 },
    submitButton: { backgroundColor: colors.primary, borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 2 },
    submitButtonText: { color: colors.primaryText, fontSize: 14, fontWeight: '900' },
  });
}
