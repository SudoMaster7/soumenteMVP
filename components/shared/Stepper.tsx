import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type AppTheme } from '@/lib/theme';

interface Props {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
}

function roundToStep(value: number, step: number) {
  const precision = step < 1 ? 1 : 0;
  return Number((Math.round(value / step) * step).toFixed(precision));
}

export default function Stepper({ label, value, onChange, step = 1, min = 0, max = 999, unit }: Props) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;

  function decrement() {
    onChange(Math.max(min, roundToStep(value - step, step)));
  }

  function increment() {
    onChange(Math.min(max, roundToStep(value + step, step)));
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.btn, value <= min && styles.btnDisabled]}
          onPress={decrement}
          disabled={value <= min}
          accessibilityRole="button"
          accessibilityLabel={`Diminuir ${label}`}
        >
          <Ionicons name="remove" size={18} color={value <= min ? colors.subtle : colors.text} />
        </TouchableOpacity>
        <Text style={styles.value} numberOfLines={1}>
          {value}{unit ? <Text style={styles.unit}> {unit}</Text> : null}
        </Text>
        <TouchableOpacity
          style={[styles.btn, value >= max && styles.btnDisabled]}
          onPress={increment}
          disabled={value >= max}
          accessibilityRole="button"
          accessibilityLabel={`Aumentar ${label}`}
        >
          <Ionicons name="add" size={18} color={value >= max ? colors.subtle : colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(theme: AppTheme) {
  const colors = theme.colors;
  return StyleSheet.create({
    wrap: { flex: 1, minWidth: 100 },
    label: { fontSize: 10, letterSpacing: 1, color: colors.muted, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    btn: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
    btnDisabled: { opacity: 0.4 },
    value: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: colors.text },
    unit: { fontSize: 11, fontWeight: '700', color: colors.muted },
  });
}
