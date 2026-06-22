import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getCurrentUser } from '@/services/authService';
import { generateWeeklyReport, type WeeklyReportData } from '@/services/reportService';
import { saveWeeklyIntention } from '@/services/growthService';
import { useTheme, type AppTheme } from '@/lib/theme';

export default function WeeklyReport() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const [report, setReport] = useState<WeeklyReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [intention, setIntention] = useState('');
  const [savingIntention, setSavingIntention] = useState(false);

  async function handleGenerate() {
    const user = await getCurrentUser();
    if (!user) return;
    setLoading(true);
    try {
      const result = await generateWeeklyReport(user.id);
      setReport(result);
      setIntention(result.intention);
    } catch (error) {
      console.error('Failed to generate weekly report', error);
      Alert.alert('Erro', 'Não foi possível gerar o relatório.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveIntention() {
    const user = await getCurrentUser();
    if (!user) return;
    setSavingIntention(true);
    try {
      await saveWeeklyIntention(user.id, intention);
      setReport(current => current ? { ...current, intention } : current);
    } catch (error) {
      console.error('Failed to save weekly intention', error);
      Alert.alert('Erro', 'Não foi possível salvar a intenção.');
    } finally {
      setSavingIntention(false);
    }
  }

  const consistency = report?.consistencyScore ?? 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={18} color={colors.muted} />
        <Text style={styles.backText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="analytics-outline" size={24} color={colors.primary} />
        </View>
        <Text style={styles.eyebrow}>RELATÓRIO SEMANAL</Text>
        <Text style={styles.title}>Seu mapa de continuidade.</Text>
        <Text style={styles.subtitle}>Veja o que apareceu, celebre o que já se moveu e escolha um passo pequeno para manter o ritmo.</Text>
      </View>

      {!report ? (
        <View style={styles.startCard}>
          <Text style={styles.startTitle}>Gerar leitura da semana</Text>
          <Text style={styles.startText}>O relatório cruza diário, semente e raízes para mostrar um resumo motivador do seu progresso.</Text>
          <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <>
                <Text style={styles.generateText}>Gerar relatório</Text>
                <Ionicons name="sparkles-outline" size={18} color={colors.primaryText} />
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.headlineCard}>
            <Text style={styles.headline}>{report.headline}</Text>
            <Text style={styles.encouragement}>{report.encouragement}</Text>
          </View>

          <View style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
              <View>
                <Text style={styles.scoreLabel}>Consistência</Text>
                <Text style={styles.scoreValue}>{consistency}%</Text>
              </View>
              <View style={styles.daysBadge}>
                <Text style={styles.daysValue}>{report.registeredDays}/7</Text>
                <Text style={styles.daysLabel}>dias</Text>
              </View>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${consistency}%` }]} />
            </View>
          </View>

          <View style={styles.levelCard}>
            <View style={styles.levelHeader}>
              <View style={styles.levelIcon}>
                <Ionicons name="flower-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.levelCopy}>
                <Text style={styles.levelKicker}>Nível {report.consciousness.level}</Text>
                <Text style={styles.levelName}>{report.consciousness.name}</Text>
              </View>
            </View>
            <Text style={styles.levelDescription}>{report.consciousness.description}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${report.consciousness.progress}%`, backgroundColor: colors.accent }]} />
            </View>
            <Text style={styles.levelNext}>Próximo cultivo: {report.consciousness.nextLabel}</Text>
          </View>

          <View style={styles.metricsRow}>
            <MetricCard
              icon="heart-outline"
              label="Emoção dominante"
              value={report.dominantEmotion.label}
              detail={report.dominantEmotion.count > 0 ? `${report.dominantEmotion.count} registro(s)` : 'Sem registros'}
              theme={theme}
            />
            <MetricCard
              icon="leaf-outline"
              label="Semente"
              value={report.seed?.name ?? 'Nenhuma'}
              detail={report.seed ? `${report.seed.rootProgress}% de raízes` : 'Plante uma semente'}
              theme={theme}
              tone="accent"
            />
          </View>

          <InsightCard title="Padrão percebido" icon="search-outline" text={report.pattern} theme={theme} />
          <InsightCard title="Vitória da semana" icon="trophy-outline" text={report.win} theme={theme} tone="success" />
          <InsightCard title="Próximo passo" icon="walk-outline" text={report.nextAction} theme={theme} tone="primary" />

          {report.newlyUnlockedAchievements.length ? (
            <View style={styles.newAchievementCard}>
              <Ionicons name="sparkles-outline" size={22} color={colors.primary} />
              <Text style={styles.newAchievementKicker}>NOVA CONQUISTA</Text>
              <Text style={styles.newAchievementTitle}>{report.newlyUnlockedAchievements[0].title}</Text>
              <Text style={styles.newAchievementText}>{report.newlyUnlockedAchievements[0].message}</Text>
            </View>
          ) : report.nextAchievement ? (
            <View style={styles.nextAchievementCard}>
              <View>
                <Text style={styles.nextAchievementKicker}>PRÓXIMA CONQUISTA</Text>
                <Text style={styles.nextAchievementTitle}>{report.nextAchievement.title}</Text>
                <Text style={styles.nextAchievementText}>
                  {report.nextAchievement.distance > 0
                    ? `Faltam ${report.nextAchievement.distance} ponto(s)/ação(ões) para desbloquear.`
                    : 'Você está perto de desbloquear.'}
                </Text>
              </View>
              <Ionicons name="ribbon-outline" size={24} color={colors.accent} />
            </View>
          ) : null}

          <View style={styles.intentionCard}>
            <View style={styles.insightHeader}>
              <Ionicons name="flag-outline" size={18} color={colors.accent} />
              <Text style={[styles.insightTitle, { color: colors.accent }]}>Intenção da próxima semana</Text>
            </View>
            <TextInput
              value={intention}
              onChangeText={setIntention}
              placeholder="Ex: agir com calma, terminar uma raiz, cuidar do corpo..."
              placeholderTextColor={colors.subtle}
              style={styles.intentionInput}
              multiline
            />
            <TouchableOpacity style={styles.saveIntentionBtn} onPress={handleSaveIntention} disabled={savingIntention}>
              {savingIntention ? (
                <ActivityIndicator color={colors.primaryText} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={16} color={colors.primaryText} />
                  <Text style={styles.saveIntentionText}>Salvar intenção</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {report.achievements.length ? (
            <View style={styles.achievementsCard}>
              <Text style={styles.sectionTitle}>Conquistas desbloqueadas</Text>
              {report.achievements.map(achievement => (
                <View key={achievement.id} style={styles.achievementRow}>
                  <View style={styles.achievementIcon}>
                    <Ionicons name="ribbon-outline" size={18} color={colors.success} />
                  </View>
                  <View style={styles.achievementCopy}>
                    <Text style={styles.achievementTitle}>{achievement.title}</Text>
                    <Text style={styles.achievementMessage}>{achievement.message}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {report.seed?.roots.length ? (
            <View style={styles.rootsCard}>
              <Text style={styles.sectionTitle}>Raízes da semente</Text>
              {report.seed.roots.map(root => (
                <View key={root.name} style={styles.rootRow}>
                  <View style={styles.rootInfo}>
                    <Text style={styles.rootName}>{root.name}</Text>
                    <Text style={styles.rootMeta}>{root.count} conclusão(ões)</Text>
                  </View>
                  <Text style={styles.rootStrength}>{root.strength}%</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.ctaRow}>
            <TouchableOpacity style={styles.primaryCta} onPress={() => router.push('/(tabs)/diary')}>
              <Ionicons name="create-outline" size={17} color={colors.primaryText} />
              <Text style={styles.primaryCtaText}>Registrar hoje</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryCta} onPress={() => router.push('/(tabs)/garden')}>
              <Ionicons name="leaf-outline" size={17} color={colors.primary} />
              <Text style={styles.secondaryCtaText}>Ver jardim</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.regenerateBtn} onPress={handleGenerate} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.primary} /> : (
              <>
                <Ionicons name="refresh" size={15} color={colors.primary} />
                <Text style={styles.regenerateText}>Atualizar relatorio</Text>
              </>
            )}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  theme,
  tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  detail: string;
  theme: AppTheme;
  tone?: 'accent';
}) {
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const color = tone === 'accent' ? colors.accent : colors.primary;
  return (
    <View style={styles.metricCard}>
      <Ionicons name={icon} size={19} color={color} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue} numberOfLines={2}>{value}</Text>
      <Text style={styles.metricDetail}>{detail}</Text>
    </View>
  );
}

function InsightCard({
  title,
  text,
  icon,
  theme,
  tone,
}: {
  title: string;
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
  theme: AppTheme;
  tone?: 'primary' | 'success';
}) {
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const color = tone === 'success' ? colors.success : colors.primary;
  return (
    <View style={styles.insightCard}>
      <View style={styles.insightHeader}>
        <Ionicons name={icon} size={18} color={color} />
        <Text style={[styles.insightTitle, { color }]}>{title}</Text>
      </View>
      <Text style={styles.insightText}>{text}</Text>
    </View>
  );
}

function makeStyles(theme: AppTheme) {
  const colors = theme.colors;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 24, paddingTop: 58, paddingBottom: 48 },
    backBtn: { marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
    backText: { color: colors.muted, fontSize: 14, fontWeight: '700' },
    hero: { marginBottom: 18 },
    heroIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 14 },
    eyebrow: { fontSize: 9, letterSpacing: 3, color: colors.primary, fontWeight: '900', marginBottom: 8 },
    title: { fontSize: 33, fontWeight: '900', color: colors.text, lineHeight: 38, marginBottom: 10 },
    subtitle: { fontSize: 15, color: colors.muted, lineHeight: 22 },
    startCard: { backgroundColor: colors.surface, borderRadius: 10, padding: 18, borderWidth: 1, borderColor: colors.border },
    startTitle: { fontSize: 18, color: colors.text, fontWeight: '900', marginBottom: 8 },
    startText: { fontSize: 14, color: colors.muted, lineHeight: 21, marginBottom: 16 },
    generateBtn: { backgroundColor: colors.primary, borderRadius: 10, padding: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    generateText: { color: colors.primaryText, fontSize: 14, fontWeight: '900' },
    headlineCard: { backgroundColor: colors.surface, borderRadius: 10, padding: 18, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
    headline: { fontSize: 20, color: colors.text, fontWeight: '900', lineHeight: 27, marginBottom: 8 },
    encouragement: { fontSize: 14, color: colors.muted, lineHeight: 21 },
    scoreCard: { backgroundColor: colors.surface, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
    scoreHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    scoreLabel: { fontSize: 12, color: colors.muted, fontWeight: '800' },
    scoreValue: { fontSize: 34, color: colors.primary, fontWeight: '900' },
    daysBadge: { backgroundColor: colors.primarySoft, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 9, alignItems: 'center' },
    daysValue: { fontSize: 17, color: colors.primary, fontWeight: '900' },
    daysLabel: { fontSize: 10, color: colors.muted, fontWeight: '800' },
    track: { height: 7, backgroundColor: colors.backgroundAlt, borderRadius: 100, overflow: 'hidden' },
    fill: { height: 7, backgroundColor: colors.primary, borderRadius: 100 },
    levelCard: { backgroundColor: colors.surface, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
    levelHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    levelIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    levelCopy: { flex: 1 },
    levelKicker: { fontSize: 10, color: colors.muted, fontWeight: '900', textTransform: 'uppercase', marginBottom: 2 },
    levelName: { fontSize: 19, color: colors.text, fontWeight: '900' },
    levelDescription: { fontSize: 14, color: colors.muted, lineHeight: 21, marginBottom: 12 },
    levelNext: { fontSize: 12, color: colors.accent, fontWeight: '800', marginTop: 9, lineHeight: 18 },
    metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    metricCard: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, minHeight: 130 },
    metricLabel: { fontSize: 10, color: colors.muted, fontWeight: '900', marginTop: 10, marginBottom: 8, textTransform: 'uppercase' },
    metricValue: { fontSize: 16, color: colors.text, fontWeight: '900', lineHeight: 21, marginBottom: 4 },
    metricDetail: { fontSize: 12, color: colors.muted, lineHeight: 17 },
    insightCard: { backgroundColor: colors.surface, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
    insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 9 },
    insightTitle: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
    insightText: { fontSize: 14, color: colors.text, lineHeight: 22 },
    newAchievementCard: { backgroundColor: colors.primarySoft, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 10, alignItems: 'center' },
    newAchievementKicker: { fontSize: 10, color: colors.primary, fontWeight: '900', letterSpacing: 2, marginTop: 8, marginBottom: 6 },
    newAchievementTitle: { fontSize: 20, color: colors.text, fontWeight: '900', textAlign: 'center', marginBottom: 6 },
    newAchievementText: { fontSize: 13, color: colors.muted, lineHeight: 20, textAlign: 'center' },
    nextAchievementCard: { backgroundColor: colors.surface, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'space-between' },
    nextAchievementKicker: { fontSize: 10, color: colors.accent, fontWeight: '900', letterSpacing: 2, marginBottom: 5 },
    nextAchievementTitle: { fontSize: 16, color: colors.text, fontWeight: '900', marginBottom: 4 },
    nextAchievementText: { fontSize: 12, color: colors.muted, lineHeight: 18 },
    intentionCard: { backgroundColor: colors.surface, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
    intentionInput: { minHeight: 72, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundAlt, color: colors.text, padding: 12, fontSize: 14, lineHeight: 20, textAlignVertical: 'top', marginBottom: 12 },
    saveIntentionBtn: { backgroundColor: colors.primary, borderRadius: 10, padding: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
    saveIntentionText: { color: colors.primaryText, fontSize: 13, fontWeight: '900' },
    achievementsCard: { backgroundColor: colors.surface, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
    achievementRow: { flexDirection: 'row', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
    achievementIcon: { width: 36, height: 36, borderRadius: 9, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' },
    achievementCopy: { flex: 1 },
    achievementTitle: { fontSize: 14, color: colors.text, fontWeight: '900', marginBottom: 3 },
    achievementMessage: { fontSize: 12, color: colors.muted, lineHeight: 18 },
    rootsCard: { backgroundColor: colors.surface, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: colors.border, marginTop: 2, marginBottom: 12 },
    sectionTitle: { fontSize: 13, color: colors.primary, fontWeight: '900', marginBottom: 12, textTransform: 'uppercase' },
    rootRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
    rootInfo: { flex: 1 },
    rootName: { fontSize: 14, color: colors.text, fontWeight: '800', marginBottom: 3 },
    rootMeta: { fontSize: 12, color: colors.muted },
    rootStrength: { fontSize: 14, color: colors.success, fontWeight: '900' },
    ctaRow: { flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 16 },
    primaryCta: { flex: 1, backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
    primaryCtaText: { color: colors.primaryText, fontSize: 13, fontWeight: '900' },
    secondaryCta: { flex: 1, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 10, padding: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
    secondaryCtaText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
    regenerateBtn: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, minHeight: 40 },
    regenerateText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  });
}
