import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { DEV_AUTH_ENABLED, DEV_USER } from '@/lib/devAuth';
import { useTheme } from '@/lib/theme';
import { useAuthStore } from '@/stores/authStore';

const highlights = [
  { value: '7 dias', label: 'de leitura semanal' },
  { value: '6 módulos', label: 'no Super Eu' },
  { value: '1 foco', label: 'claro por vez' },
];

const pillars = [
  {
    icon: 'journal-outline' as const,
    title: 'Diário emocional',
    text: 'Registre humor, energia e profundidade para perceber padrões que normalmente passam batido.',
  },
  {
    icon: 'leaf-outline' as const,
    title: 'Sementes de objetivo',
    text: 'Transforme metas grandes em uma semente viva, com raízes, etapas e progresso visível.',
  },
  {
    icon: 'sparkles-outline' as const,
    title: 'Insights com IA',
    text: 'Receba leituras práticas sobre o seu momento, usando os dados que você mesmo cultivou.',
  },
  {
    icon: 'analytics-outline' as const,
    title: 'Relatório semanal',
    text: 'Veja consistência, vitórias, riscos e uma ação simples para manter o movimento.',
  },
];

const modules = [
  'Oráculo diário',
  'Mentor SouMente',
  'Rituais',
  'Objetivos',
  'Finanças',
  'Grimório',
];

const journey = [
  {
    step: '01',
    title: 'Registre o agora',
    text: 'O usuário marca como está se sentindo e cria um ponto real de autoconsciência.',
  },
  {
    step: '02',
    title: 'Plante uma semente',
    text: 'Um objetivo importante vira algo acompanhado por raízes, microtarefas e progresso.',
  },
  {
    step: '03',
    title: 'Receba direcao',
    text: 'O Super Eu cruza rituais, metas e diário para sugerir o próximo passo possível.',
  },
];

