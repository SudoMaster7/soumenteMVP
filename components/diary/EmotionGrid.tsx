import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EMOTIONS } from '@/constants/emotions';
import { useTheme, type AppTheme } from '@/lib/theme';
import type { EmotionType } from '@/types';

interface Props {
  selected: EmotionType | null;
  onSelect: (emotion: EmotionType) => void;
}

export function EmotionGrid({ selected, onSelect }: Props) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  return (
    <View style={styles.grid}>
      {EMOTIONS.map((emotion) => {
        const isSelected = selected === emotion.id;
        return (
          <TouchableOpacity
            key={emotion.id}
            style={[styles.card, isSelected && { borderColor: emotion.color, backgroundColor: `${emotion.color}18` }]}
            onPress={() => onSelect(emotion.id as EmotionType)}
          >
            <Text style={styles.emoji}>{emotion.emoji}</Text>
            <Text style={[styles.label, isSelected && { color: emotion.color }]}>{emotion.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function makeStyles(theme: AppTheme) {
  const colors = theme.colors;
  return StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    card: { width: '30%', backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, alignItems: 'center', gap: 6, minHeight: 84 },
    emoji: { fontSize: 24 },
    label: { fontSize: 11, color: colors.muted, textAlign: 'center', fontWeight: '700' },
  });
}
