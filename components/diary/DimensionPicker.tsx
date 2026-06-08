import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DIMENSIONS } from '@/constants/emotions';
import type { DimensionType } from '@/types';

interface Props {
  selected: DimensionType | null;
  onSelect: (dim: DimensionType) => void;
}

export function DimensionPicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {DIMENSIONS.map((dim) => {
        const isSelected = selected === dim.id;
        return (
          <TouchableOpacity
            key={dim.id}
            style={[styles.btn, isSelected && styles.btnSelected]}
            onPress={() => onSelect(dim.id as DimensionType)}
          >
            <Text style={styles.icon}>{dim.icon}</Text>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {dim.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1,
    backgroundColor: '#1C1915',
    borderWidth: 1,
    borderColor: '#2A2420',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  btnSelected: { borderColor: '#C4A882', backgroundColor: 'rgba(196,168,130,0.08)' },
  icon: { fontSize: 18 },
  label: { fontSize: 9, color: '#6A6258', textAlign: 'center', letterSpacing: 0.5 },
  labelSelected: { color: '#C4A882' },
});