export default function LandingPage() {
  const { theme, themeName, toggleTheme } = useTheme();
  const { setUser, fetchProfile, setProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const colors = theme.colors;
  const isWide = width >= 920;
  const styles = makeStyles(isWide);
  const buttonTextColor = theme.isDark ? '#07110F' : colors.primaryText;

  async function enterApp() {
    setLoading(true);
    try {
      if (DEV_AUTH_ENABLED) {
        setUser(DEV_USER);
        setProfile({
          id: DEV_USER.id,
          name: 'Desenvolvimento',
          email: DEV_USER.email,
          notification_time: '09:00',
          notifications_enabled: false,
          onboarded: true,
          created_at: new Date().toISOString(),
        });
        router.push('/(tabs)');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
        router.push('/(tabs)');
      } else {
        router.push('/(auth)/login');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Image source={require('../assets/icon.png')} style={styles.logo} />
          <View>
            <Text style={[styles.brandKicker, { color: colors.primary }]}>SOUMENTE</Text>
            <Text style={[styles.brand, { color: colors.text }]}>Cultive sua mente.</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.iconButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
          accessibilityRole="button"
          accessibilityLabel="Alternar tema"
        >
          <Ionicons name={themeName === 'dark' ? 'sunny-outline' : 'moon-outline'} size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <View style={[styles.launchBadge, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}>
            <Ionicons name="flame-outline" size={16} color={colors.primary} />
            <Text style={[styles.launchText, { color: colors.primary }]}>MVP de autoconsciência prática</Text>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Um sistema para transformar emoções em direção.</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            SouMente une diário emocional, sementes de objetivo, rituais e IA para mostrar ao usuário o que ele está cultivando todos os dias.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={enterApp}
              disabled={loading}
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.86}
            >
              {loading ? (
                <ActivityIndicator color={buttonTextColor} />
              ) : (
                <>
                  <Text style={[styles.primaryText, { color: buttonTextColor }]}>Entrar no app</Text>
                  <Ionicons name="arrow-forward" size={18} color={buttonTextColor} />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.secondaryNote}>
              <Ionicons name="shield-checkmark-outline" size={15} color={colors.accent} />
              <Text style={[styles.devNote, { color: colors.subtle }]}>Login facilitado no desenvolvimento.</Text>
            </View>
          </View>

          <View style={styles.highlights}>
            {highlights.map((item) => (
              <View key={item.label} style={[styles.highlightItem, { borderColor: colors.border }]}>
                <Text style={[styles.highlightValue, { color: colors.text }]}>{item.value}</Text>
                <Text style={[styles.highlightLabel, { color: colors.muted }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <ProductPreview />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionKicker, { color: colors.primary }]}>COMO AJUDA</Text>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>O app troca culpa por clareza e progresso visível.</Text>
      </View>

      <View style={styles.pillars}>
        {pillars.map((pillar) => (
          <View key={pillar.title} style={[styles.pillarCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.pillarIcon, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name={pillar.icon} size={21} color={colors.accent} />
            </View>
            <Text style={[styles.pillarTitle, { color: colors.text }]}>{pillar.title}</Text>
            <Text style={[styles.pillarText, { color: colors.muted }]}>{pillar.text}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.storyBand, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.storyCopy}>
          <Text style={[styles.sectionKicker, { color: colors.primary }]}>JORNADA DO USUÁRIO</Text>
          <Text style={[styles.storyTitle, { color: colors.text }]}>Do sentimento solto para uma ação de 24 horas.</Text>
          <Text style={[styles.storyText, { color: colors.muted }]}>
            A experiência foi pensada para motivar continuidade: registrar, enxergar, escolher um passo pequeno e voltar amanhã com mais contexto.
          </Text>
        </View>

        <View style={styles.journeyList}>
          {journey.map((item) => (
            <View key={item.step} style={[styles.journeyCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={[styles.step, { color: colors.primary }]}>{item.step}</Text>
              <View style={styles.journeyTextBox}>
                <Text style={[styles.journeyTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.journeyText, { color: colors.muted }]}>{item.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.modulesSection}>
        <Text style={[styles.sectionKicker, { color: colors.primary }]}>SUPER EU</Text>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Um painel para acompanhar a vida com mais intenção.</Text>
        <View style={styles.moduleChips}>
          {modules.map((module) => (
            <View key={module} style={[styles.moduleChip, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
              <Text style={[styles.moduleText, { color: colors.text }]}>{module}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.finalCta, { backgroundColor: colors.primary, borderColor: colors.border }]}>
        <Text style={[styles.finalTitle, { color: buttonTextColor }]}>Comece pelo próximo passo pequeno.</Text>
        <Text style={[styles.finalText, { color: buttonTextColor }]}>
          Entre no app, registre o estado de hoje e deixe o SouMente organizar o foco do momento.
        </Text>
        <TouchableOpacity
          onPress={enterApp}
          disabled={loading}
          style={[styles.finalButton, { backgroundColor: theme.isDark ? '#07110F' : '#FFFFFF' }]}
          activeOpacity={0.86}
        >
          <Text style={[styles.finalButtonText, { color: theme.isDark ? colors.primary : colors.text }]}>Abrir SouMente</Text>
          <Ionicons name="open-outline" size={18} color={theme.isDark ? colors.primary : colors.text} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function ProductPreview() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = makeStyles(false);

  return (
    <View style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.previewHeader}>
        <View style={styles.windowDots}>
          <View style={[styles.windowDot, { backgroundColor: colors.danger }]} />
          <View style={[styles.windowDot, { backgroundColor: colors.warning }]} />
          <View style={[styles.windowDot, { backgroundColor: colors.success }]} />
        </View>
        <Text style={[styles.previewLabel, { color: colors.subtle }]}>Painel do dia</Text>
      </View>

      <View style={[styles.oracleCard, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}>
        <View style={styles.oracleHeader}>
          <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
          <Text style={[styles.oracleLabel, { color: colors.primary }]}>ORACULO DIARIO</Text>
        </View>
        <Text style={[styles.previewQuote, { color: colors.text }]}>
          Hoje o progresso não precisa ser grande. Precisa ser verdadeiro.
        </Text>
        <Text style={[styles.previewAction, { color: colors.muted }]}>Ação de 24h: conclua uma raiz da semente ativa.</Text>
      </View>

      <View style={styles.previewGrid}>
        <View style={[styles.metric, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Text style={[styles.metricValue, { color: colors.text }]}>4/6</Text>
          <Text style={[styles.metricLabel, { color: colors.muted }]}>Rituais</Text>
        </View>
        <View style={[styles.metric, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Text style={[styles.metricValue, { color: colors.text }]}>68%</Text>
          <Text style={[styles.metricLabel, { color: colors.muted }]}>Objetivo</Text>
        </View>
      </View>

      <View style={[styles.seedPreview, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <View style={[styles.seedIcon, { backgroundColor: colors.successSoft }]}>
          <Ionicons name="leaf-outline" size={22} color={colors.success} />
        </View>
        <View style={styles.seedTextBox}>
          <Text style={[styles.seedTitle, { color: colors.text }]}>Semente ativa</Text>
          <Text style={[styles.seedSub, { color: colors.muted }]}>Lançamento SouMente v1</Text>
        </View>
        <Text style={[styles.seedPercent, { color: colors.success }]}>68%</Text>
      </View>

      <View style={[styles.reportStrip, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}>
        <Ionicons name="stats-chart-outline" size={18} color={colors.accent} />
        <Text style={[styles.reportText, { color: colors.text }]}>Relatório semanal: consistência subindo, foco mais claro.</Text>
      </View>
    </View>
  );
}

function makeStyles(isWide: boolean) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: {
      paddingHorizontal: isWide ? 56 : 20,
      paddingTop: 28,
      paddingBottom: 42,
      width: '100%',
      maxWidth: 1180,
      alignSelf: 'center',
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: isWide ? 54 : 34,
    },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
    logo: { width: 42, height: 42, borderRadius: 10 },
    brandKicker: { fontSize: 10, letterSpacing: 4, fontWeight: '800' },
    brand: { fontSize: 18, fontWeight: '800', marginTop: 3 },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hero: {
      flexDirection: isWide ? 'row' : 'column',
      alignItems: 'center',
      gap: isWide ? 42 : 24,
      marginBottom: isWide ? 58 : 38,
    },
    heroCopy: { flex: 1, width: '100%' },
    launchBadge: {
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 18,
    },
    launchText: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
    title: {
      fontSize: isWide ? 58 : 38,
      lineHeight: isWide ? 62 : 43,
      fontWeight: '900',
      marginBottom: 16,
      maxWidth: 720,
    },
    subtitle: {
      fontSize: isWide ? 19 : 16,
      lineHeight: isWide ? 29 : 24,
      marginBottom: 24,
      maxWidth: 640,
    },
    actions: { gap: 12, marginBottom: 22, alignItems: 'flex-start' },
    primaryButton: {
      minHeight: 54,
      borderRadius: 12,
      paddingHorizontal: 22,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      minWidth: 190,
    },
    primaryText: { fontSize: 14, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase' },
    secondaryNote: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    devNote: { fontSize: 12, lineHeight: 17 },
    highlights: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    highlightItem: {
      minWidth: isWide ? 132 : 104,
      borderLeftWidth: 1,
      paddingLeft: 12,
      paddingVertical: 3,
    },
    highlightValue: { fontSize: 21, fontWeight: '900' },
    highlightLabel: { fontSize: 12, lineHeight: 17, marginTop: 2 },
    preview: {
      width: '100%',
      maxWidth: isWide ? 430 : 520,
      borderRadius: 8,
      borderWidth: 1,
      padding: 16,
      gap: 14,
    },
    previewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    windowDots: { flexDirection: 'row', gap: 6 },
    windowDot: { width: 9, height: 9, borderRadius: 5 },
    previewLabel: { fontSize: 11, fontWeight: '800' },
    oracleCard: { borderRadius: 8, borderWidth: 1, padding: 16, gap: 10 },
    oracleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    oracleLabel: { fontSize: 10, letterSpacing: 2, fontWeight: '900' },
    previewQuote: { fontSize: 20, lineHeight: 28, fontWeight: '800' },
    previewAction: { fontSize: 13, lineHeight: 19 },
    previewGrid: { flexDirection: 'row', gap: 10 },
    metric: { flex: 1, borderRadius: 8, borderWidth: 1, padding: 14 },
    metricValue: { fontSize: 25, fontWeight: '900', marginBottom: 4 },
    metricLabel: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
    seedPreview: { borderRadius: 8, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
    seedIcon: { width: 42, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    seedTextBox: { flex: 1, minWidth: 0 },
    seedTitle: { fontSize: 14, fontWeight: '900' },
    seedSub: { fontSize: 12, marginTop: 2 },
    seedPercent: { fontSize: 16, fontWeight: '900' },
    reportStrip: { borderRadius: 8, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
    reportText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '700' },
    sectionHeader: { marginBottom: 16, maxWidth: 720 },
    sectionKicker: { fontSize: 10, letterSpacing: 3, fontWeight: '900', marginBottom: 8 },
    sectionTitle: { fontSize: isWide ? 30 : 24, lineHeight: isWide ? 36 : 30, fontWeight: '900' },
    pillars: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 22,
    },
    pillarCard: {
      borderRadius: 8,
      borderWidth: 1,
      padding: 18,
      flexGrow: 1,
      flexBasis: isWide ? '23%' : '48%',
      minWidth: isWide ? 220 : 156,
    },
    pillarIcon: {
      width: 42,
      height: 42,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    pillarTitle: { fontSize: 17, fontWeight: '900', marginBottom: 7 },
    pillarText: { fontSize: 14, lineHeight: 21 },
    storyBand: {
      borderRadius: 8,
      borderWidth: 1,
      padding: isWide ? 24 : 18,
      flexDirection: isWide ? 'row' : 'column',
      gap: 18,
      marginBottom: 28,
    },
    storyCopy: { flex: 0.85 },
    storyTitle: { fontSize: isWide ? 28 : 23, lineHeight: isWide ? 34 : 29, fontWeight: '900', marginBottom: 10 },
    storyText: { fontSize: 15, lineHeight: 23 },
    journeyList: { flex: 1.15, gap: 10 },
    journeyCard: { borderRadius: 8, borderWidth: 1, padding: 14, flexDirection: 'row', gap: 12 },
    step: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
    journeyTextBox: { flex: 1, minWidth: 0 },
    journeyTitle: { fontSize: 15, fontWeight: '900', marginBottom: 4 },
    journeyText: { fontSize: 13, lineHeight: 19 },
    modulesSection: { marginBottom: 28 },
    moduleChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
    moduleChip: {
      borderRadius: 999,
      borderWidth: 1,
      paddingVertical: 9,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    moduleText: { fontSize: 13, fontWeight: '800' },
    finalCta: {
      borderRadius: 8,
      borderWidth: 1,
      padding: isWide ? 28 : 20,
      alignItems: isWide ? 'center' : 'stretch',
    },
    finalTitle: { fontSize: isWide ? 30 : 24, lineHeight: isWide ? 36 : 30, fontWeight: '900', textAlign: isWide ? 'center' : 'left' },
    finalText: {
      fontSize: 15,
      lineHeight: 22,
      marginTop: 8,
      marginBottom: 18,
      maxWidth: 600,
      textAlign: isWide ? 'center' : 'left',
    },
    finalButton: {
      minHeight: 50,
      borderRadius: 12,
      paddingHorizontal: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      alignSelf: isWide ? 'center' : 'stretch',
    },
    finalButtonText: { fontSize: 14, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  });
}
