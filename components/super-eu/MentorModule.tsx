import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type AppTheme } from '@/lib/theme';
import { askSouMenteMentor } from '@/services/oracleService';
import { useSuperEuStore } from '@/stores/superEuStore';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const QUICK_PROMPTS = [
  'Qual deve ser meu foco hoje?',
  'O que meus dados mostram sobre minha disciplina?',
  'Me ajude a escolher uma ação pequena agora',
  'Onde estou gastando energia demais?',
];

export default function MentorModule() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const { goals, habits, purchases, finance, diary } = useSuperEuStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Eu sou o Mentor SouMente. Posso olhar seus rituais, objetivos, plano, finanças e grimório para sugerir o próximo passo com mais contexto.',
    },
  ]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);

  const snapshot = useMemo(() => ({ goals, habits, purchases, finance, diary }), [goals, habits, purchases, finance, diary]);
  const todayIndex = useMemo(() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
  }, []);
  const completedToday = habits.filter((habit) => habit.days[todayIndex]).length;
  const avgGoal = goals.length ? Math.round(goals.reduce((total, goal) => total + goal.progress, 0) / goals.length) : 0;
  const balance = finance.reduce((total, entry) => total + entry.amount, 0);

  async function sendMessage(text = draft) {
    const question = text.trim();
    if (!question || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: question }];
    setMessages(nextMessages);
    setDraft('');
    setLoading(true);

    const answer = await askSouMenteMentor(question, snapshot, nextMessages);
    setMessages((current) => [...current, { role: 'assistant', content: answer }]);
    setLoading(false);
  }

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="chatbubbles-outline" size={23} color={colors.primary} />
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>Mentor SouMente</Text>
            <Text style={styles.heroText}>Um bot com memória do seu progresso para transformar registros em ação.</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <MiniStat label="Rituais" value={`${completedToday}/${habits.length}`} theme={theme} />
          <MiniStat label="Objetivos" value={`${avgGoal}%`} theme={theme} />
          <MiniStat label="Saldo" value={`R$ ${balance.toLocaleString('pt-BR')}`} theme={theme} tone={balance >= 0 ? 'success' : 'danger'} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
          {QUICK_PROMPTS.map((prompt) => (
            <TouchableOpacity key={prompt} style={styles.quickChip} onPress={() => sendMessage(prompt)} disabled={loading}>
              <Text style={styles.quickText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.chatStack}>
          {messages.map((message, index) => {
            const isUser = message.role === 'user';
            return (
              <View key={`${message.role}-${index}`} style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
                <View style={styles.messageHeader}>
                  <Ionicons name={isUser ? 'person-outline' : 'sparkles-outline'} size={13} color={isUser ? colors.primaryText : colors.primary} />
                  <Text style={[styles.messageRole, isUser ? styles.userRole : styles.assistantRole]}>{isUser ? 'Você' : 'Mentor'}</Text>
                </View>
                <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>{message.content}</Text>
              </View>
            );
          })}
          {loading ? (
            <View style={[styles.messageBubble, styles.assistantBubble]}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.composerWrap}>
        <TextInput
          style={styles.input}
          placeholder="Pergunte ao Mentor..."
          placeholderTextColor={colors.subtle}
          value={draft}
          onChangeText={setDraft}
          multiline
        />
        <TouchableOpacity style={[styles.sendButton, (!draft.trim() || loading) && styles.sendButtonDisabled]} onPress={() => sendMessage()} disabled={!draft.trim() || loading}>
          <Ionicons name="send" size={18} color={colors.primaryText} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MiniStat({ label, value, theme, tone }: { label: string; value: string; theme: AppTheme; tone?: 'success' | 'danger' }) {
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const color = tone === 'success' ? colors.success : tone === 'danger' ? colors.danger : colors.text;
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function makeStyles(theme: AppTheme) {
  const colors = theme.colors;
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { padding: 20, paddingBottom: 18 },
    heroCard: { backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 },
    heroIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    heroTextWrap: { flex: 1 },
    heroTitle: { fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: 4 },
    heroText: { fontSize: 13, color: colors.muted, lineHeight: 19 },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    statCard: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, minHeight: 70, justifyContent: 'space-between' },
    statValue: { fontSize: 16, fontWeight: '900' },
    statLabel: { fontSize: 11, fontWeight: '800', color: colors.muted },
    quickRow: { gap: 8, paddingBottom: 14 },
    quickChip: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 100, paddingVertical: 9, paddingHorizontal: 13 },
    quickText: { fontSize: 12, color: colors.primary, fontWeight: '800' },
    chatStack: { gap: 10 },
    messageBubble: { borderRadius: 10, padding: 13, borderWidth: 1, maxWidth: '92%' },
    assistantBubble: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderColor: colors.border },
    userBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderColor: colors.primary },
    messageHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 7 },
    messageRole: { fontSize: 11, fontWeight: '900' },
    assistantRole: { color: colors.primary },
    userRole: { color: colors.primaryText },
    messageText: { fontSize: 14, lineHeight: 21 },
    assistantText: { color: colors.text },
    userText: { color: colors.primaryText },
    composerWrap: { flexDirection: 'row', gap: 10, padding: 14, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surfaceElevated, alignItems: 'flex-end' },
    input: { flex: 1, minHeight: 44, maxHeight: 110, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11, color: colors.text, fontSize: 14 },
    sendButton: { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    sendButtonDisabled: { opacity: 0.45 },
  });
}
