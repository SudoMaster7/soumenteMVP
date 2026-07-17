import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, Alert,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useDiary } from '@/hooks/useDiary';
import { saveDiaryEntry } from '@/services/diaryService';
import { getCurrentUser } from '@/services/authService';
import { EmotionGrid } from '@/components/diary/EmotionGrid';
import { DimensionPicker } from '@/components/diary/DimensionPicker';
import { EntryCard } from '@/components/diary/EntryCard';
import PillTabBar from '@/components/shared/PillTabBar';
import GrimorioPanel from '@/components/grimorio/GrimorioPanel';
import { useTheme, type AppTheme } from '@/lib/theme';
import type { EmotionType, DimensionType } from '@/types';

type DiaryTab = 'emocional' | 'grimorio';

export default function Diary() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const { todayEntry, history, streak, loading, refetch } = useDiary();
  const [emotion, setEmotion] = useState<EmotionType | null>(null);
  const [text, setText] = useState('');
  const [dimension, setDimension] = useState<DimensionType | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<DiaryTab>('emocional');

  useFocusEffect(useCallback(() => { refetch(); }, []));

  async function handleSave() {
    if (!emotion) { Alert.alert('Selecione uma emocao'); return; }
    if (!dimension) { Alert.alert('Selecione a profundidade do dia'); return; }
    const user = await getCurrentUser();
    if (!user) return;

    setSaving(true);
    try {
      await saveDiaryEntry(user.id, {
        emotion_primary: emotion,
        text: text.trim() || undefined,
        dimension,
      });
      setShowForm(false);
      setEmotion(null);
      setText('');
      setDimension(null);
      await refetch();
    } catch (error) {
      console.error('Failed to save diary entry', error);
      Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>DIARIO</Text>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Como foi seu dia?</Text>
            <Text style={styles.subtitle}>Um registro honesto ja conta como cuidado.</Text>
          </View>
          <View style={styles.streakBadge}>
            <Ionicons name="flame-outline" size={20} color={colors.warning} />
            <Text style={styles.streakNum}>{streak}</Text>
            <Text style={styles.streakLabel}>dias</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabBarWrap}>
        <PillTabBar<DiaryTab>
          active={tab}
          onSelect={setTab}
          tabs={[
            { id: 'emocional', label: 'Emocional', icon: 'heart-outline' },
            { id: 'grimorio', label: 'Grimório', icon: 'book-outline' },
          ]}
        />
      </View>

      {tab === 'emocional' ? (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {todayEntry && !showForm ? (
            <View style={styles.todayCard}>
              <View style={styles.savedHeader}>
                <Ionicons name="checkmark-circle" size={19} color={colors.success} />
                <Text style={styles.todayLabel}>REGISTRADO HOJE</Text>
              </View>
              <EntryCard entry={todayEntry} />
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowForm(true)}>
                <Ionicons name="create-outline" size={16} color={colors.primary} />
                <Text style={styles.secondaryText}>Editar registro de hoje</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formCard}>
              <Text style={styles.formLabel}>1. COMO VOCE ESTA?</Text>
              <EmotionGrid selected={emotion} onSelect={setEmotion} />

              <Text style={[styles.formLabel, { marginTop: 24 }]}>2. O QUE ACONTECEU?</Text>
              <TextInput
                style={styles.textarea}
                placeholder="Escreva livremente... (opcional)"
                placeholderTextColor={colors.subtle}
                value={text}
                onChangeText={setText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text style={[styles.formLabel, { marginTop: 8 }]}>3. PROFUNDIDADE DO DIA</Text>
              <DimensionPicker selected={dimension} onSelect={setDimension} />

              <TouchableOpacity
                style={[styles.saveBtn, (!emotion || !dimension) && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!emotion || !dimension || saving}
              >
                {saving ? <ActivityIndicator color={colors.primaryText} /> : <Text style={styles.saveBtnText}>Salvar e fechar o dia</Text>}
              </TouchableOpacity>
            </View>
          )}

          {history.length > 0 ? (
            <>
              <Text style={[styles.eyebrow, { marginTop: 28, marginBottom: 12 }]}>HISTORICO</Text>
              {history.slice(todayEntry ? 1 : 0).map(entry => <EntryCard key={entry.id} entry={entry} />)}
            </>
          ) : null}
        </ScrollView>
      ) : (
        <GrimorioPanel />
      )}
    </KeyboardAvoidingView>
  );
}

function makeStyles(theme: AppTheme) {
  const colors = theme.colors;
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 24, paddingTop: 16, paddingBottom: 40 },
    center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
    header: { paddingHorizontal: 24, paddingTop: 58 },
    tabBarWrap: { paddingHorizontal: 24 },
    eyebrow: { fontSize: 9, letterSpacing: 4, color: colors.primary, fontWeight: '800', marginBottom: 8 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 24 },
    title: { fontSize: 34, fontWeight: '800', color: colors.text, lineHeight: 39 },
    subtitle: { fontSize: 14, color: colors.muted, lineHeight: 20, marginTop: 6 },
    streakBadge: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.border, minWidth: 72 },
    streakNum: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 2 },
    streakLabel: { fontSize: 9, color: colors.muted, letterSpacing: 1 },
    todayCard: { marginBottom: 24 },
    savedHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
    todayLabel: { fontSize: 9, letterSpacing: 3, color: colors.success, fontWeight: '800' },
    secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 10, padding: 13, marginTop: 2 },
    secondaryText: { fontSize: 12, color: colors.primary, fontWeight: '800', letterSpacing: 0.8 },
    formCard: { backgroundColor: colors.surface, borderRadius: 10, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
    formLabel: { fontSize: 9, letterSpacing: 3, color: colors.primary, fontWeight: '800', marginBottom: 12 },
    textarea: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, color: colors.text, fontSize: 15, minHeight: 104, marginBottom: 16, lineHeight: 22 },
    saveBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 18 },
    saveBtnDisabled: { opacity: 0.35 },
    saveBtnText: { color: colors.primaryText, fontSize: 13, fontWeight: '800', letterSpacing: 1.4 },
  });
}
