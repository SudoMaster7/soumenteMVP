import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useDiary } from '@/hooks/useDiary';
import { signOut } from '@/services/authService';

export default function Profile() {
  const { profile } = useAuth();
  const { streak } = useDiary();

  async function handleLogout() {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <Text style={styles.eyebrow}>PERFIL</Text>

      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>
            {profile?.name?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.name || 'Usuário'}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
      </View>

      {streak > 0 && (
        <View style={styles.streakCard}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View>
            <Text style={styles.streakNum}>{streak} dias seguidos</Text>
            <Text style={styles.streakSub}>Continue assim</Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionLabel}>CONFIGURAÇÕES</Text>
      <View style={styles.settingsCard}>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Notificação diária</Text>
          <Text style={styles.settingValue}>21:00</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Lembrete ativo</Text>
          <Switch
            value={true}
            onValueChange={() => {}}
            trackColor={{ false: '#2A2420', true: '#C4A882' }}
            thumbColor="#F0E8D8"
          />
        </View>
      </View>

      <Text style={styles.sectionLabel}>CONTA</Text>
      <View style={styles.settingsCard}>
        <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/report/weekly')}>
          <Text style={styles.settingLabel}>Relatório semanal</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Soumente v1.0 · Beta</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0906' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 48 },
  eyebrow: { fontSize: 9, letterSpacing: 4, color: '#C4A882', fontWeight: 'bold', marginBottom: 24 },
  avatarWrap: { alignItems: 'center', marginBottom: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(196,168,130,0.1)', borderWidth: 1, borderColor: 'rgba(196,168,130,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarLetter: { fontSize: 32, fontWeight: 'bold', color: '#C4A882' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#F0E8D8', marginBottom: 4 },
  email: { fontSize: 13, color: '#6A6258' },
  streakCard: { backgroundColor: '#1C1915', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28, borderWidth: 1, borderColor: '#2A2420' },
  streakEmoji: { fontSize: 32 },
  streakNum: { fontSize: 16, fontWeight: 'bold', color: '#F0E8D8' },
  streakSub: { fontSize: 12, color: '#6A6258', marginTop: 2 },
  sectionLabel: { fontSize: 9, letterSpacing: 3, color: '#6A6258', fontWeight: 'bold', marginBottom: 10 },
  settingsCard: { backgroundColor: '#1C1915', borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: '#2A2420', overflow: 'hidden' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  settingLabel: { fontSize: 14, color: '#F0E8D8' },
  settingValue: { fontSize: 13, color: '#C4A882' },
  settingArrow: { fontSize: 20, color: '#6A6258' },
  divider: { height: 1, backgroundColor: '#2A2420' },
  logoutBtn: { borderWidth: 1, borderColor: '#8B3A2A', borderRadius: 100, padding: 14, alignItems: 'center', marginBottom: 24 },
  logoutText: { color: '#8B3A2A', fontSize: 13, fontWeight: 'bold', letterSpacing: 2 },
  version: { textAlign: 'center', fontSize: 11, color: '#2A2420' },
});
