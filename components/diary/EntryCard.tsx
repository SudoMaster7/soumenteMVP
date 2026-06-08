import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EMOTIONS } from '@/constants/emotions';
import type { DiaryEntry } from '@/types';

const DIMENSION_ICONS: Record<string, string> = {
  subtle: '🌱', medium: '🌿', deep: '🌳', transformative: '🌪️',
};

interface Props {
  entry: DiaryEntry;
  onPress?: () => void;
}

export function EntryCard({ entry, onPress }: Props) {
  const emotion = EMOTIONS.find(e => e.id === entry.emotion_primary);
  const date = new Date(entry.entry_date + 'T12:00:00');
  const formatted = date.toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', weekday: 'short',
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.top}>
        <Text style={styles.emoji}>{emotion?.emoji || '😶'}</Text>
        <View style={styles.meta}>
          <Text style={styles.date}>{formatted}</Text>
          <Text style={[styles.emotionLabel, { color: emotion?.color || '#6A6258' }]}>
            {emotion?.label || 'Neutro'}
          </Text>
        </View>
        <View style={styles.dimBadge}>
          <Text style={styles.dimIcon}>{DIMENSION_ICONS[entry.dimension] || '🌱'}</Text>
        </View>
      </View>
      {entry.text ? (
        <Text style={styles.preview} numberOfLines={2}>{entry.text}</Text>
      ) : null}
      {entry.ai_insight ? (
        <Text style={styles.insight} numberOfLines={1}>✦ {entry.ai_insight}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1C1915',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2A2420',
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  emoji: { fontSize: 28 },
  meta: { flex: 1 },
  date: { fontSize: 10, color: '#6A6258', letterSpacing: 0.5, textTransform: 'uppercase' },
  emotionLabel: { fontSize: 14, fontWeight: 'bold', marginTop: 2 },
  dimBadge: {
    width: 32, height: 32,
    backgroundColor: '#2A2420',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimIcon: { fontSize: 16 },
  preview: { fontSize: 14, color: '#6A6258', fontStyle: 'italic', lineHeight: 20 },
  insight: { fontSize: 12, color: '#C4A882', marginTop: 6, opacity: 0.7 },
});
