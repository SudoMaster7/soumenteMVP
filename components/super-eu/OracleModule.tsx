import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { todayHermetic } from '@/constants/supereu';
import { fetchDailyOracle } from '@/services/oracleService';
import { useSuperEuStore } from '@/stores/superEuStore';
import { useTheme, type AppTheme } from '@/lib/theme';

export default function OracleModule() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const { oracle, oracleDateKey, setOracle, goals, habits, purchases, finance, diary } = useSuperEuStore();
  const [loading, setLoading] = useState(false);
  const [focusCounter, setFocusCounter] = useState(0);
  const todayKey = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (oracleDateKey !== todayKey) loadOracle();
  }, []);

  async function loadOracle(forceNew = false) {
    setLoading(true);
    const nextCounter = forceNew ? focusCounter + 1 : focusCounter;
    const seed = forceNew ? `${todayKey}-${nextCounter}-${Date.now()}` : todayKey;
    const result = await fetchDailyOracle({ goals, habits, purchases, finance, diary }, seed);
    if (forceNew) setFocusCounter(nextCounter);
    setOracle(result, todayKey);
    setLoading(false);
  }

  const completedHabitsToday = habits.reduce((acc, h) => {
    const dayOfWeek = new Date().getDay();
    const idx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    return acc + (h.days[idx] ? 1 : 0);
  }, 0);
  const avgGoalProgress = goals.length ? Math.round(goals.reduce((a, g) => a + g.progress, 0) / goals.length) : 0;
  const balance = finance.reduce((a, e) => a + e.amount, 0);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.dateLabel}>{todayHermetic()}</Text>

      <View style={styles.oracleCard}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}><Ionicons name="compass-outline" size={22} color={colors.primary} /></View>
          <View>
            <Text style={styles.oracleTag}>ORACULO DIARIO</Text>
            <Text style={styles.oracleHint}>Um foco simples para hoje</Text>
          </View>
        </View>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
        ) : (
          <>
            <Text style={styles.oracleQuote}>"{oracle?.quote ?? '...'}"</Text>
            <Text style={styles.oraclePrinciple}>{oracle?.principle ?? ''}</Text>
            {oracle?.focus ? (
              <View style={styles.focusBox}>
                <Text style={styles.focusLabel}>FOCO DO DIA</Text>
                <Text style={styles.focusText}>{oracle.focus}</Text>
              </View>
            ) : null}
            {oracle?.action ? (
              <View style={styles.actionBox}>
                <Ionicons name="trail-sign-outline" size={16} color={colors.accent} />
                <Text style={styles.actionText}>{oracle.action}</Text>
              </View>
            ) : null}
          </>
        )}
        <TouchableOpacity onPress={() => loadOracle(true)} style={styles.newOracleBtn} disabled={loading}>
          <Text style={styles.newOracleTxt}>Gerar novo foco</Text>
          <Ionicons name="refresh" size={15} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Rituais hoje" value={`${completedHabitsToday}/${habits.length}`} theme={theme} />
        <StatCard label="Objetivos" value={`${avgGoalProgress}%`} theme={theme} />
        <StatCard label="Saldo" value={`${balance >= 0 ? '+' : '-'}R$${Math.abs(balance).toLocaleString('pt-BR')}`} theme={theme} tone={balance >= 0 ? 'success' : 'danger'} />
      </View>

      <Text style={styles.sectionLabel}>PRINCIPIOS ATIVOS</Text>
      {PRINCIPLES.map((p) => (
        <View key={p.law} style={styles.principleCard}>
          <Ionicons name={p.icon} size={20} color={colors.accent} />
          <View style={styles.principleBody}>
            <Text style={styles.principleLaw}>{p.law}</Text>
            <Text style={styles.principleQuote}>"{p.quote}"</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function StatCard({ label, value, theme, tone }: { label: string; value: string; theme: AppTheme; tone?: 'success' | 'danger' }) {
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const color = tone === 'success' ? colors.success : tone === 'danger' ? colors.danger : colors.text;
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const PRINCIPLES: { icon: keyof typeof Ionicons.glyphMap; law: string; quote: string }[] = [
  { icon: 'bulb-outline', law: 'Mentalismo', quote: 'O que voce pensa alimenta o que voce faz' },
  { icon: 'git-compare-outline', law: 'Correspondencia', quote: 'O pequeno gesto revela o grande caminho' },
  { icon: 'pulse-outline', law: 'Vibracao', quote: 'A consistencia muda seu estado' },
  { icon: 'repeat-outline', law: 'Causalidade', quote: 'Toda acao pequena deixa um rastro' },
];

function makeStyles(theme: AppTheme) {
  const colors = theme.colors;
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 40 },
    dateLabel: { fontSize: 10, letterSpacing: 2, color: colors.muted, textAlign: 'center', marginBottom: 20, textTransform: 'uppercase' },
    oracleCard: { backgroundColor: colors.surface, borderRadius: 10, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
    iconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.border },
    oracleTag: { fontSize: 9, letterSpacing: 3, color: colors.primary, fontWeight: '800' },
    oracleHint: { fontSize: 12, color: colors.muted, marginTop: 3 },
    oracleQuote: { fontSize: 18, color: colors.text, fontStyle: 'italic', lineHeight: 28, marginBottom: 12 },
    oraclePrinciple: { fontSize: 11, color: colors.muted, letterSpacing: 1, marginBottom: 20 },
    focusBox: { backgroundColor: colors.primarySoft, borderRadius: 8, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
    focusLabel: { fontSize: 9, color: colors.primary, fontWeight: '900', letterSpacing: 1.8, marginBottom: 4 },
    focusText: { fontSize: 15, color: colors.text, fontWeight: '900' },
    actionBox: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', backgroundColor: colors.backgroundAlt, borderRadius: 8, padding: 12, marginBottom: 16 },
    actionText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 19 },
    newOracleBtn: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 6 },
    newOracleTxt: { fontSize: 12, color: colors.primary, letterSpacing: 0.8, fontWeight: '800' },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
    statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center', minHeight: 82 },
    statValue: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
    statLabel: { fontSize: 9, letterSpacing: 1.2, color: colors.muted, textAlign: 'center', lineHeight: 13, textTransform: 'uppercase' },
    sectionLabel: { fontSize: 9, letterSpacing: 3, color: colors.muted, fontWeight: '800', marginBottom: 12 },
    principleCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: colors.surface, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
    principleBody: { flex: 1 },
    principleLaw: { fontSize: 11, letterSpacing: 2, color: colors.accent, fontWeight: '800', marginBottom: 4, textTransform: 'uppercase' },
    principleQuote: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  });
}
