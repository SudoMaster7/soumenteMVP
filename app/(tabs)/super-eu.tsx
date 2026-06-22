import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SuperEuTabBar from '@/components/super-eu/SuperEuTabBar';
import OracleModule from '@/components/super-eu/OracleModule';
import MentorModule from '@/components/super-eu/MentorModule';
import RituaisModule from '@/components/super-eu/RituaisModule';
import ObjetivosModule from '@/components/super-eu/ObjetivosModule';
import PlanoModule from '@/components/super-eu/PlanoModule';
import FinancasModule from '@/components/super-eu/FinancasModule';
import GrimorioModule from '@/components/super-eu/GrimorioModule';
import { useTheme, type AppTheme } from '@/lib/theme';
import type { SuperEuModule } from '@/types/supereu';

const MODULE_MAP: Record<SuperEuModule, React.ComponentType> = {
  oracle: OracleModule,
  mentor: MentorModule,
  rituais: RituaisModule,
  objetivos: ObjetivosModule,
  plano: PlanoModule,
  financas: FinancasModule,
  grimorio: GrimorioModule,
};

export default function SuperEuScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const [activeModule, setActiveModule] = useState<SuperEuModule>('oracle');
  const ActiveModule = MODULE_MAP[activeModule];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SuperEuTabBar active={activeModule} onSelect={setActiveModule} />
      <View style={styles.content}>
        <ActiveModule />
      </View>
    </SafeAreaView>
  );
}

function makeStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { flex: 1, backgroundColor: theme.colors.background },
  });
}
