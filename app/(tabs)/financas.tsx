import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PillTabBar from '@/components/shared/PillTabBar';
import FinancasPanel from '@/components/financas/FinancasPanel';
import PlanoPanel from '@/components/financas/PlanoPanel';
import { useTheme, type AppTheme } from '@/lib/theme';

type FinancasTab = 'transacoes' | 'plano';

export default function FinancasScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const [tab, setTab] = useState<FinancasTab>('transacoes');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>FINANÇAS</Text>
        <Text style={styles.title}>Seu fluxo material</Text>
      </View>
      <View style={styles.tabBarWrap}>
        <PillTabBar<FinancasTab>
          active={tab}
          onSelect={setTab}
          tabs={[
            { id: 'transacoes', label: 'Transações', icon: 'receipt-outline' },
            { id: 'plano', label: 'Plano', icon: 'map-outline' },
          ]}
        />
      </View>
      {tab === 'transacoes' ? <FinancasPanel /> : <PlanoPanel />}
    </View>
  );
}

function makeStyles(theme: AppTheme) {
  const colors = theme.colors;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 24, paddingTop: 58 },
    tabBarWrap: { paddingHorizontal: 24 },
    eyebrow: { fontSize: 9, letterSpacing: 4, color: colors.primary, fontWeight: '800', marginBottom: 8 },
    title: { fontSize: 28, fontWeight: '800', color: colors.text, lineHeight: 33, marginBottom: 4 },
  });
}
