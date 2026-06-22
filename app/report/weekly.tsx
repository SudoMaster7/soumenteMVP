import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getCurrentUser } from '@/services/authService';
import { generateWeeklyReport } from '@/services/reportService';
import { useTheme, type AppTheme } from '@/lib/theme';

export default function WeeklyReport() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  async function handleGenerate() {
    const user = await getCurrentUser();
    if (!user) return;
    setLoading(true);
    try {
      const result = await generateWeeklyReport(user.id);
      setReport(result);
      setGenerated(true);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel gerar o relatorio.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={18} color={colors.muted} />
        <Text style={styles.backText}>Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.eyebrow}>RELATORIO</Text>
      <Text style={styles.title}>Sua semana em perspectiva.</Text>
      <Text style={styles.subtitle}>Use esse resumo para perceber padroes e escolher uma pequena melhoria para os proximos dias.</Text>

      {!generated ? (
        <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.primaryText} /> : (
            <>
              <Text style={styles.generateText}>Gerar relatorio da semana</Text>
              <Ionicons name="analytics-outline" size={18} color={colors.primaryText} />
            </>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.reportCard}>
          <Text style={styles.reportText}>{report}</Text>
          <TouchableOpacity style={styles.regenerateBtn} onPress={() => { setGenerated(false); setReport(''); }}>
            <Ionicons name="refresh" size={15} color={colors.primary} />
            <Text style={styles.regenerateText}>Gerar novamente</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function makeStyles(theme: AppTheme) {
  const colors = theme.colors;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 24, paddingTop: 58, paddingBottom: 48 },
    backBtn: { marginBottom: 28, flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
    backText: { color: colors.muted, fontSize: 14, fontWeight: '700' },
    eyebrow: { fontSize: 9, letterSpacing: 4, color: colors.primary, fontWeight: '800', marginBottom: 8 },
    title: { fontSize: 34, fontWeight: '800', color: colors.text, lineHeight: 39, marginBottom: 10 },
    subtitle: { fontSize: 15, color: colors.muted, lineHeight: 22, marginBottom: 28 },
    generateBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    generateText: { color: colors.primaryText, fontSize: 13, fontWeight: '800', letterSpacing: 1.2 },
    reportCard: { backgroundColor: colors.surface, borderRadius: 10, padding: 20, borderWidth: 1, borderColor: colors.border },
    reportText: { fontSize: 15, color: colors.text, lineHeight: 25 },
    regenerateBtn: { marginTop: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
    regenerateText: { color: colors.primary, fontSize: 12, letterSpacing: 0.8, fontWeight: '800' },
  });
}
