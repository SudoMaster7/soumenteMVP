import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { todayHermetic } from '@/constants/supereu';
import { fetchDailyOracle } from '@/services/oracleService';
import { useSuperEuStore } from '@/stores/superEuStore';
import { useTheme, type AppTheme } from '@/lib/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const PRINCIPLES: { icon: keyof typeof Ionicons.glyphMap; law: string; quote: string }[] = [
  { icon: 'bulb-outline', law: 'Mentalismo', quote: 'O que você pensa alimenta o que você faz' },
  { icon: 'git-compare-outline', law: 'Correspondência', quote: 'O pequeno gesto revela o grande caminho' },
  { icon: 'pulse-outline', law: 'Vibração', quote: 'A consistência muda seu estado' },
  { icon: 'repeat-outline', law: 'Causalidade', quote: 'Toda ação pequena deixa um rastro' },
];

export default function OracleModal({ visible, onClose }: Props) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const { oracle, oracleDateKey, setOracle, habits, purchases, finance, diary } = useSuperEuStore();
  const [loading, setLoading] = useState(false);
  const [focusCounter, setFocusCounter] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const todayKey = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (visible && oracleDateKey !== todayKey) loadOracle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  async function loadOracle(forceNew = false) {
    stopMotivationAudio();
    setLoading(true);
    const nextCounter = forceNew ? focusCounter + 1 : focusCounter;
    const seed = forceNew ? `${todayKey}-${nextCounter}-${Date.now()}` : todayKey;
    const result = await fetchDailyOracle({ habits, purchases, finance, diary }, seed);
    if (forceNew) setFocusCounter(nextCounter);
    setOracle(result, todayKey);
    setLoading(false);
  }

  function buildMysticMotivationText() {
    if (!oracle) return '';
    return [
      'Feche os olhos por um instante.',
      'Respire fundo.',
      oracle.quote,
      oracle.focus ? `O foco de hoje é ${oracle.focus}.` : '',
      oracle.action ? `A ação concreta é esta: ${oracle.action}` : '',
      'Não force o dia inteiro.',
      'Atravesse apenas o próximo gesto.',
    ].filter(Boolean).join(' ... ');
  }

  function getBestFreeVoice() {
    const availableVoices = voices.length ? voices : window.speechSynthesis.getVoices();
    const scored = availableVoices
      .filter((voice) => voice.lang.toLowerCase().startsWith('pt'))
      .map((voice) => {
        const name = voice.name.toLowerCase();
        const lang = voice.lang.toLowerCase();
        let score = 0;
        if (lang === 'pt-br') score += 5;
        if (name.includes('natural')) score += 6;
        if (name.includes('online')) score += 4;
        if (name.includes('microsoft')) score += 4;
        if (name.includes('google')) score += 3;
        if (name.includes('premium')) score += 2;
        if (name.includes('daniel') || name.includes('antonio') || name.includes('ricardo')) score += 2;
        if (voice.localService) score -= 1;
        return { voice, score };
      })
      .sort((a, b) => b.score - a.score);

    return scored[0]?.voice ?? availableVoices.find((voice) => voice.lang.toLowerCase().startsWith('pt'));
  }

  function createMysticUtterance(text: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getBestFreeVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || 'pt-BR';
    utterance.rate = 0.7;
    utterance.pitch = 0.66;
    utterance.volume = 0.95;
    return utterance;
  }

  function stopMotivationAudio() {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }

  function playMotivationAudio() {
    if (!oracle) return;

    if (speaking) {
      stopMotivationAudio();
      return;
    }

    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.speechSynthesis) {
      Alert.alert('Áudio indisponível', 'O TTS gratuito está ativo no navegador. Para celular nativo, adicionamos expo-speech no próximo passo.');
      return;
    }

    const utterance = createMysticUtterance(buildMysticMotivationText());
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.cancel();
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  function handleClose() {
    stopMotivationAudio();
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.dateLabel}>{todayHermetic()}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.oracleCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="compass-outline" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.oracleTag}>ORÁCULO DIÁRIO</Text>
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
                    <View style={styles.focusHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.focusLabel}>FOCO DO DIA</Text>
                        <Text style={styles.focusText}>{oracle.focus}</Text>
                      </View>
                      <TouchableOpacity style={styles.audioBtn} onPress={playMotivationAudio} disabled={loading}>
                        <Ionicons name={speaking ? 'stop' : 'volume-high-outline'} size={16} color={colors.primary} />
                        <Text style={styles.audioText}>{speaking ? 'Parar' : 'Ouvir'}</Text>
                      </TouchableOpacity>
                    </View>
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
            <View style={styles.oracleActions}>
              <TouchableOpacity onPress={playMotivationAudio} style={styles.newOracleBtn} disabled={loading || !oracle}>
                <Text style={styles.newOracleTxt}>{speaking ? 'Parar voz' : 'Voz mística'}</Text>
                <Ionicons name={speaking ? 'stop' : 'volume-high-outline'} size={15} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => loadOracle(true)} style={styles.newOracleBtn} disabled={loading}>
                <Text style={styles.newOracleTxt}>Gerar novo foco</Text>
                <Ionicons name="refresh" size={15} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionLabel}>PRINCÍPIOS ATIVOS</Text>
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
      </View>
    </Modal>
  );
}

function makeStyles(theme: AppTheme) {
  const colors = theme.colors;
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 58, paddingBottom: 8 },
    closeButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    scroll: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 40 },
    dateLabel: { fontSize: 10, letterSpacing: 2, color: colors.muted, textTransform: 'uppercase' },
    oracleCard: { backgroundColor: colors.surface, borderRadius: 10, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
    iconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.border },
    oracleTag: { fontSize: 9, letterSpacing: 3, color: colors.primary, fontWeight: '800' },
    oracleHint: { fontSize: 12, color: colors.muted, marginTop: 3 },
    oracleQuote: { fontSize: 18, color: colors.text, fontStyle: 'italic', lineHeight: 28, marginBottom: 12 },
    oraclePrinciple: { fontSize: 11, color: colors.muted, letterSpacing: 1, marginBottom: 20 },
    focusBox: { backgroundColor: colors.primarySoft, borderRadius: 8, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
    focusHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    focusLabel: { fontSize: 9, color: colors.primary, fontWeight: '900', letterSpacing: 1.8, marginBottom: 4 },
    focusText: { fontSize: 15, color: colors.text, fontWeight: '900' },
    audioBtn: { minHeight: 36, borderRadius: 18, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    audioText: { fontSize: 11, color: colors.primary, fontWeight: '900', letterSpacing: 0.6 },
    actionBox: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', backgroundColor: colors.backgroundAlt, borderRadius: 8, padding: 12, marginBottom: 16 },
    actionText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 19 },
    oracleActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 14 },
    newOracleBtn: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 6 },
    newOracleTxt: { fontSize: 12, color: colors.primary, letterSpacing: 0.8, fontWeight: '800' },
    sectionLabel: { fontSize: 9, letterSpacing: 3, color: colors.muted, fontWeight: '800', marginBottom: 12 },
    principleCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: colors.surface, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
    principleBody: { flex: 1 },
    principleLaw: { fontSize: 11, letterSpacing: 2, color: colors.accent, fontWeight: '800', marginBottom: 4, textTransform: 'uppercase' },
    principleQuote: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  });
}
