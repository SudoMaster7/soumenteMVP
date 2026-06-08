import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EMOTIONS } from '@/constants/emotions';
import type { EmotionType } from '@/types';

interface Props {
  selected: EmotionType | null;
  onSelect: (emotion: EmotionType) => void;
}

export function EmotionGrid({ selected, onSelect }: Props) {
  return (
    <View style={styles.grid}>
      {EMOTIONS.map((emotion) => {
        const isSelected = selected === emotion.id;
        return (
          <TouchableOpacity
            key={emotion.id}
            style={[
              styles.card,
              isSelected && { borderColor: emotion.color, backgroundColor: `${emotion.color}15` },
            ]}
            onPress={() => onSelect(emotion.id as EmotionType)}
          >
            <Text style={styles.emoji}>{emotion.emoji}</Text>
            <Text style={[styles.label, isSelected && { color: emotion.color }]}>
              {emotion.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '30%',
    backgroundColor: '#1C1915',
    borderWidth: 1,
    borderColor: '#2A2420',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  emoji: { fontSize: 24 },
  label: { fontSize: 11, color: '#6A6258', textAlign: 'center', fontWeight: '500' },
});
