import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DIFFICULTY_OPTIONS, DIFFICULTY_TONE_BG, DIFFICULTY_TONE_FG } from '@/constants/treino';
import { useTheme, type AppTheme } from '@/lib/theme';
import type { Difficulty } from '@/types/treino';

interface Props {
  label?: string;
  value: Difficulty;
  onChange: (value: Difficulty) => void;
}

export default function DifficultyPicker({ label = 'Dificuldade', value, onChange }: Props) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        {DIFFICULTY_OPTIONS.map((option) => {
          const active = option.id === value;
          const fg = colors[DIFFICULTY_TONE_FG[option.id]];
          const bg = colors[DIFFICULTY_TONE_BG[option.id]];
          return (
            <TouchableOpacity
              key={option.id}
              onPress={() => onChange(option.id)}
              style={[styles.btn, { borderColor: active ? fg : colors.border, backgroundColor: active ? bg : colors.surfaceElevated }]}
              accessibilityRole="button"
              accessibilityLabel={`Dificuldade ${option.label}`}
            >
              <Ionicons name={option.icon} size={16} color={active ? fg : colors.muted} />
              <Text style={[styles.btnText, { color: active ? fg : colors.muted }]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(theme: AppTheme) {
  const colors = theme.colors;
  return StyleSheet.create({
    wrap: { marginBottom: 4 },
    label: { fontSize: 10, letterSpacing: 1, color: colors.muted, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' },
    row: { flexDirection: 'row', gap: 8 },
    btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingVertical: 10 },
    btnText: { fontSize: 12, fontWeight: '800' },
  });
}
