import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { waterRoot, wasWateredToday } from '@/services/seedService';
import { useTheme, type AppTheme } from '@/lib/theme';
import type { Root } from '@/types';

interface Props {
  root: Root;
  userId: string;
  onWatered: () => void;
}

export function RootCard({ root, userId, onWatered }: Props) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const [watered, setWatered] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    wasWateredToday(root.id, userId).then(setWatered);
  }, [root.id, userId]);

  async function handleWater() {
    if (watered) return;
    setLoading(true);
    try {
      await waterRoot(root.id, userId);
      setWatered(true);
      onWatered();
    } catch {
      Alert.alert('Erro', 'Nao foi possivel regar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const strengthPct = root.strength || 0;

  return (
    <View style={styles.card}>
      <View style={[styles.sideBar, watered && { backgroundColor: colors.success }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{root.name}</Text>
          <View style={[styles.typeBadge, root.type === 'weekly' && styles.typeBadgeWeekly]}>
            <Text style={styles.typeText}>{root.type === 'daily' ? 'DIARIA' : 'SEMANAL'}</Text>
          </View>
        </View>
        {root.description ? <Text style={styles.description}>{root.description}</Text> : null}
        <View style={styles.strengthWrap}>
          <View style={styles.strengthBg}>
            <View style={[styles.strengthFill, { width: `${strengthPct}%` }]} />
          </View>
          <Text style={styles.strengthText}>{strengthPct}%</Text>
        </View>
        <TouchableOpacity
          style={[styles.waterBtn, watered && styles.waterBtnDone]}
          onPress={handleWater}
          disabled={watered || loading}
        >
          <Ionicons
            name={watered ? 'checkmark-circle' : 'water-outline'}
            size={16}
            color={watered ? colors.success : colors.primary}
          />
          <Text style={[styles.waterText, watered && { color: colors.success }]}>
            {watered ? 'Regada hoje' : loading ? 'Regando...' : 'Regar raiz'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(theme: AppTheme) {
  const colors = theme.colors;
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      flexDirection: 'row',
      marginBottom: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    sideBar: { width: 4, backgroundColor: colors.primary },
    content: { flex: 1, padding: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 10 },
    name: { fontSize: 15, fontWeight: '800', color: colors.text, flex: 1 },
    typeBadge: { backgroundColor: colors.primarySoft, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: colors.border },
    typeBadgeWeekly: { backgroundColor: colors.accentSoft },
    typeText: { fontSize: 7, letterSpacing: 2, color: colors.primary, fontWeight: '800' },
    description: { fontSize: 13, color: colors.muted, marginBottom: 12, lineHeight: 18 },
    strengthWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    strengthBg: { flex: 1, height: 4, backgroundColor: colors.backgroundAlt, borderRadius: 100 },
    strengthFill: { height: 4, backgroundColor: colors.success, borderRadius: 100 },
    strengthText: { fontSize: 10, color: colors.muted, width: 34, textAlign: 'right' },
    waterBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: 100, paddingVertical: 9, paddingHorizontal: 14, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.primarySoft },
    waterBtnDone: { borderColor: colors.success, backgroundColor: colors.successSoft },
    waterText: { fontSize: 12, color: colors.primary, fontWeight: '800', letterSpacing: 0.8 },
  });
}
