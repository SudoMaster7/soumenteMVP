import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type AppTheme } from '@/lib/theme';
import type { SeedStatus as SeedStatusType } from '@/types';

interface Props {
  status: SeedStatusType;
  name: string;
}

const STATUS_CONFIG: Record<SeedStatusType, { label: string; icon: keyof typeof Ionicons.glyphMap; tone: 'muted' | 'primary' | 'success' | 'warning' | 'accent' }> = {
  seed: { label: 'Semente', icon: 'ellipse-outline', tone: 'muted' },
  planted: { label: 'Plantada', icon: 'leaf-outline', tone: 'primary' },
  growing: { label: 'Crescendo', icon: 'trending-up-outline', tone: 'success' },
  fruiting: { label: 'Frutificando', icon: 'sparkles-outline', tone: 'warning' },
  harvested: { label: 'Colhida', icon: 'checkmark-done-outline', tone: 'accent' },
};

export function SeedStatus({ status, name }: Props) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.seed;
  const color = config.tone === 'success'
    ? colors.success
    : config.tone === 'warning'
      ? colors.warning
      : config.tone === 'accent'
        ? colors.accent
        : config.tone === 'primary'
          ? colors.primary
          : colors.muted;

  return (
    <View style={styles.wrap}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}20`, borderColor: color }]}>
        <Ionicons name={config.icon} size={42} color={color} />
      </View>
      <Text style={styles.name}>{name}</Text>
      <View style={[styles.badge, { borderColor: color, backgroundColor: `${color}12` }]}>
        <Text style={[styles.badgeText, { color }]}>{config.label.toUpperCase()}</Text>
      </View>
    </View>
  );
}

function makeStyles(theme: AppTheme) {
  const colors = theme.colors;
  return StyleSheet.create({
    wrap: { alignItems: 'center', paddingVertical: 28 },
    iconWrap: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 16 },
    name: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 12, textAlign: 'center' },
    badge: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 6 },
    badgeText: { fontSize: 9, letterSpacing: 3, fontWeight: '800' },
  });
}
