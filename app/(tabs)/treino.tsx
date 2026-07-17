import { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTreinoStore } from '@/stores/treinoStore';
import { MUSCLE_GROUPS, MUSCLE_GROUP_LABEL, MUSCLE_GROUP_ICON, DIFFICULTY_LABEL, DIFFICULTY_TONE_FG, DIFFICULTY_TONE_BG } from '@/constants/treino';
import PillTabBar from '@/components/shared/PillTabBar';
import BarTrend from '@/components/shared/BarTrend';
import Stepper from '@/components/shared/Stepper';
import DifficultyPicker from '@/components/treino/DifficultyPicker';
import ExerciseEditModal from '@/components/treino/ExerciseEditModal';
import { useTheme, type AppTheme } from '@/lib/theme';
import type { MuscleGroup, TreinoExercise, TreinoSession, TreinoTemplate } from '@/types/treino';

type TreinoTab = 'treinos' | 'historico';

export default function TreinoScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const { templates, sessions, addTemplate, updateTemplate, addSession } = useTreinoStore();

  const [tab, setTab] = useState<TreinoTab>('treinos');
  const [activeGroup, setActiveGroup] = useState<MuscleGroup>('costas');
  const [editingExercise, setEditingExercise] = useState<{ exercise: TreinoExercise | null } | null>(null);
  const [showSession, setShowSession] = useState(false);
  const [sessionExercises, setSessionExercises] = useState<TreinoExercise[]>([]);
  const [sessionDuration, setSessionDuration] = useState(30);
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
    setSessionExercises(tpl.exercises.map((ex) => ({ ...ex, completed: false })));
    setSessionDuration(30);
    setSessionNotes('');
    setShowSession(true);
  }

  function updateSessionExercise(id: string, patch: Partial<TreinoExercise>) {
    setSessionExercises((current) => current.map((ex) => (ex.id === id ? { ...ex, ...patch } : ex)));
  }

  const completedCount = sessionExercises.filter((ex) => ex.completed).length;

  function handleSaveSession() {
    if (!template) return;
    if (sessionExercises.length === 0) return;
    const session: TreinoSession = {
      id: Date.now().toString(),
      templateId: template.id,
      group: template.group,
      date: new Date().toISOString(),
      durationMinutes: sessionDuration,
      notes: sessionNotes.trim(),
      exercises: sessionExercises,
    };
    addSession(session);
    setShowSession(false);
  }

  function handleSaveExercise(exercise: TreinoExercise) {
    if (!template) return;
    const exists = template.exercises.some((ex) => ex.id === exercise.id);
    updateTemplate(template.id, {
      exercises: exists
        ? template.exercises.map((ex) => (ex.id === exercise.id ? exercise : ex))
        : [...template.exercises, exercise],
    });
    setEditingExercise(null);
  }

  function handleDeleteExercise() {
    if (!template || !editingExercise?.exercise) return;
    updateTemplate(template.id, { exercises: template.exercises.filter((ex) => ex.id !== editingExercise.exercise!.id) });
    setEditingExercise(null);
  }

  function ensureTemplateForGroup(group: MuscleGroup) {
    setActiveGroup(group);
    if (!templates.some((t) => t.group === group)) {
      addTemplate({ id: `tpl-${group}-${Date.now()}`, group, name: `${MUSCLE_GROUP_LABEL[group]} padrão`, exercises: [] });
    }
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
                  onPress={() => ensureTemplateForGroup(group)}
                  style={[styles.groupChip, { backgroundColor: active ? colors.primarySoft : colors.surface, borderColor: active ? colors.primary : colors.border }]}
                >
                  <Ionicons name={MUSCLE_GROUP_ICON[group]} size={16} color={active ? colors.primary : colors.muted} />
                  <Text style={[styles.groupChipText, { color: active ? colors.primary : colors.muted }]}>{MUSCLE_GROUP_LABEL[group]}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {template ? (
            <View style={styles.templateCard}>
              <Text style={styles.templateName}>{template.name}</Text>

              {template.exercises.length === 0 ? (
                <Text style={styles.emptyExercises}>Nenhum exercício ainda. Adicione o primeiro abaixo.</Text>
              ) : (
                template.exercises.map((exercise) => {
                  const fg = colors[DIFFICULTY_TONE_FG[exercise.difficulty]];
                  const bg = colors[DIFFICULTY_TONE_BG[exercise.difficulty]];
                  return (
                    <TouchableOpacity
                      key={exercise.id}
                      style={styles.exerciseCard}
                      onPress={() => setEditingExercise({ exercise })}
                      activeOpacity={0.75}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.exerciseName} numberOfLines={1}>{exercise.name}</Text>
                        <Text style={styles.exerciseMeta}>{exercise.sets}x{exercise.reps} · {exercise.load}kg</Text>
                      </View>
                      <View style={[styles.difficultyBadge, { backgroundColor: bg, borderColor: fg }]}>
                        <Text style={[styles.difficultyBadgeText, { color: fg }]}>{DIFFICULTY_LABEL[exercise.difficulty]}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.subtle} style={{ marginLeft: 6 }} />
                    </TouchableOpacity>
                  );
                })
              )}

              <TouchableOpacity style={styles.addExerciseBtn} onPress={() => setEditingExercise({ exercise: null })}>
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <Text style={styles.addExerciseBtnTxt}>Adicionar exercício</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.startBtn, template.exercises.length === 0 && styles.startBtnDisabled]}
                onPress={() => openSession(template)}
                disabled={template.exercises.length === 0}
              >
                <Ionicons name="play-circle-outline" size={20} color={colors.primaryText} />
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
                        <View key={exercise.id} style={styles.sessionExerciseRow}>
                          {exercise.completed ? <Ionicons name="checkmark-circle" size={14} color={colors.success} /> : <Ionicons name="ellipse-outline" size={14} color={colors.subtle} />}
                          <Text style={styles.sessionExerciseLine}>
                            {exercise.name} — {exercise.sets}x{exercise.reps} · {exercise.load}kg · {DIFFICULTY_LABEL[exercise.difficulty]}
                          </Text>
                        </View>
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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
          <ScrollView style={styles.sheet} keyboardShouldPersistTaps="handled">
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Registrar treino</Text>
                <Text style={styles.sheetSubtitle}>{completedCount}/{sessionExercises.length} exercícios concluídos</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSession(false)} style={styles.closeButton}>
                <Ionicons name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            {sessionExercises.map((exercise) => (
              <View key={exercise.id} style={styles.sessionExerciseCard}>
                <TouchableOpacity
                  style={styles.sessionExerciseHeader}
                  onPress={() => updateSessionExercise(exercise.id, { completed: !exercise.completed })}
                  activeOpacity={0.7}
                >
                  <Ionicons name={exercise.completed ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={exercise.completed ? colors.success : colors.subtle} />
                  <Text style={[styles.sessionExerciseName, exercise.completed && styles.sessionExerciseNameDone]} numberOfLines={1}>{exercise.name}</Text>
                </TouchableOpacity>

                <View style={styles.stepperRow}>
                  <Stepper label="Séries" value={exercise.sets} onChange={(sets) => updateSessionExercise(exercise.id, { sets })} min={1} max={20} />
                  <Stepper label="Repetições" value={exercise.reps} onChange={(reps) => updateSessionExercise(exercise.id, { reps })} min={1} max={50} />
                </View>
                <View style={[styles.stepperRow, { marginBottom: 14 }]}>
                  <Stepper label="Carga" value={exercise.load} onChange={(load) => updateSessionExercise(exercise.id, { load })} min={0} max={500} step={2.5} unit="kg" />
                </View>

                <DifficultyPicker label="Como foi?" value={exercise.difficulty} onChange={(difficulty) => updateSessionExercise(exercise.id, { difficulty })} />
              </View>
            ))}

            <View style={[styles.stepperRow, { marginTop: 4 }]}>
              <Stepper label="Duração" value={sessionDuration} onChange={setSessionDuration} min={5} max={240} step={5} unit="min" />
            </View>
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
        </KeyboardAvoidingView>
      </Modal>

      <ExerciseEditModal
        visible={editingExercise !== null}
        exercise={editingExercise?.exercise ?? null}
        onSave={handleSaveExercise}
        onDelete={editingExercise?.exercise ? handleDeleteExercise : undefined}
        onClose={() => setEditingExercise(null)}
      />
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
    groupRow: { gap: 8, paddingBottom: 16 },
    groupChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11 },
    groupChipText: { fontSize: 12, fontWeight: '800' },
    templateCard: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14 },
    templateName: { fontSize: 17, fontWeight: '900', color: colors.text, marginBottom: 14 },
    emptyExercises: { fontSize: 13, color: colors.subtle, fontStyle: 'italic', marginBottom: 14 },
    exerciseCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surfaceElevated, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10, minHeight: 56 },
    exerciseName: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 3 },
    exerciseMeta: { fontSize: 12, color: colors.muted },
    difficultyBadge: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 9, paddingVertical: 4 },
    difficultyBadgeText: { fontSize: 10, fontWeight: '800' },
    addExerciseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 13, marginTop: 2, marginBottom: 14 },
    addExerciseBtnTxt: { color: colors.primary, fontSize: 13, fontWeight: '800' },
    startBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    startBtnDisabled: { opacity: 0.4 },
    startBtnTxt: { color: colors.primaryText, fontSize: 14, fontWeight: '800', letterSpacing: 1 },
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
    sessionDetail: { marginTop: 12, gap: 6 },
    sessionExerciseRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sessionExerciseLine: { fontSize: 12, color: colors.text, flexShrink: 1 },
    sessionNotes: { fontSize: 12, color: colors.muted, marginTop: 6, fontStyle: 'italic' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
    sheetWrap: { maxHeight: '88%' },
    sheet: { backgroundColor: colors.surfaceElevated, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20, paddingBottom: 32 },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
    sheetTitle: { fontSize: 18, fontWeight: '900', color: colors.text },
    sheetSubtitle: { fontSize: 12, color: colors.muted, marginTop: 3, fontWeight: '700' },
    closeButton: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundAlt },
    sessionExerciseCard: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 12 },
    sessionExerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    sessionExerciseName: { flex: 1, fontSize: 15, fontWeight: '800', color: colors.text },
    sessionExerciseNameDone: { color: colors.muted, textDecorationLine: 'line-through' },
    stepperRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    input: { borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, padding: 14, fontSize: 15, marginBottom: 12, marginTop: 4 },
    textArea: { minHeight: 80 },
    submitButton: { backgroundColor: colors.primary, borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 2 },
    submitButtonText: { color: colors.primaryText, fontSize: 14, fontWeight: '900' },
  });
}
