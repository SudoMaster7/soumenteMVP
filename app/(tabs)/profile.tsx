import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useDiary } from '@/hooks/useDiary';
import { getCurrentUser, signOut } from '@/services/authService';
import { getGrowthProfile, type GrowthProfile } from '@/services/growthService';
import { DEV_AUTH_ENABLED } from '@/lib/devAuth';
import { useTheme, type AppTheme } from '@/lib/theme';
import { useSuperEuStore } from '@/stores/superEuStore';
import { testPaidAiConnection } from '@/services/oracleService';

export default function Profile() {
  const { theme, themeName, toggleTheme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const { profile } = useAuth();
  const { streak } = useDiary();
  const paidAiEnabled = useSuperEuStore((state) => state.paidAiEnabled);
  const setPaidAiEnabled = useSuperEuStore((state) => state.setPaidAiEnabled);
  const [growth, setGrowth] = useState<GrowthProfile | null>(null);
  const [loadingGrowth, setLoadingGrowth] = useState(false);
  const [testingAi, setTestingAi] = useState(false);

  useFocusEffect(useCallback(() => {
    setLoadingGrowth(true);
    getCurrentUser()
      .then(user => user ? getGrowthProfile(user.id) : null)
      .then(result => {
        if (result) setGrowth(result);
      })
      .catch(error => console.warn('Failed to load profile growth', error))
      .finally(() => setLoadingGrowth(false));
  }, []));

  async function handleLogout() {
    if (DEV_AUTH_ENABLED) {
      await signOut();
      router.replace('/');
      return;
    }

    Alert.alert('Reiniciar', 'Voltar para a tela inicial?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Reiniciar',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace(DEV_AUTH_ENABLED ? '/' : '/(auth)/login');
        },
      },
    ]);
  }

  async function handleTestAi() {
    setTestingAi(true);
    try {
      const response = await testPaidAiConnection();
      Alert.alert('IA conectada', response || 'Claude respondeu com sucesso.');
    } catch (error) {
      console.warn('Failed to test paid AI', error);
      Alert.alert(
        'IA indisponível',
        'Não consegui falar com o Claude agora. Confira ANTHROPIC_API_KEY no .env/local e nas variáveis da Vercel.'
      );
    } finally {
      setTestingAi(false);
    }
  }

  const initial = profile?.name?.[0]?.toUpperCase() || 'S';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>PERFIL</Text>

      <View style={styles.avatarWrap}>
        <View style={styles.avatar}><Text style={styles.avatarLetter}>{initial}</Text></View>
        <Text style={styles.name}>{profile?.name || 'Desenvolvimento'}</Text>
        <Text style={styles.email}>{profile?.email || 'dev@soumente.local'}</Text>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Ionicons name="flame-outline" size={20} color={colors.warning} />
          <Text style={styles.summaryValue}>{streak}</Text>
          <Text style={styles.summaryLabel}>dias seguidos</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="checkmark-done-outline" size={20} color={colors.success} />
          <Text style={styles.summaryValue}>Hoje</Text>
          <Text style={styles.summaryLabel}>um passo basta</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>PROGRESSO</Text>
      <View style={styles.growthCard}>
        {loadingGrowth && !growth ? (
          <ActivityIndicator color={colors.primary} />
        ) : growth ? (
          <>
            <View style={styles.growthHeader}>
              <View style={styles.growthIcon}>
                <Ionicons name="flower-outline" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.growthKicker}>Nível {growth.level.level}</Text>
                <Text style={styles.growthTitle}>{growth.level.name}</Text>
              </View>
              <Text style={styles.score}>{growth.score}</Text>
            </View>
            <Text style={styles.growthText}>{growth.level.description}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${growth.level.progress}%` }]} />
            </View>
            {growth.nextAchievement ? (
              <Text style={styles.nextLine}>
                Próxima conquista: {growth.nextAchievement.title}
                {growth.nextAchievement.distance > 0 ? ` - faltam ${growth.nextAchievement.distance}` : ''}
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.settingHint}>Sem dados de progresso ainda.</Text>
        )}
      </View>

      {growth?.unlockedAchievements.length ? (
        <>
          <Text style={styles.sectionLabel}>CONQUISTAS</Text>
          <View style={styles.settingsCard}>
            {growth.unlockedAchievements.map((achievement, index) => (
              <View key={achievement.id} style={[styles.achievementRow, index > 0 && styles.rowBorder]}>
                <View style={styles.achievementIcon}>
                  <Ionicons name="ribbon-outline" size={18} color={colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  <Text style={styles.achievementText}>{achievement.message}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <Text style={styles.sectionLabel}>APARÊNCIA</Text>
      <View style={styles.settingsCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name={themeName === 'dark' ? 'moon-outline' : 'sunny-outline'} size={20} color={colors.primary} />
            <View>
              <Text style={styles.settingLabel}>Modo {themeName === 'dark' ? 'escuro' : 'claro'}</Text>
              <Text style={styles.settingHint}>Escolha o ambiente que ajuda seu foco.</Text>
            </View>
          </View>
          <Switch
            value={themeName === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={themeName === 'dark' ? colors.primaryText : colors.surfaceElevated}
          />
        </View>
      </View>

      <Text style={styles.sectionLabel}>RITMO</Text>
      <View style={styles.settingsCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications-outline" size={20} color={colors.accent} />
            <View>
              <Text style={styles.settingLabel}>Lembrete diário</Text>
              <Text style={styles.settingHint}>Um check-in curto no fim do dia.</Text>
            </View>
          </View>
          <Text style={styles.settingValue}>21:00</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>CONTA</Text>
      <View style={styles.settingsCard}>
        <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/report/weekly')}>
          <View style={styles.settingLeft}>
            <Ionicons name="analytics-outline" size={20} color={colors.success} />
            <Text style={styles.settingLabel}>Relatório semanal</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>INTELIGÊNCIA ARTIFICIAL</Text>
      <View style={styles.settingsCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name={paidAiEnabled ? 'sparkles-outline' : 'sparkles'} size={20} color={paidAiEnabled ? colors.primary : colors.subtle} />
            <View>
              <Text style={styles.settingLabel}>
                {paidAiEnabled ? 'IA paga ativada' : 'IA paga desativada'}
              </Text>
              <Text style={styles.settingHint}>
                {paidAiEnabled ? 'Usa Claude nas funcionalidades de insight.' : 'Usa respostas locais e mockadas sem custo.'}
              </Text>
            </View>
          </View>
          <Switch
            value={paidAiEnabled}
            onValueChange={setPaidAiEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={paidAiEnabled ? colors.primaryText : colors.surfaceElevated}
          />
        </View>
        <View style={[styles.aiInfoBox, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
          <Text style={[styles.aiInfoTitle, { color: colors.text }]}>Funcionalidades afetadas</Text>
          <Text style={[styles.aiInfoText, { color: colors.muted }]}>
            Oráculo diário, Mentor SouMente, reflexões do Grimório e geração de raízes.
          </Text>
        </View>
        <TouchableOpacity style={[styles.testAiButton, testingAi && { opacity: 0.65 }]} onPress={handleTestAi} disabled={testingAi}>
          {testingAi ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Ionicons name="pulse-outline" size={17} color={colors.primary} />
          )}
          <Text style={styles.testAiText}>{testingAi ? 'Testando Claude...' : 'Testar conexão Claude'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Voltar para a landing page</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Soumente v1.0 Beta</Text>
    </ScrollView>
  );
}

function makeStyles(theme: AppTheme) {
  const colors = theme.colors;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 24, paddingTop: 58, paddingBottom: 48 },
    eyebrow: { fontSize: 9, letterSpacing: 4, color: colors.primary, fontWeight: '800', marginBottom: 24 },
    avatarWrap: { alignItems: 'center', marginBottom: 26 },
    avatar: { width: 82, height: 82, borderRadius: 41, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    avatarLetter: { fontSize: 32, fontWeight: '800', color: colors.primary },
    name: { fontSize: 23, fontWeight: '800', color: colors.text, marginBottom: 4 },
    email: { fontSize: 13, color: colors.muted },
    summaryGrid: { flexDirection: 'row', gap: 10, marginBottom: 28 },
    summaryCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 16 },
    summaryValue: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 8 },
    summaryLabel: { fontSize: 11, color: colors.muted, marginTop: 2 },
    sectionLabel: { fontSize: 9, letterSpacing: 3, color: colors.muted, fontWeight: '800', marginBottom: 10 },
    growthCard: { backgroundColor: colors.surface, borderRadius: 10, marginBottom: 22, borderWidth: 1, borderColor: colors.border, padding: 16 },
    growthHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    growthIcon: { width: 42, height: 42, borderRadius: 10, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    growthKicker: { fontSize: 10, color: colors.primary, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 },
    growthTitle: { fontSize: 18, color: colors.text, fontWeight: '900' },
    score: { fontSize: 17, color: colors.accent, fontWeight: '900' },
    growthText: { fontSize: 13, color: colors.muted, lineHeight: 20, marginBottom: 12 },
    track: { height: 6, backgroundColor: colors.backgroundAlt, borderRadius: 99, overflow: 'hidden' },
    fill: { height: 6, backgroundColor: colors.primary, borderRadius: 99 },
    nextLine: { fontSize: 12, color: colors.accent, fontWeight: '800', lineHeight: 18, marginTop: 10 },
    settingsCard: { backgroundColor: colors.surface, borderRadius: 10, marginBottom: 22, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    achievementRow: { flexDirection: 'row', gap: 12, padding: 15 },
    rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
    achievementIcon: { width: 36, height: 36, borderRadius: 9, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' },
    achievementTitle: { fontSize: 14, color: colors.text, fontWeight: '900', marginBottom: 3 },
    achievementText: { fontSize: 12, color: colors.muted, lineHeight: 18 },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, gap: 14 },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    settingLabel: { fontSize: 14, color: colors.text, fontWeight: '700' },
    settingHint: { fontSize: 12, color: colors.muted, marginTop: 2 },
    settingValue: { fontSize: 13, color: colors.primary, fontWeight: '800' },
    aiInfoBox: { marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderRadius: 8, padding: 12 },
    aiInfoTitle: { fontSize: 12, fontWeight: '900', marginBottom: 5 },
    aiInfoText: { fontSize: 12, lineHeight: 18 },
    testAiButton: { marginHorizontal: 16, marginBottom: 16, minHeight: 44, borderRadius: 8, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    testAiText: { fontSize: 12, color: colors.primary, fontWeight: '900', letterSpacing: 0.4 },
    logoutBtn: { borderWidth: 1, borderColor: colors.danger, backgroundColor: colors.dangerSoft, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 24 },
    logoutText: { color: colors.danger, fontSize: 13, fontWeight: '800', letterSpacing: 1 },
    version: { textAlign: 'center', fontSize: 11, color: colors.subtle },
  });
}
