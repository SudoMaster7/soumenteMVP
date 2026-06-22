import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme, type AppTheme } from '@/lib/theme';

const DEFAULT_QUESTIONS = [
  'Por que isso é importante para você agora?',
  'Qual obstáculo você precisa encarar primeiro?',
  'O que você já tem que pode te ajudar?',
  'Como você vai saber que está avançando?',
];

export default function Questions() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const { seedId, seedName, seedType, seedWhy, seedForWhom } = useLocalSearchParams<{
    seedId: string;
    seedName: string;
    seedType?: string;
    seedWhy?: string;
    seedForWhom?: string;
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

  function handlePlant() {
    const filled = answers.filter(a => a.trim().length > 0);
    if (filled.length < 2) {
      Alert.alert('Responda pelo menos 2 perguntas para plantar sua semente.');
      return;
    }
    if (!seedId) return;

    setPlanting(true);
    router.push({
      pathname: '/seed/roots-ai',
      params: {
        seedId,
        seedName,
        seedType,
        seedWhy,
        seedForWhom,
        answersJson: JSON.stringify(answers),
      },
    });
    setPlanting(false);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={18} color={colors.muted} />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>RAIZES DA SEMENTE</Text>
        <Text style={styles.title}>De clareza para "{seedName}"</Text>
        <Text style={styles.subtitle}>Não precisa escrever bonito. Precisa ser verdadeiro o bastante para virar ação.</Text>

        {DEFAULT_QUESTIONS.map((question, index) => (
          <View key={question} style={styles.questionBlock}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionNum}>{index + 1}</Text>
              <Text style={styles.question}>{question}</Text>
            </View>
            <TextInput
              style={styles.answer}
              placeholder="Sua resposta..."
              placeholderTextColor={colors.subtle}
              value={answers[index]}
              onChangeText={v => updateAnswer(index, v)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        ))}

        <TouchableOpacity style={[styles.plantBtn, planting && styles.plantBtnDisabled]} onPress={handlePlant} disabled={planting}>
          {planting ? <ActivityIndicator color={colors.primaryText} /> : (
            <>
              <Text style={styles.plantBtnText}>Gerar raízes</Text>
              <Ionicons name="sparkles-outline" size={18} color={colors.primaryText} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(theme: AppTheme) {
  const colors = theme.colors;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 24, paddingTop: 58, paddingBottom: 48 },
    back: { marginBottom: 28, flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
    backText: { color: colors.muted, fontSize: 14, fontWeight: '700' },
    eyebrow: { fontSize: 9, letterSpacing: 4, color: colors.primary, fontWeight: '800', marginBottom: 8 },
    title: { fontSize: 33, fontWeight: '800', color: colors.text, lineHeight: 38, marginBottom: 10 },
    subtitle: { fontSize: 15, color: colors.muted, marginBottom: 28, lineHeight: 22 },
    questionBlock: { marginBottom: 18, backgroundColor: colors.surface, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: colors.border },
    questionHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 12 },
    questionNum: { width: 25, height: 25, borderRadius: 13, backgroundColor: colors.primarySoft, color: colors.primary, textAlign: 'center', lineHeight: 25, fontWeight: '800', fontSize: 12 },
    question: { flex: 1, fontSize: 16, color: colors.text, fontWeight: '700', lineHeight: 22 },
    answer: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, color: colors.text, fontSize: 15, minHeight: 92, lineHeight: 22 },
    plantBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8, flexDirection: 'row', gap: 8 },
    plantBtnDisabled: { opacity: 0.5 },
    plantBtnText: { color: colors.primaryText, fontSize: 14, fontWeight: '800', letterSpacing: 1.3 },
  });
}
