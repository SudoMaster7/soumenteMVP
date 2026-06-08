import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { waterRoot, wasWateredToday } from '@/services/seedService';
import type { Root } from '@/types';

interface Props {
  root: Root;
  userId: string;
  onWatered: () => void;
}

export function RootCard({ root, userId, onWatered }: Props) {
  const [watered, setWatered] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    wasWateredToday(root.id, userId).then(setWatered);
  }, [root.id]);

  async function handleWater() {
    if (watered) return;
    setLoading(true);
    try {
      await waterRoot(root.id, userId);
      setWatered(true);
      onWatered();
    } catch {
      Alert.alert('Erro', 'Não foi possível regar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const strengthPct = root.strength || 0;

  return (
    <View style={styles.card}>
      <View style={[styles.sideBar, watered && styles.sideBarWatered]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{root.name}</Text>
          <View style={[styles.typeBadge, root.type === 'weekly' && styles.typeBadgeWeekly]}>
            <Text style={styles.typeText}>
              {root.type === 'daily' ? 'DIÁRIA' : 'SEMANAL'}
            </Text>
          </View>
        </View>
        {root.description && (
          <Text style={styles.description}>{root.description}</Text>
        )}
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
          <Text style={[styles.waterText, watered && styles.waterTextDone]}>
            {watered ? '✓ Regada hoje' : loading ? 'Regando...' : '💧 Regar'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1C1915',
    borderRadius: 16,
    flexDirection: 'row',
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2420',
  },
  sideBar: { width: 4, backgroundColor: '#2A2420' },
  sideBarWatered: { backgroundColor: '#4A7A5A' },
  content: { flex: 1, padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: { fontSize: 15, fontWeight: 'bold', color: '#F0E8D8', flex: 1 },
  typeBadge: {
    backgroundColor: 'rgba(196,168,130,0.1)',
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(196,168,130,0.2)',
  },
  typeBadgeWeekly: {
    backgroundColor: 'rgba(58,90,122,0.15)',
    borderColor: 'rgba(58,90,122,0.3)',
  },
  typeText: { fontSize: 7, letterSpacing: 2, color: '#C4A882', fontWeight: 'bold' },
  description: {
    fontSize: 13,
    color: '#6A6258',
    marginBottom: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  strengthWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  strengthBg: { flex: 1, height: 3, backgroundColor: '#2A2420', borderRadius: 100 },
  strengthFill: { height: 3, backgroundColor: '#C4A882', borderRadius: 100 },
  strengthText: { fontSize: 10, color: '#6A6258', width: 32, textAlign: 'right' },
  waterBtn: {
    borderWidth: 1,
    borderColor: '#C4A882',
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  waterBtnDone: { borderColor: '#4A7A5A', backgroundColor: 'rgba(74,122,90,0.1)' },
  waterText: { fontSize: 12, color: '#C4A882', fontWeight: 'bold', letterSpacing: 1 },
  waterTextDone: { color: '#4A7A5A' },
});
