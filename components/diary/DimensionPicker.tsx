import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DIMENSIONS } from '@/constants/emotions';
import { useTheme, type AppTheme } from '@/lib/theme';
import type { DimensionType } from '@/types';

interface Props {
  selected: DimensionType | null;
  onSelect: (dim: DimensionType) => void;
}

export function DimensionPicker({ selected, onSelect }: Props) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;

  return (
    <View style={styles.row}>
      {DIMENSIONS.map((dim) => {
        const isSelected = selected === dim.id;
        return (
          <TouchableOpacity
            key={dim.id}
            style={[styles.btn, isSelected && { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}
            onPress={() => onSelect(dim.id as DimensionType)}
          >
            <Text style={styles.icon}>{dim.icon}</Text>
            <Text style={[styles.label, isSelected && { color: colors.primary }]}>{dim.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function makeStyles(theme: AppTheme) {
  const colors = theme.colors;
  return StyleSheet.create({
    row: { flexDirection: 'row', gap: 8 },
    btn: { flex: 1, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, alignItems: 'center', gap: 4, minHeight: 70 },
    icon: { fontSize: 18 },
    label: { fontSize: 9, color: colors.muted, textAlign: 'center', letterSpacing: 0.3, fontWeight: '700' },
  });
}
