import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useSeed } from '@/hooks/useSeed';
import { useDiary } from '@/hooks/useDiary';
import { EMOTIONS } from '@/constants/emotions';
import { useSuperEuStore } from '@/stores/superEuStore';
import { fetchDailyOracle } from '@/services/oracleService';
import { getGrowthProfile, getWeeklyIntention, type GrowthProfile } from '@/services/growthService';
import { getCurrentUser } from '@/services/authService';
import { fmtBRL } from '@/constants/supereu';
import { useTheme, type AppTheme } from '@/lib/theme';

function getTodayIndex() {
  const dayOfWeek = new Date().getDay();
  return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
}

function getContextMessage(streak: number, todayEntry: any, seed: any): string {
  if (!todayEntry) return 'O dia ainda está em branco. O que ele está pedindo de você?';
  if (streak >= 7) return `${streak} dias seguidos. A repetição virou rito.`;
  if (todayEntry?.emotion_primary === 'anxious') return 'A ansiedade está apontando para algo que deseja cuidado, não pressa.';
  if (seed?.status === 'fruiting') return 'Suas raízes estão fortes. Um fruto está próximo.';
  return 'Continue regando suas raízes. Cada dia conta.';
}

export default function Home() {
  const { theme, themeName, toggleTheme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const { profile } = useAuth();
  const { seed, loading: seedLoading, refetch: refetchSeed } = useSeed();
  const { todayEntry, streak, loading: diaryLoading, refetch: refetchDiary } = useDiary();
  const [growth, setGrowth] = useState<GrowthProfile | null>(null);
  const [weeklyIntention, setWeeklyIntention] = useState('');
  const {
    oracle, oracleDateKey, setOracle,
    habits, goals, purchases, finance, diary,
  } = useSuperEuStore();

  const todayKey = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (oracleDateKey !== todayKey) {
      fetchDailyOracle({ goals, habits, purchases, finance, diary }).then((result) => setOracle(result, todayKey));
    }
  }, [diary, finance, goals, habits, oracleDateKey, purchases, setOracle, todayKey]);

  useFocusEffect(useCallback(() => {
    refetchSeed();
    refetchDiary();
    getCurrentUser().then(user => {
      if (!user) return;
      Promise.all([
        getGrowthProfile(user.id),
        getWeeklyIntention(user.id),
      ]).then(([profile, intention]) => {
        setGrowth(profile);
        setWeeklyIntention(intention);
      }).catch((error) => {
        console.warn('Failed to load growth profile', error);
      });
    });
  }, [refetchDiary, refetchSeed]));

  const loading = seedLoading || diaryLoading;
  const emotion = EMOTIONS.find(e => e.id === todayEntry?.emotion_primary);
  const contextMessage = getContextMessage(streak, todayEntry, seed);
  const todayIndex = getTodayIndex();
  const completedHabitsToday = habits.filter(habit => habit.days[todayIndex]).length;
  const ritualsPct = habits.length ? Math.round((completedHabitsToday / habits.length) * 100) : 0;
  const avgGoalProgress = goals.length
    ? Math.round(goals.reduce((acc, goal) => acc + goal.progress, 0) / goals.length)
    : 0;
  const planDone = purchases.filter(purchase => purchase.done).length;
  const planPct = purchases.length ? Math.round((planDone / purchases.length) * 100) : 0;
  const balance = finance.reduce((acc, entry) => acc + entry.amount, 0);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>SOUMENTE</Text>
          <Text style={styles.greeting}>Olá, {profile?.name?.split(' ')[0] || 'você'}.</Text>
          <Text style={styles.subtitle}>O espelho do que você está cultivando agora.</Text>
        </View>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeButton} accessibilityLabel="Alternar tema">
          <Ionicons name={themeName === 'dark' ? 'sunny-outline' : 'moon-outline'} size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {oracle && (
        <TouchableOpacity
          style={styles.oracleCard}
          onPress={() => router.push('/(tabs)/super-eu')}
          activeOpacity={0.86}
        >
          <View style={styles.cardHeader}>
            <View style={styles.goldDot} />
            <Text style={styles.oracleTag}>SUPER EU · ORÁCULO</Text>
          </View>
          <Text style={styles.oracleQuote}>"{oracle.quote}"</Text>
          <Text style={styles.oraclePrinciple}>{oracle.principle}</Text>
          {oracle.focus ? <Text style={styles.oracleFocus}>{oracle.focus}</Text> : null}
        </TouchableOpacity>
      )}

      <View style={styles.mirrorGrid}>
        <MetricCard title="Rituais hoje" value={`${completedHabitsToday}/${habits.length}`} pct={ritualsPct} theme={theme} />
        <MetricCard title="Grande obra" value={`${avgGoalProgress}%`} pct={avgGoalProgress} theme={theme} />
      </View>

      <View style={styles.mirrorGrid}>
        <MetricCard title="Plano material" value={`${planPct}%`} pct={planPct} theme={theme} variant="accent" />
        <TouchableOpacity style={styles.mirrorCard} onPress={() => router.push('/(tabs)/super-eu')}>
          <Text style={[styles.mirrorValue, balance < 0 && { color: colors.danger }]}>{fmtBRL(balance)}</Text>
          <Text style={styles.mirrorLabel}>Fluxo atual</Text>
          <Text style={styles.mirrorHint}>{balance >= 0 ? 'Fluxo em expansão' : 'Ajuste de rota'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.aiCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="sparkles-outline" size={17} color={colors.primary} />
          <Text style={styles.aiTag}>REFLEXÃO DO DIA</Text>
        </View>
        <Text style={styles.aiMessage}>"{contextMessage}"</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/diary')}>
          <Text style={styles.aiCta}>Registrar agora</Text>
        </TouchableOpacity>
      </View>

      {growth ? (
        <TouchableOpacity style={styles.growthCard} onPress={() => router.push('/report/weekly')} activeOpacity={0.86}>
          <View style={styles.growthHeader}>
            <View style={styles.growthIcon}>
              <Ionicons name="flower-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.growthCopy}>
                <Text style={styles.growthKicker}>Nível {growth.level.level}</Text>
              <Text style={styles.growthTitle}>{growth.level.name}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
          </View>
          <Text style={styles.growthDescription}>{growth.level.description}</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${growth.level.progress}%`, backgroundColor: colors.accent }]} />
          </View>
          <Text style={styles.scoreLine}>Pontuação de consciência: {growth.score} pontos</Text>
          {weeklyIntention ? (
            <Text style={styles.intentionLine}>Intenção da semana: {weeklyIntention}</Text>
          ) : growth.nextAchievement ? (
            <Text style={styles.intentionLine}>
              Próxima conquista: {growth.nextAchievement.title}
              {growth.nextAchievement.distance > 0 ? ` - faltam ${growth.nextAchievement.distance}` : ''}
            </Text>
          ) : (
            <Text style={styles.intentionLine}>Seu jardim ja tem memoria. Continue cultivando.</Text>
          )}
        </TouchableOpacity>
      ) : null}

      {seed ? (
        <>
          <Text style={styles.sectionLabel}>SEMENTE ATIVA</Text>
          <TouchableOpacity style={styles.seedCard} onPress={() => router.push('/(tabs)/garden')}>
            <View style={styles.seedIconWrap}>
              <Ionicons name="leaf-outline" size={24} color={colors.success} />
            </View>
            <View style={styles.seedInfo}>
              <Text style={styles.seedName}>{seed.name}</Text>
              <Text style={styles.seedStatus}>{seed.status?.toUpperCase()}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtle} />
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={styles.plantBtn} onPress={() => router.push('/seed/create')}>
          <Ionicons name="leaf-outline" size={18} color={colors.primary} />
          <Text style={styles.plantBtnText}>Plantar primeira semente</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionLabel}>HOJE</Text>
      {todayEntry ? (
        <TouchableOpacity style={styles.emotionCard} onPress={() => router.push('/(tabs)/diary')}>
          <Text style={styles.emotionEmoji}>{emotion?.emoji || '•'}</Text>
          <View>
            <Text style={styles.emotionLabel}>Emoção registrada</Text>
            <Text style={[styles.emotionValue, { color: emotion?.color || colors.primary }]}>{emotion?.label || 'Neutro'}</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.checkInBtn} onPress={() => router.push('/(tabs)/diary')}>
          <Text style={styles.checkInText}>+ Registrar emoção do dia</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.reportBtn} onPress={() => router.push('/report/weekly')}>
        <Text style={styles.reportText}>Ver relatório semanal</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function MetricCard({ title, value, pct, theme, variant }: { title: string; value: string; pct: number; theme: AppTheme; variant?: 'accent' }) {
  const styles = makeStyles(theme);
  const colors = theme.colors;

  return (
    <TouchableOpacity style={styles.mirrorCard} onPress={() => router.push('/(tabs)/super-eu')}>
      <Text style={styles.mirrorValue}>{value}</Text>
      <Text style={styles.mirrorLabel}>{title}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: variant === 'accent' ? colors.accent : colors.primary }]} />
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(theme: AppTheme) {
  const colors = theme.colors;

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 24, paddingTop: 58, paddingBottom: 40 },
    center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
    header: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginBottom: 22 },
    themeButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    eyebrow: { fontSize: 9, letterSpacing: 4, color: colors.primary, fontWeight: 'bold', marginBottom: 8 },
    greeting: { fontSize: 38, fontWeight: '800', color: colors.text, marginBottom: 8 },
    subtitle: { fontSize: 14, color: colors.muted, marginBottom: 2, lineHeight: 20 },
    oracleCard: { backgroundColor: colors.surface, borderRadius: 8, padding: 22, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    goldDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
    oracleTag: { fontSize: 8, letterSpacing: 3, color: colors.primary, fontWeight: 'bold' },
    oracleQuote: { fontSize: 17, color: colors.text, fontStyle: 'italic', lineHeight: 26, marginBottom: 10 },
    oraclePrinciple: { fontSize: 10, color: colors.muted, letterSpacing: 1.4 },
    oracleFocus: { fontSize: 12, color: colors.primary, fontWeight: '800', marginTop: 10 },
    mirrorGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    mirrorCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 8, padding: 14, borderWidth: 1, borderColor: colors.border, minHeight: 110 },
    mirrorValue: { fontSize: 20, color: colors.text, fontWeight: '800', marginBottom: 8 },
    mirrorLabel: { fontSize: 8, letterSpacing: 2, color: colors.primary, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase' },
    mirrorHint: { fontSize: 11, color: colors.muted, lineHeight: 16 },
    track: { height: 3, backgroundColor: colors.backgroundAlt, borderRadius: 100, marginTop: 'auto' },
    fill: { height: 3, borderRadius: 100 },
    aiCard: { backgroundColor: colors.surface, borderRadius: 8, padding: 20, marginTop: 10, marginBottom: 28, borderWidth: 1, borderColor: colors.border },
    aiTag: { fontSize: 8, letterSpacing: 3, color: colors.primary, fontWeight: 'bold' },
    aiMessage: { fontSize: 16, color: colors.text, fontStyle: 'italic', lineHeight: 24, marginBottom: 12 },
    aiCta: { fontSize: 11, color: colors.primary, letterSpacing: 2, fontWeight: '700' },
    growthCard: { backgroundColor: colors.surface, borderRadius: 8, padding: 16, marginBottom: 26, borderWidth: 1, borderColor: colors.border },
    growthHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    growthIcon: { width: 42, height: 42, borderRadius: 10, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    growthCopy: { flex: 1 },
    growthKicker: { fontSize: 9, color: colors.primary, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 },
    growthTitle: { fontSize: 18, color: colors.text, fontWeight: '900' },
    growthDescription: { fontSize: 13, color: colors.muted, lineHeight: 20, marginBottom: 12 },
    scoreLine: { fontSize: 11, color: colors.subtle, fontWeight: '800', marginTop: 9, textTransform: 'uppercase', letterSpacing: 0.8 },
    intentionLine: { fontSize: 12, color: colors.accent, lineHeight: 18, fontWeight: '800', marginTop: 10 },
    sectionLabel: { fontSize: 9, letterSpacing: 3, color: colors.subtle, fontWeight: 'bold', marginBottom: 10 },
    seedCard: { backgroundColor: colors.surface, borderRadius: 8, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
    seedIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
    seedInfo: { flex: 1 },
    seedName: { fontSize: 16, fontWeight: 'bold', color: colors.text },
    seedStatus: { fontSize: 9, color: colors.primary, letterSpacing: 2, marginTop: 2 },
    plantBtn: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 24, flexDirection: 'row', gap: 8 },
    plantBtnText: { color: colors.primary, fontSize: 13, letterSpacing: 1.5, fontWeight: '700' },
    emotionCard: { backgroundColor: colors.surface, borderRadius: 8, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 24 },
    emotionEmoji: { fontSize: 34 },
    emotionLabel: { fontSize: 10, color: colors.muted, letterSpacing: 1 },
    emotionValue: { fontSize: 16, fontWeight: 'bold', marginTop: 2 },
    checkInBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 16, alignItems: 'center', marginBottom: 24, backgroundColor: colors.surface },
    checkInText: { color: colors.muted, fontSize: 13, letterSpacing: 1 },
    reportBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8, backgroundColor: colors.surface },
    reportText: { color: colors.muted, fontSize: 13, letterSpacing: 1 },
  });
}
