import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { getCurrentUser } from '@/services/authService';
import { supabase } from '@/lib/supabase';

const DEFAULT_QUESTIONS = [
  'Por que isso é importante para você agora?',
  'Qual o maior obstáculo que você vai precisar superar?',
  'O que você já tem que pode te ajudar a chegar lá?',
  'Como você vai saber que chegou onde queria?',
];

export default function Questions() {
  const { seedId, seedName } = useLocalSearchParams<{
    seedId: string; seedName: string;
  }>();
  const [answers, setAnswers] = useState<string[]>(['', '', '', '']);
  const [planting, setPlanting] = useState(false);

  function updateAnswer(index: number, value: string) {
    setAnswers(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  async function handlePlant() {
    const filled = answers.filter(a => a.trim().length > 0);
    if (filled.length < 2) {
      Alert.alert('Responda pelo menos 2 perguntas para plantar sua semente.');
      return;
    }
    if (!seedId) return;

    setPlanting(true);
    try {
      const user = await getCurrentUser();
      if (!user) { setPlanting(false); return; }

      await supabase
        .from('seeds')
        .update({
          status: 'planted',
          planted_at: new Date().toISOString(),
          ai_questions: answers,
        })
        .eq('id', seedId);

      const roots = [
        { name: 'Reflexão diária', description: 'Reserve 5 minutos para pensar no seu progresso', type: 'daily', frequency: 1 },
        { name: 'Ação concreta', description: 'Faça pelo menos uma coisa que te aproxime do objetivo', type: 'daily', frequency: 1 },
        { name: 'Revisão semanal', description: 'Avalie o que funcionou e o que precisa mudar', type: 'weekly', frequency: 1 },
      ];
      await supabase.from('roots').insert(
        roots.map(r => ({ ...r, seed_id: seedId, user_id: user.id }))
      );

      router.replace({ pathname: '/seed/planted', params: { seedName } });
    } catch {
      Alert.alert('Erro', 'Não foi possível plantar. Tente novamente.');
    } finally {
      setPlanting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>PERGUNTAS DAS RAÍZES</Text>
        <Text style={styles.title}>Vá fundo em{'\n'}"{seedName}"</Text>
        <Text style={styles.subtitle}>Responda o que vier. Honestidade vale mais que perfeição.</Text>

        {DEFAULT_QUESTIONS.map((question, index) => (
          <View key={index} style={styles.questionBlock}>
            <Text style={styles.questionNum}>{index + 1}</Text>
            <Text style={styles.question}>{question}</Text>
            <TextInput
              style={styles.answer}
              placeholder="Sua resposta..."
              placeholderTextColor="#6A6258"
              value={answers[index]}
              onChangeText={v => updateAnswer(index, v)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.plantBtn, planting && styles.plantBtnDisabled]}
          onPress={handlePlant}
          disabled={planting}
        >
          {planting ? (
            <ActivityIndicator color="#0A0906" />
          ) : (
            <Text style={styles.plantBtnText}>🌱 Plantar semente</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0906' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 48 },
  back: { marginBottom: 32 },
  backText: { color: '#6A6258', fontSize: 14 },
  eyebrow: { fontSize: 9, letterSpacing: 4, color: '#C4A882', fontWeight: 'bold', marginBottom: 8 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#F0E8D8', lineHeight: 42, marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6A6258', fontStyle: 'italic', marginBottom: 32, lineHeight: 20 },
  questionBlock: { marginBottom: 24 },
  questionNum: { fontSize: 9, letterSpacing: 3, color: '#C4A882', fontWeight: 'bold', marginBottom: 6 },
  question: { fontSize: 16, color: '#F0E8D8', marginBottom: 12, lineHeight: 22 },
  answer: {
    backgroundColor: '#1C1915',
    borderWidth: 1,
    borderColor: '#2A2420',
    borderRadius: 12,
    padding: 14,
    color: '#F0E8D8',
    fontSize: 15,
    minHeight: 90,
    lineHeight: 22,
  },
  plantBtn: { backgroundColor: '#C4A882', borderRadius: 100, padding: 16, alignItems: 'center', marginTop: 8 },
  plantBtnDisabled: { opacity: 0.5 },
  plantBtnText: { color: '#0A0906', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
});
