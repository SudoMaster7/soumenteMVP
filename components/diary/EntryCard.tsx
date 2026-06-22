import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EMOTIONS } from '@/constants/emotions';
import { useTheme, type AppTheme } from '@/lib/theme';
import type { DiaryEntry } from '@/types';

const DIMENSION_ICONS: Record<string, string> = {
  subtle: 'S', medium: 'M', deep: 'D', transformative: 'T',
};

interface Props {
  entry: DiaryEntry;
  onPress?: () => void;
}

export function EntryCard({ entry, onPress }: Props) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const emotion = EMOTIONS.find(e => e.id === entry.emotion_primary);
  const date = new Date(entry.entry_date + 'T12:00:00');
  const formatted = date.toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', weekday: 'short',
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.top}>
        <Text style={styles.emoji}>{emotion?.emoji || '•'}</Text>
        <View style={styles.meta}>
          <Text style={styles.date}>{formatted}</Text>
          <Text style={[styles.emotionLabel, { color: emotion?.color || colors.primary }]}>{emotion?.label || 'Neutro'}</Text>
        </View>
        <View style={styles.dimBadge}>
          <Text style={styles.dimIcon}>{DIMENSION_ICONS[entry.dimension] || 'S'}</Text>
        </View>
      </View>
      {entry.text ? <Text style={styles.preview} numberOfLines={2}>{entry.text}</Text> : null}
      {entry.ai_insight ? <Text style={styles.insight} numberOfLines={1}>Insight: {entry.ai_insight}</Text> : null}
    </TouchableOpacity>
  );
}

function makeStyles(theme: AppTheme) {
  const colors = theme.colors;
  return StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: 10, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
    top: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    emoji: { fontSize: 28 },
    meta: { flex: 1 },
    date: { fontSize: 10, color: colors.muted, letterSpacing: 0.5, textTransform: 'uppercase' },
    emotionLabel: { fontSize: 14, fontWeight: '800', marginTop: 2 },
    dimBadge: { width: 32, height: 32, backgroundColor: colors.accentSoft, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    dimIcon: { fontSize: 12, color: colors.accent, fontWeight: '800' },
    preview: { fontSize: 14, color: colors.muted, lineHeight: 20 },
    insight: { fontSize: 12, color: colors.primary, marginTop: 6, opacity: 0.85 },
  });
}
