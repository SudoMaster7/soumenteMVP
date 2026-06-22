import { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SuperEuTabBar from '@/components/super-eu/SuperEuTabBar';
import OracleModule from '@/components/super-eu/OracleModule';
import MentorModule from '@/components/super-eu/MentorModule';
import PadroesModule from '@/components/super-eu/PadroesModule';
import RituaisModule from '@/components/super-eu/RituaisModule';
import ObjetivosModule from '@/components/super-eu/ObjetivosModule';
import PlanoModule from '@/components/super-eu/PlanoModule';
import FinancasModule from '@/components/super-eu/FinancasModule';
import GrimorioModule from '@/components/super-eu/GrimorioModule';
import { SE_TABS } from '@/constants/supereu';
import { useTheme, type AppTheme } from '@/lib/theme';
import { useSuperEuStore } from '@/stores/superEuStore';
import type { SuperEuModule } from '@/types/supereu';

const MODULE_MAP: Record<SuperEuModule, React.ComponentType> = {
  oracle: OracleModule,
  mentor: MentorModule,
  padroes: PadroesModule,
  rituais: RituaisModule,
  objetivos: ObjetivosModule,
  plano: PlanoModule,
  financas: FinancasModule,
  grimorio: GrimorioModule,
};

export default function SuperEuScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const visibleModules = useSuperEuStore((state) => state.visibleModules);
  const [activeModule, setActiveModule] = useState<SuperEuModule>('oracle');
  const visibleTabs = useMemo(
    () => SE_TABS.filter((tab) => visibleModules.includes(tab.id)),
    [visibleModules]
  );
  const firstVisibleModule = visibleTabs[0]?.id ?? 'oracle';
  const safeActiveModule = visibleModules.includes(activeModule) ? activeModule : firstVisibleModule;
  const ActiveModule = MODULE_MAP[safeActiveModule];

  useEffect(() => {
    if (!visibleModules.includes(activeModule)) {
      setActiveModule(firstVisibleModule);
    }
  }, [activeModule, firstVisibleModule, visibleModules]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SuperEuTabBar active={safeActiveModule} onSelect={setActiveModule} tabs={visibleTabs} />
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
