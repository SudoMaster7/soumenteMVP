import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Platform,
} from 'react-native';
import { useState, useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { useSeed } from '@/hooks/useSeed';
import { RootCard } from '@/components/seed/RootCard';
import { SeedStatus } from '@/components/seed/SeedStatus';
import { deleteSeed } from '@/services/seedService';

export default function Garden() {
  const { seed, loading, refetch, userId } = useSeed();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => { refetch(); }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  async function handleDeleteSeed() {
    if (!seed || !userId) return;

    try {
      await deleteSeed(seed.id, userId);
      await refetch();
    } catch (error) {
      console.error('Failed to delete seed', error);
      Alert.alert('Erro', 'Não foi possível excluir a semente. Tente novamente.');
    }
  }

  function confirmDeleteSeed() {
    if (Platform.OS === 'web') {
      if (window.confirm('Excluir esta semente e todo o progresso dela?')) {
        handleDeleteSeed();
      }
      return;
    }

    Alert.alert(
      'Excluir semente',
      'Esta ação remove a semente e todo o progresso dela.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: handleDeleteSeed },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#C4A882" size="large" />
      </View>
    );
  }

  if (!seed) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyEmoji}>🫘</Text>
        <Text style={styles.emptyTitle}>Nenhuma semente ainda.</Text>
        <Text style={styles.emptySubtitle}>
          Plante seu primeiro objetivo e{'\n'}veja ele crescer dia a dia.
        </Text>
        <TouchableOpacity
          style={styles.plantBtn}
          onPress={() => router.push('/seed/create')}
        >
          <Text style={styles.plantBtnText}>🌱 Plantar semente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const roots = seed.roots || [];
  const avgStrength = roots.length > 0
    ? Math.round(roots.reduce((acc, r) => acc + (r.strength || 0), 0) / roots.length)
    : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C4A882" />
      }
    >
      <Text style={styles.eyebrow}>MEU JARDIM</Text>

      <SeedStatus status={seed.status as any} name={seed.name} />

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push({ pathname: '/seed/edit', params: { seedId: seed.id } })}
        >
          <Text style={styles.editBtnText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={confirmDeleteSeed}>
          <Text style={styles.deleteBtnText}>Excluir</Text>
        </TouchableOpacity>
      </View>

      {roots.length > 0 && (
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>FORÇA DAS RAÍZES</Text>
            <Text style={styles.progressPct}>{avgStrength}%</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${avgStrength}%` }]} />
          </View>
        </View>
      )}

      <Text style={styles.sectionLabel}>RAÍZES ATIVAS</Text>
      {roots.map(root => (
        <RootCard
          key={root.id}
          root={root}
          userId={userId}
          onWatered={refetch}
        />
      ))}

      {seed.why && (
        <View style={styles.whyCard}>
          <Text style={styles.whyLabel}>POR QUE ISSO IMPORTA</Text>
          <Text style={styles.whyText}>"{seed.why}"</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.newSeedBtn}
        onPress={() => router.push('/seed/create')}
      >
        <Text style={styles.newSeedText}>+ Nova semente</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0906' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: '#0A0906', alignItems: 'center', justifyContent: 'center', padding: 32 },
  eyebrow: { fontSize: 9, letterSpacing: 4, color: '#C4A882', fontWeight: 'bold', marginBottom: 8 },
  emptyEmoji: { fontSize: 64, marginBottom: 24 },
  emptyTitle: { fontSize: 24, fontWeight: 'bold', color: '#F0E8D8', marginBottom: 12, textAlign: 'center' },
  emptySubtitle: { fontSize: 15, color: '#6A6258', fontStyle: 'italic', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  plantBtn: { backgroundColor: '#C4A882', borderRadius: 100, paddingVertical: 14, paddingHorizontal: 32 },
  plantBtnText: { color: '#0A0906', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  editBtn: { flex: 1, backgroundColor: '#C4A882', borderRadius: 100, padding: 13, alignItems: 'center' },
  editBtnText: { color: '#0A0906', fontSize: 12, fontWeight: 'bold', letterSpacing: 2 },
  deleteBtn: { flex: 1, borderWidth: 1, borderColor: '#8B3A2A', borderRadius: 100, padding: 13, alignItems: 'center' },
  deleteBtnText: { color: '#DDB870', fontSize: 12, fontWeight: 'bold', letterSpacing: 2 },
  progressCard: { backgroundColor: '#1C1915', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#2A2420' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontSize: 9, letterSpacing: 3, color: '#6A6258', fontWeight: 'bold' },
  progressPct: { fontSize: 14, color: '#C4A882', fontWeight: 'bold' },
  progressBg: { height: 3, backgroundColor: '#2A2420', borderRadius: 100 },
  progressFill: { height: 3, backgroundColor: '#C4A882', borderRadius: 100 },
  sectionLabel: { fontSize: 9, letterSpacing: 3, color: '#6A6258', fontWeight: 'bold', marginBottom: 12 },
  whyCard: { backgroundColor: '#1C1915', borderRadius: 16, padding: 20, marginTop: 8, marginBottom: 24, borderWidth: 1, borderColor: '#2A2420' },
  whyLabel: { fontSize: 9, letterSpacing: 3, color: '#C4A882', fontWeight: 'bold', marginBottom: 10 },
  whyText: { fontSize: 16, color: '#F0E8D8', fontStyle: 'italic', lineHeight: 24 },
  newSeedBtn: { borderWidth: 1, borderColor: '#2A2420', borderRadius: 100, padding: 14, alignItems: 'center' },
  newSeedText: { color: '#6A6258', fontSize: 13, letterSpacing: 2 },
});
