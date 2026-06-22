import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Platform,
} from 'react-native';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSeed } from '@/hooks/useSeed';
import { RootCard } from '@/components/seed/RootCard';
import { SeedStatus } from '@/components/seed/SeedStatus';
import { deleteSeed } from '@/services/seedService';
import { useTheme, type AppTheme } from '@/lib/theme';

export default function Garden() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const { seed, loading, refetch, userId } = useSeed();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { refetch(); }, []));

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
      Alert.alert('Erro', 'Nao foi possivel excluir a semente. Tente novamente.');
    }
  }

  function confirmDeleteSeed() {
    if (Platform.OS === 'web') {
      if (window.confirm('Excluir esta semente e todo o progresso dela?')) handleDeleteSeed();
      return;
    }

    Alert.alert('Excluir semente', 'Esta acao remove a semente e todo o progresso dela.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: handleDeleteSeed },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!seed) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIcon}>
          <Ionicons name="leaf-outline" size={44} color={colors.success} />
        </View>
        <Text style={styles.emptyTitle}>Comece com uma semente.</Text>
        <Text style={styles.emptySubtitle}>Escolha um objetivo importante. O app transforma isso em pequenas acoes que voce consegue cumprir.</Text>
        <TouchableOpacity style={styles.plantBtn} onPress={() => router.push('/seed/create')}>
          <Ionicons name="add-circle" size={18} color={colors.primaryText} />
          <Text style={styles.plantBtnText}>Plantar semente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const roots = seed.roots || [];
  const avgStrength = roots.length > 0
    ? Math.round(roots.reduce((acc, r) => acc + (r.strength || 0), 0) / roots.length)
    : 0;
  const nextStep = avgStrength === 0 ? 'Regue a primeira raiz hoje.' : avgStrength < 50 ? 'Continue: consistencia vence intensidade.' : 'Sua semente ja esta ganhando corpo.';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>MEU JARDIM</Text>
          <Text style={styles.title}>Cultive o que importa.</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/seed/create')}>
          <Ionicons name="add" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <SeedStatus status={seed.status as any} name={seed.name} />

      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>FORCA DAS RAIZES</Text>
          <Text style={styles.progressPct}>{avgStrength}%</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${avgStrength}%` }]} />
        </View>
        <Text style={styles.progressHint}>{nextStep}</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.editBtn} onPress={() => router.push({ pathname: '/seed/edit', params: { seedId: seed.id } })}>
          <Ionicons name="create-outline" size={16} color={colors.primaryText} />
          <Text style={styles.editBtnText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={confirmDeleteSeed}>
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
          <Text style={styles.deleteBtnText}>Excluir</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>RAIZES ATIVAS</Text>
      {roots.map(root => <RootCard key={root.id} root={root} userId={userId} onWatered={refetch} />)}

      {seed.why ? (
        <View style={styles.whyCard}>
          <Text style={styles.whyLabel}>POR QUE ISSO IMPORTA</Text>
          <Text style={styles.whyText}>"{seed.why}"</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function makeStyles(theme: AppTheme) {
  const colors = theme.colors;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 24, paddingTop: 58, paddingBottom: 40 },
    center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 },
    headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 10 },
    eyebrow: { fontSize: 9, letterSpacing: 4, color: colors.primary, fontWeight: '800', marginBottom: 8 },
    title: { fontSize: 31, fontWeight: '800', color: colors.text, lineHeight: 36 },
    iconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    emptyIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.successSoft, borderWidth: 1, borderColor: colors.border, marginBottom: 22 },
    emptyTitle: { fontSize: 25, fontWeight: '800', color: colors.text, marginBottom: 12, textAlign: 'center' },
    emptySubtitle: { fontSize: 15, color: colors.muted, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
    plantBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 8 },
    plantBtnText: { color: colors.primaryText, fontSize: 14, fontWeight: '800', letterSpacing: 1 },
    actionRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    editBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 12, padding: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
    editBtnText: { color: colors.primaryText, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
    deleteBtn: { flex: 1, borderWidth: 1, borderColor: colors.danger, backgroundColor: colors.dangerSoft, borderRadius: 12, padding: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
    deleteBtnText: { color: colors.danger, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
    progressCard: { backgroundColor: colors.surface, borderRadius: 10, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    progressLabel: { fontSize: 9, letterSpacing: 3, color: colors.muted, fontWeight: '800' },
    progressPct: { fontSize: 15, color: colors.success, fontWeight: '800' },
    progressBg: { height: 5, backgroundColor: colors.backgroundAlt, borderRadius: 100 },
    progressFill: { height: 5, backgroundColor: colors.success, borderRadius: 100 },
    progressHint: { fontSize: 13, color: colors.muted, marginTop: 10, lineHeight: 19 },
    sectionLabel: { fontSize: 9, letterSpacing: 3, color: colors.muted, fontWeight: '800', marginBottom: 12 },
    whyCard: { backgroundColor: colors.surface, borderRadius: 10, padding: 20, marginTop: 8, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
    whyLabel: { fontSize: 9, letterSpacing: 3, color: colors.primary, fontWeight: '800', marginBottom: 10 },
    whyText: { fontSize: 16, color: colors.text, fontStyle: 'italic', lineHeight: 24 },
  });
}
