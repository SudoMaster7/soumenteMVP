import { View, Text, StyleSheet } from 'react-native';
import type { SeedStatus as SeedStatusType } from '@/types';

interface Props {
  status: SeedStatusType;
  name: string;
}

const STATUS_CONFIG = {
  seed:      { label: 'Semente',      emoji: '🫘', color: '#6A6258' },
  planted:   { label: 'Plantada',     emoji: '🌱', color: '#C4A882' },
  growing:   { label: 'Crescendo',    emoji: '🌿', color: '#4A7A5A' },
  fruiting:  { label: 'Frutificando', emoji: '🌳', color: '#DDB870' },
  harvested: { label: 'Colhida',      emoji: '🍎', color: '#8B3A2A' },
};

export function SeedStatus({ status, name }: Props) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.seed;

  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>{config.emoji}</Text>
      <Text style={styles.name}>{name}</Text>
      <View style={[styles.badge, { borderColor: config.color }]}>
        <Text style={[styles.badgeText, { color: config.color }]}>
          {config.label.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 32 },
  emoji: { fontSize: 72, marginBottom: 16 },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F0E8D8',
    marginBottom: 12,
    textAlign: 'center',
  },
  badge: {
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  badgeText: { fontSize: 9, letterSpacing: 3, fontWeight: 'bold' },
});
