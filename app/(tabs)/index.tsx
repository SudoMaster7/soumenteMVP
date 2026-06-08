import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useSeed } from '@/hooks/useSeed';
import { useDiary } from '@/hooks/useDiary';
import { EMOTIONS } from '@/constants/emotions';

function getContextMessage(streak: number, todayEntry: any, seed: any): string {
  if (!todayEntry) return 'Ainda não registrou hoje. Como você está chegando neste dia?';
  if (streak >= 7) return `${streak} dias seguidos. Você está construindo algo real.`;
  if (todayEntry?.emotion_primary === 'anxious') return 'Percebi que você está ansioso. O que está pesando mais?';
  if (seed?.status === 'fruiting') return 'Suas raízes estão fortes. Um fruto está próximo.';
  return 'Continue regando suas raízes. Cada dia conta.';
}

export default function Home() {
  const { profile } = useAuth();
  const { seed, loading: seedLoading, refetch: refetchSeed } = useSeed();
  const { todayEntry, streak, loading: diaryLoading, refetch: refetchDiary } = useDiary();

  useFocusEffect(useCallback(() => {
    refetchSeed();
    refetchDiary();
  }, []));

  const loading = seedLoading || diaryLoading;
  const emotion = EMOTIONS.find(e => e.id === todayEntry?.emotion_primary);
  const contextMessage = getContextMessage(streak, todayEntry, seed);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#C4A882" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <Text style={styles.eyebrow}>SOUMENTE</Text>
      <Text style={styles.greeting}>
        Olá, {profile?.name?.split(' ')[0] || 'você'}.
      </Text>

      {streak > 0 && (
        <View style={styles.streakPill}>
          <Text style={styles.streakText}>🔥 {streak} dias seguidos</Text>
        </View>
      )}

      <View style={styles.aiCard}>
        <View style={styles.aiDot} />
        <Text style={styles.aiTag}>SOUMENTE · IA</Text>
        <Text style={styles.aiMessage}>"{contextMessage}"</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/diary')}>
          <Text style={styles.aiCta}>Registrar agora →</Text>
        </TouchableOpacity>
      </View>

      {seed ? (
        <>
          <Text style={styles.sectionLabel}>SEMENTE ATIVA</Text>
          <TouchableOpacity
            style={styles.seedCard}
            onPress={() => router.push('/(tabs)/garden')}
          >
            <Text style={styles.seedEmoji}>
              {seed.status === 'growing' ? '🌿' : seed.status === 'fruiting' ? '🌳' : '🌱'}
            </Text>
            <View style={styles.seedInfo}>
              <Text style={styles.seedName}>{seed.name}</Text>
              <Text style={styles.seedStatus}>{seed.status?.toUpperCase()}</Text>
            </View>
            <Text style={styles.seedArrow}>›</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity
          style={styles.plantBtn}
          onPress={() => router.push('/seed/create')}
        >
          <Text style={styles.plantBtnText}>🌱 Plantar primeira semente</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionLabel}>HOJE</Text>
      {todayEntry ? (
        <TouchableOpacity
          style={styles.emotionCard}
          onPress={() => router.push('/(tabs)/diary')}
        >
          <Text style={styles.emotionEmoji}>{emotion?.emoji || '😶'}</Text>
          <View>
            <Text style={styles.emotionLabel}>Emoção registrada</Text>
            <Text style={[styles.emotionValue, { color: emotion?.color || '#C4A882' }]}>
              {emotion?.label || 'Neutro'}
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.checkInBtn}
          onPress={() => router.push('/(tabs)/diary')}
        >
          <Text style={styles.checkInText}>+ Registrar emoção do dia</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.reportBtn}
        onPress={() => router.push('/report/weekly')}
      >
        <Text style={styles.reportText}>📊 Ver relatório semanal</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0906' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: '#0A0906', alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 9, letterSpacing: 4, color: '#C4A882', fontWeight: 'bold', marginBottom: 8 },
  greeting: { fontSize: 40, fontWeight: 'bold', color: '#F0E8D8', marginBottom: 16 },
  streakPill: { backgroundColor: 'rgba(196,168,130,0.1)', borderWidth: 1, borderColor: 'rgba(196,168,130,0.25)', borderRadius: 100, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-start', marginBottom: 24 },
  streakText: { color: '#C4A882', fontSize: 13 },
  aiCard: { backgroundColor: '#1C1915', borderRadius: 20, padding: 20, marginBottom: 28, borderWidth: 1, borderColor: 'rgba(196,168,130,0.2)' },
  aiDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C4A882', marginBottom: 8 },
  aiTag: { fontSize: 8, letterSpacing: 3, color: '#C4A882', fontWeight: 'bold', marginBottom: 8 },
  aiMessage: { fontSize: 16, color: '#F0E8D8', fontStyle: 'italic', lineHeight: 24, marginBottom: 12 },
  aiCta: { fontSize: 11, color: '#C4A882', letterSpacing: 2 },
  sectionLabel: { fontSize: 9, letterSpacing: 3, color: '#6A6258', fontWeight: 'bold', marginBottom: 10 },
  seedCard: { backgroundColor: '#1C1915', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, borderWidth: 1, borderColor: '#2A2420' },
  seedEmoji: { fontSize: 32 },
  seedInfo: { flex: 1 },
  seedName: { fontSize: 16, fontWeight: 'bold', color: '#F0E8D8' },
  seedStatus: { fontSize: 9, color: '#C4A882', letterSpacing: 2, marginTop: 2 },
  seedArrow: { fontSize: 24, color: '#6A6258' },
  plantBtn: { backgroundColor: 'rgba(196,168,130,0.08)', borderWidth: 1, borderColor: 'rgba(196,168,130,0.2)', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 24 },
  plantBtnText: { color: '#C4A882', fontSize: 14, letterSpacing: 2 },
  emotionCard: { backgroundColor: '#1C1915', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#2A2420', marginBottom: 24 },
  emotionEmoji: { fontSize: 36 },
  emotionLabel: { fontSize: 10, color: '#6A6258', letterSpacing: 1 },
  emotionValue: { fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  checkInBtn: { borderWidth: 1, borderColor: '#2A2420', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 24 },
  checkInText: { color: '#6A6258', fontSize: 13, letterSpacing: 1 },
  reportBtn: { borderWidth: 1, borderColor: '#2A2420', borderRadius: 16, padding: 14, alignItems: 'center', marginTop: 8 },
  reportText: { color: '#6A6258', fontSize: 13, letterSpacing: 1 },
});
