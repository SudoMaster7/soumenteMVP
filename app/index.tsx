import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { DEV_AUTH_ENABLED, DEV_USER } from '@/lib/devAuth';
import { useTheme } from '@/lib/theme';
import { useAuthStore } from '@/stores/authStore';

const pillars = [
  {
    icon: 'leaf-outline' as const,
    title: 'Sementes',
    text: 'Transforme objetivos em algo vivo, com raizes, rituais e progresso visivel.',
  },
  {
    icon: 'book-outline' as const,
    title: 'Diario emocional',
    text: 'Registre como voce esta e acompanhe padroes de humor, energia e profundidade.',
  },
  {
    icon: 'compass-outline' as const,
    title: 'Super Eu',
    text: 'Um painel para rituais, metas, plano material, financas e reflexoes do dia.',
  },
];

export default function LandingPage() {
  const { theme, themeName, toggleTheme } = useTheme();
  const { setUser, fetchProfile, setProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const colors = theme.colors;

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
        <View>
          <Text style={[styles.brandKicker, { color: colors.primary }]}>SOUMENTE</Text>
          <Text style={[styles.brand, { color: colors.text }]}>Cultive sua mente.</Text>
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
          <Text style={[styles.eyebrow, { color: colors.primary }]}>MVP DE AUTOCONHECIMENTO PRATICO</Text>
          <Text style={[styles.title, { color: colors.text }]}>Um jardim para objetivos, emocoes e disciplina diaria.</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Soumente une diario emocional, sementes de objetivo e um painel do Super Eu para voce enxergar o que esta cultivando todos os dias.</Text>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={enterApp}
              disabled={loading}
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.86}
            >
              {loading ? (
                <ActivityIndicator color={theme.isDark ? '#070706' : '#FFFFFF'} />
              ) : (
                <>
                  <Text style={[styles.primaryText, { color: theme.isDark ? '#070706' : '#FFFFFF' }]}>Entrar no app</Text>
                  <Ionicons name="arrow-forward" size={18} color={theme.isDark ? '#070706' : '#FFFFFF'} />
                </>
              )}
            </TouchableOpacity>
            <Text style={[styles.devNote, { color: colors.subtle }]}>Login desativado no desenvolvimento.</Text>
          </View>
        </View>

        <View style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.previewHeader}>
            <View style={[styles.previewDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.previewLabel, { color: colors.primary }]}>ESPELHO DO DIA</Text>
          </View>
          <Text style={[styles.previewQuote, { color: colors.text }]}>"Cada habito e um voto que voce faz para si mesmo."</Text>
          <View style={styles.previewGrid}>
            <View style={[styles.metric, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}> 
              <Text style={[styles.metricValue, { color: colors.text }]}>4/6</Text>
              <Text style={[styles.metricLabel, { color: colors.muted }]}>Rituais</Text>
            </View>
            <View style={[styles.metric, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
              <Text style={[styles.metricValue, { color: colors.text }]}>68%</Text>
              <Text style={[styles.metricLabel, { color: colors.muted }]}>Grande obra</Text>
            </View>
          </View>
          <View style={[styles.seedPreview, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
            <Ionicons name="leaf-outline" size={24} color={colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.seedTitle, { color: colors.text }]}>Semente ativa</Text>
              <Text style={[styles.seedSub, { color: colors.muted }]}>Lancamento Soumente v1</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.pillars}>
        {pillars.map((pillar) => (
          <View key={pillar.title} style={[styles.pillarCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <Ionicons name={pillar.icon} size={22} color={colors.primary} />
            <Text style={[styles.pillarTitle, { color: colors.text }]}>{pillar.title}</Text>
            <Text style={[styles.pillarText, { color: colors.muted }]}>{pillar.text}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 54, paddingBottom: 42 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 34 },
  brandKicker: { fontSize: 10, letterSpacing: 4, fontWeight: '800' },
  brand: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  iconButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { gap: 24 },
  heroCopy: { gap: 0 },
  eyebrow: { fontSize: 10, letterSpacing: 3, fontWeight: '800', marginBottom: 12 },
  title: { fontSize: 42, lineHeight: 46, fontWeight: '800', marginBottom: 16 },
  subtitle: { fontSize: 17, lineHeight: 25, marginBottom: 24 },
  actions: { gap: 10, marginBottom: 4 },
  primaryButton: { minHeight: 52, borderRadius: 12, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  primaryText: { fontSize: 14, fontWeight: '800', letterSpacing: 1.4 },
  devNote: { fontSize: 12, textAlign: 'center' },
  preview: { borderRadius: 8, borderWidth: 1, padding: 18, gap: 16 },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewDot: { width: 7, height: 7, borderRadius: 4 },
  previewLabel: { fontSize: 9, letterSpacing: 3, fontWeight: '800' },
  previewQuote: { fontSize: 19, lineHeight: 27, fontStyle: 'italic' },
  previewGrid: { flexDirection: 'row', gap: 10 },
  metric: { flex: 1, borderRadius: 8, borderWidth: 1, padding: 14 },
  metricValue: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  metricLabel: { fontSize: 11, letterSpacing: 1 },
  seedPreview: { borderRadius: 8, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  seedTitle: { fontSize: 14, fontWeight: '800' },
  seedSub: { fontSize: 12, marginTop: 2 },
  pillars: { marginTop: 28, gap: 12 },
  pillarCard: { borderRadius: 8, borderWidth: 1, padding: 18 },
  pillarTitle: { fontSize: 17, fontWeight: '800', marginTop: 12, marginBottom: 6 },
  pillarText: { fontSize: 14, lineHeight: 21 },
});
