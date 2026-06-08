import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, Alert,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useDiary } from '@/hooks/useDiary';
import { saveDiaryEntry } from '@/services/diaryService';
import { getCurrentUser } from '@/services/authService';
import { EmotionGrid } from '@/components/diary/EmotionGrid';
import { DimensionPicker } from '@/components/diary/DimensionPicker';
import { EntryCard } from '@/components/diary/EntryCard';
import type { EmotionType, DimensionType } from '@/types';

export default function Diary() {
  const { todayEntry, history, streak, loading, refetch } = useDiary();
  const [emotion, setEmotion] = useState<EmotionType | null>(null);
  const [text, setText] = useState('');
  const [dimension, setDimension] = useState<DimensionType | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useFocusEffect(useCallback(() => { refetch(); }, []));

  async function handleSave() {
    if (!emotion) { Alert.alert('Selecione uma emoção'); return; }
    if (!dimension) { Alert.alert('Selecione a dimensão do dia'); return; }
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
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#C4A882" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        <Text style={styles.eyebrow}>DIÁRIO</Text>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Como foi{'\n'}seu dia?</Text>
          {streak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakFire}>🔥</Text>
              <Text style={styles.streakNum}>{streak}</Text>
              <Text style={styles.streakLabel}>dias</Text>
            </View>
          )}
        </View>

        {todayEntry && !showForm ? (
          <View style={styles.todayCard}>
            <Text style={styles.todayLabel}>REGISTRADO HOJE</Text>
            <EntryCard entry={todayEntry} />
            <TouchableOpacity onPress={() => setShowForm(true)}>
              <Text style={styles.editLink}>Editar registro de hoje</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formCard}>
            <Text style={styles.formLabel}>COMO VOCÊ ESTÁ?</Text>
            <EmotionGrid selected={emotion} onSelect={setEmotion} />

            <Text style={[styles.formLabel, { marginTop: 24 }]}>O QUE ACONTECEU HOJE?</Text>
            <TextInput
              style={styles.textarea}
              placeholder="Escreva livremente... (opcional)"
              placeholderTextColor="#6A6258"
              value={text}
              onChangeText={setText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={[styles.formLabel, { marginTop: 8 }]}>DIMENSÃO DO DIA</Text>
            <DimensionPicker selected={dimension} onSelect={setDimension} />

            <TouchableOpacity
              style={[styles.saveBtn, (!emotion || !dimension) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!emotion || !dimension || saving}
            >
              <Text style={styles.saveBtnText}>
                {saving ? 'Salvando...' : 'Salvar registro'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {history.length > 0 && (
          <>
            <Text style={[styles.eyebrow, { marginTop: 32, marginBottom: 12 }]}>
              ENTRADAS ANTERIORES
            </Text>
            {history.slice(todayEntry ? 1 : 0).map(entry => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0906' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: '#0A0906', alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 9, letterSpacing: 4, color: '#C4A882', fontWeight: 'bold', marginBottom: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#F0E8D8', lineHeight: 42 },
  streakBadge: { alignItems: 'center', backgroundColor: '#1C1915', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#2A2420' },
  streakFire: { fontSize: 20 },
  streakNum: { fontSize: 22, fontWeight: 'bold', color: '#C4A882' },
  streakLabel: { fontSize: 9, color: '#6A6258', letterSpacing: 1 },
  todayCard: { marginBottom: 24 },
  todayLabel: { fontSize: 9, letterSpacing: 3, color: '#4A7A5A', fontWeight: 'bold', marginBottom: 10 },
  editLink: { fontSize: 12, color: '#6A6258', textAlign: 'center', marginTop: 8 },
  formCard: { backgroundColor: '#1C1915', borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#2A2420' },
  formLabel: { fontSize: 9, letterSpacing: 3, color: '#C4A882', fontWeight: 'bold', marginBottom: 12 },
  textarea: { backgroundColor: '#0A0906', borderWidth: 1, borderColor: '#2A2420', borderRadius: 12, padding: 14, color: '#F0E8D8', fontSize: 15, minHeight: 100, marginBottom: 16, lineHeight: 22 },
  saveBtn: { backgroundColor: '#C4A882', borderRadius: 100, padding: 14, alignItems: 'center', marginTop: 16 },
  saveBtnDisabled: { opacity: 0.3 },
  saveBtnText: { color: '#0A0906', fontSize: 13, fontWeight: 'bold', letterSpacing: 2 },
});
