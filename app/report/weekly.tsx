import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { getCurrentUser } from '@/services/authService';
import { generateWeeklyReport } from '@/services/reportService';

export default function WeeklyReport() {
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
      Alert.alert('Erro', 'Não foi possível gerar o relatório.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.eyebrow}>RELATÓRIO</Text>
      <Text style={styles.title}>Sua semana{'\n'}em perspectiva.</Text>

      {!generated ? (
        <TouchableOpacity
          style={styles.generateBtn}
          onPress={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0A0906" />
          ) : (
            <Text style={styles.generateText}>Gerar relatório da semana</Text>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.reportCard}>
          <Text style={styles.reportText}>{report}</Text>
          <TouchableOpacity
            style={styles.regenerateBtn}
            onPress={() => { setGenerated(false); setReport(''); }}
          >
            <Text style={styles.regenerateText}>↺ Gerar novamente</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0906' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 48 },
  backBtn: { marginBottom: 32 },
  backText: { color: '#6A6258', fontSize: 14 },
  eyebrow: { fontSize: 9, letterSpacing: 4, color: '#C4A882', fontWeight: 'bold', marginBottom: 8 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#F0E8D8', lineHeight: 42, marginBottom: 40 },
  generateBtn: { backgroundColor: '#C4A882', borderRadius: 100, padding: 16, alignItems: 'center' },
  generateText: { color: '#0A0906', fontSize: 13, fontWeight: 'bold', letterSpacing: 2 },
  reportCard: { backgroundColor: '#1C1915', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#2A2420' },
  reportText: { fontSize: 15, color: '#F0E8D8', lineHeight: 26 },
  regenerateBtn: { marginTop: 20, alignItems: 'center' },
  regenerateText: { color: '#6A6258', fontSize: 12, letterSpacing: 1 },
});
