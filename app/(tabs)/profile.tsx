import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useDiary } from '@/hooks/useDiary';
import { signOut } from '@/services/authService';
import { DEV_AUTH_ENABLED } from '@/lib/devAuth';
import { useTheme, type AppTheme } from '@/lib/theme';

export default function Profile() {
  const { theme, themeName, toggleTheme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const { profile } = useAuth();
  const { streak } = useDiary();

  async function handleLogout() {
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

      <Text style={styles.sectionLabel}>APARENCIA</Text>
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
              <Text style={styles.settingLabel}>Lembrete diario</Text>
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
            <Text style={styles.settingLabel}>Relatorio semanal</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
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
    settingsCard: { backgroundColor: colors.surface, borderRadius: 10, marginBottom: 22, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, gap: 14 },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    settingLabel: { fontSize: 14, color: colors.text, fontWeight: '700' },
    settingHint: { fontSize: 12, color: colors.muted, marginTop: 2 },
    settingValue: { fontSize: 13, color: colors.primary, fontWeight: '800' },
    logoutBtn: { borderWidth: 1, borderColor: colors.danger, backgroundColor: colors.dangerSoft, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 24 },
    logoutText: { color: colors.danger, fontSize: 13, fontWeight: '800', letterSpacing: 1 },
    version: { textAlign: 'center', fontSize: 11, color: colors.subtle },
  });
}
