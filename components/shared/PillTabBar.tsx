import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type AppTheme } from '@/lib/theme';

export interface PillTab<T extends string> {
  id: T;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface Props<T extends string> {
  active: T;
  onSelect: (id: T) => void;
  tabs: PillTab<T>[];
}

export default function PillTabBar<T extends string>({ active, onSelect, tabs }: Props<T>) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;

  return (
    <View style={styles.wrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <TouchableOpacity key={tab.id} onPress={() => onSelect(tab.id)} style={[styles.tab, isActive && styles.tabActive]} activeOpacity={0.7}>
              <Ionicons name={tab.icon} size={15} color={isActive ? colors.primary : colors.muted} />
              <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.border} />
    </View>
  );
}

function makeStyles(theme: AppTheme) {
  const colors = theme.colors;
  return StyleSheet.create({
    wrapper: { backgroundColor: colors.background, paddingTop: 12 },
    row: { flexDirection: 'row', gap: 6, paddingBottom: 8 },
    tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 13, borderRadius: 100, borderWidth: 1, borderColor: 'transparent' },
    tabActive: { backgroundColor: colors.primarySoft, borderColor: colors.border },
    label: { fontSize: 11, letterSpacing: 0.8, color: colors.muted, fontWeight: '700' },
    labelActive: { color: colors.primary, fontWeight: '800' },
    border: { height: 1, backgroundColor: colors.border },
  });
}
