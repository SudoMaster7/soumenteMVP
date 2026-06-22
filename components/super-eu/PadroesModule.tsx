import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { getCurrentUser } from '@/services/authService';
import { getPatternMap, type PatternInsight, type PatternMap } from '@/services/patternService';
import { useTheme, type AppTheme } from '@/lib/theme';

const KIND_ICON: Record<PatternInsight['kind'], keyof typeof Ionicons.glyphMap> = {
  emotion: 'heart-outline',
  consistency: 'pulse-outline',
  seed: 'leaf-outline',
  time: 'time-outline',
  risk: 'alert-circle-outline',
};

const CONFIDENCE_LABEL: Record<PatternInsight['confidence'], string> = {
  cultivando: 'Cultivando dados',
  inicial: 'Sinal inicial',
  forte: 'Padrão forte',
};

export default function PadroesModule() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const [map, setMap] = useState<PatternMap | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) return;
      const result = await getPatternMap(user.id);
      setMap(result);
    } catch (error) {
      console.warn('Failed to load pattern map', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!map) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Mapa indisponível</Text>
        <TouchableOpacity style={styles.retryButton} onPress={load}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="git-network-outline" size={25} color={colors.primary} />
        </View>
        <Text style={styles.kicker}>MAPA DE PADRÕES</Text>
        <Text style={styles.heroTitle}>{map.headline}</Text>
        <Text style={styles.heroText}>{map.summary}</Text>
      </View>

      <View style={styles.presenceCard}>
        <View style={styles.presenceHeader}>
          <View>
            <Text style={styles.presenceLabel}>Presença nos últimos 30 dias</Text>
            <Text style={styles.presenceValue}>{map.activeDays}/30 dias</Text>
          </View>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{map.presenceScore}%</Text>
          </View>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${map.presenceScore}%` }]} />
        </View>
        <Text style={styles.presenceHint}>
          {map.ready
            ? 'Leitura completa liberada. Continue registrando para refinar as descobertas.'
            : `Meta inicial: ${map.requiredDays} dias ativos para o sistema revelar padrões mais confiáveis.`}
        </Text>
      </View>

      <View style={styles.insightsList}>
        {map.insights.map((insight) => (
          <View key={insight.id} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <View style={styles.insightIcon}>
                <Ionicons name={KIND_ICON[insight.kind]} size={19} color={insight.kind === 'risk' ? colors.danger : colors.primary} />
              </View>
              <View style={styles.insightCopy}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.confidence}>{CONFIDENCE_LABEL[insight.confidence]}</Text>
              </View>
            </View>
            <Text style={styles.insightText}>{insight.text}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={load}>
        <Ionicons name="refresh" size={16} color={colors.primary} />
        <Text style={styles.refreshText}>Recalcular padrões</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function makeStyles(theme: AppTheme) {
  const colors = theme.colors;

  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colors.background },
    content: { padding: 18, paddingBottom: 34 },
    center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
    hero: { backgroundColor: colors.surface, borderRadius: 8, padding: 18, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
    heroIcon: { width: 48, height: 48, borderRadius: 10, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
    kicker: { fontSize: 9, color: colors.primary, letterSpacing: 3, fontWeight: '900', marginBottom: 8 },
    heroTitle: { fontSize: 24, color: colors.text, lineHeight: 30, fontWeight: '900', marginBottom: 8 },
    heroText: { fontSize: 14, color: colors.muted, lineHeight: 21 },
    presenceCard: { backgroundColor: colors.surface, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
    presenceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
    presenceLabel: { fontSize: 11, color: colors.muted, fontWeight: '900', textTransform: 'uppercase', marginBottom: 4 },
    presenceValue: { fontSize: 22, color: colors.text, fontWeight: '900' },
    scoreBadge: { minWidth: 54, minHeight: 42, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
    scoreText: { fontSize: 16, color: colors.primary, fontWeight: '900' },
    track: { height: 7, backgroundColor: colors.backgroundAlt, borderRadius: 100, overflow: 'hidden', marginBottom: 10 },
    fill: { height: 7, backgroundColor: colors.primary, borderRadius: 100 },
    presenceHint: { fontSize: 12, color: colors.muted, lineHeight: 18 },
    insightsList: { gap: 10 },
    insightCard: { backgroundColor: colors.surface, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: colors.border },
    insightHeader: { flexDirection: 'row', gap: 12, marginBottom: 10, alignItems: 'center' },
    insightIcon: { width: 38, height: 38, borderRadius: 9, backgroundColor: colors.backgroundAlt, alignItems: 'center', justifyContent: 'center' },
    insightCopy: { flex: 1 },
    insightTitle: { fontSize: 16, color: colors.text, fontWeight: '900', marginBottom: 3 },
    confidence: { fontSize: 10, color: colors.primary, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.3 },
    insightText: { fontSize: 14, color: colors.muted, lineHeight: 21 },
    refreshButton: { alignSelf: 'center', marginTop: 14, minHeight: 42, paddingHorizontal: 14, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
    refreshText: { fontSize: 12, color: colors.primary, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    emptyTitle: { fontSize: 17, color: colors.text, fontWeight: '900', marginBottom: 12 },
    retryButton: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
    retryText: { color: colors.primaryText, fontWeight: '900' },
  });
}
