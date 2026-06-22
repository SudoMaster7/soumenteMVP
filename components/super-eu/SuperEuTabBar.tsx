import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SE_TABS } from '@/constants/supereu';
import { useTheme, type AppTheme } from '@/lib/theme';
import type { SuperEuModule } from '@/types/supereu';

interface Props {
  active: SuperEuModule;
  onSelect: (tab: SuperEuModule) => void;
}

const ICONS: Record<SuperEuModule, keyof typeof Ionicons.glyphMap> = {
  oracle: 'compass-outline',
  mentor: 'chatbubbles-outline',
  rituais: 'flame-outline',
  objetivos: 'flag-outline',
  plano: 'map-outline',
  financas: 'wallet-outline',
  grimorio: 'book-outline',
};

export default function SuperEuTabBar({ active, onSelect }: Props) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;

  return (
    <View style={styles.wrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {SE_TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <TouchableOpacity key={tab.id} onPress={() => onSelect(tab.id)} style={[styles.tab, isActive && styles.tabActive]} activeOpacity={0.7}>
              <Ionicons name={ICONS[tab.id]} size={15} color={isActive ? colors.primary : colors.muted} />
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
    row: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, paddingBottom: 8 },
    tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 13, borderRadius: 100, borderWidth: 1, borderColor: 'transparent' },
    tabActive: { backgroundColor: colors.primarySoft, borderColor: colors.border },
    label: { fontSize: 11, letterSpacing: 0.8, color: colors.muted, fontWeight: '700' },
    labelActive: { color: colors.primary, fontWeight: '800' },
    border: { height: 1, backgroundColor: colors.border },
  });
}
