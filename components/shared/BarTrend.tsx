import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme, type AppTheme } from '@/lib/theme';

export interface BarTrendPoint {
  label: string;
  value: number;
}

interface Props {
  data: BarTrendPoint[];
  height?: number;
  emptyLabel?: string;
}

export default function BarTrend({ data, height = 120, emptyLabel = 'Sem dados suficientes ainda' }: Props) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;

  if (!data.length) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      </View>
    );
  }

  const maxAbs = Math.max(1, ...data.map((d) => Math.abs(d.value)));

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {data.map((point, index) => {
        const isPositive = point.value >= 0;
        const barHeight = Math.max(2, Math.round((Math.abs(point.value) / maxAbs) * height));
        return (
          <View key={`${point.label}-${index}`} style={styles.column}>
            <View style={[styles.zone, { height }]}>
              <View style={styles.zoneUpper}>
                {isPositive && (
                  <View style={[styles.bar, { height: barHeight, backgroundColor: colors.success }]} />
                )}
              </View>
              <View style={styles.zeroLine} />
              <View style={styles.zoneLower}>
                {!isPositive && (
                  <View style={[styles.bar, { height: barHeight, backgroundColor: colors.danger }]} />
                )}
              </View>
            </View>
            <Text style={styles.value} numberOfLines={1}>{Math.round(point.value)}</Text>
            <Text style={styles.label} numberOfLines={1}>{point.label}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

function makeStyles(theme: AppTheme) {
  const colors = theme.colors;
  return StyleSheet.create({
    empty: { alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontSize: 12, color: colors.subtle },
    row: { flexDirection: 'row', alignItems: 'flex-end', gap: 14, paddingVertical: 4 },
    column: { alignItems: 'center', width: 44 },
    zone: { width: 20, justifyContent: 'center' },
    zoneUpper: { flex: 1, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
    zoneLower: { flex: 1, justifyContent: 'flex-start', width: '100%', alignItems: 'center' },
    zeroLine: { height: 1, width: '100%', backgroundColor: colors.border },
    bar: { width: 14, borderRadius: 4 },
    value: { fontSize: 10, color: colors.text, fontWeight: '700', marginTop: 6 },
    label: { fontSize: 9, color: colors.subtle, marginTop: 2 },
  });
}
