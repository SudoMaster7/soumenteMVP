import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Platform, Modal, TextInput,
} from 'react-native';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSeed } from '@/hooks/useSeed';
import { RootCard } from '@/components/seed/RootCard';
import { SeedStatus } from '@/components/seed/SeedStatus';
import { createRoot, deleteRoot, deleteSeed, updateRoot } from '@/services/seedService';
import { useTheme, type AppTheme } from '@/lib/theme';
import type { Root, RootType, Seed } from '@/types';

type RootFormState = {
  id?: string;
  name: string;
  description: string;
  type: RootType;
  frequency: string;
};

const emptyRootForm: RootFormState = {
  name: '',
  description: '',
  type: 'daily',
  frequency: '1',
};

const ROOT_TYPE_OPTIONS: { value: RootType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'daily', label: 'Diária', icon: 'sunny-outline' },
  { value: 'weekly', label: 'Semanal', icon: 'calendar-outline' },
  { value: 'milestone', label: 'Marco', icon: 'flag-outline' },
];

function getSeedProgress(seed: Seed) {
  const roots = seed.roots || [];
  if (roots.length === 0) return 0;
  return Math.round(roots.reduce((acc, root) => acc + (root.strength || 0), 0) / roots.length);
}

function getGardenStage(progress: number) {
  if (progress >= 90) return { icon: 'diamond-outline' as const, title: 'Jardim lendário', subtitle: 'Esta semente virou uma força estável.', next: 'Mantenha o ritmo e colha frutos.' };
  if (progress >= 70) return { icon: 'flower-outline' as const, title: 'Árvore forte', subtitle: 'As raízes estão sustentando progresso real.', next: 'Proteja a consistência.' };
  if (progress >= 40) return { icon: 'leaf' as const, title: 'Crescimento visível', subtitle: 'A semente já mostra sinais claros de vida.', next: 'Regue a raiz mais fraca.' };
  if (progress > 0) return { icon: 'leaf-outline' as const, title: 'Broto em formação', subtitle: 'O primeiro movimento já apareceu.', next: 'Regue uma raiz hoje.' };
  return { icon: 'ellipse-outline' as const, title: 'Solo preparado', subtitle: 'A semente está pronta para receber energia.', next: 'Crie ou regue a primeira raiz.' };
}

function getRootStats(roots: Root[]) {
  const completed = roots.reduce((total, root) => total + (root.completed_count || 0), 0);
  const strong = roots.filter(root => (root.strength || 0) >= 70).length;
  const weak = roots.filter(root => (root.strength || 0) < 40).length;
  return { completed, strong, weak };
}

export default function Garden() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const { seedId: routeSeedId } = useLocalSearchParams<{ seedId?: string }>();
  const { seed, seeds, loading, refetch, userId } = useSeed();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSeedId, setSelectedSeedId] = useState<string | null>(null);
  const [rootModalVisible, setRootModalVisible] = useState(false);
  const [rootForm, setRootForm] = useState<RootFormState>(emptyRootForm);
  const [savingRoot, setSavingRoot] = useState(false);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  useEffect(() => {
    if (seeds.length === 0) {
      setSelectedSeedId(null);
      return;
    }

    if (routeSeedId && seeds.some(current => current.id === routeSeedId)) {
      setSelectedSeedId(routeSeedId);
      return;
    }

    const stillExists = seeds.some(current => current.id === selectedSeedId);
    if (!selectedSeedId || !stillExists) {
      setSelectedSeedId(seed?.id ?? seeds[0].id);
    }
  }, [routeSeedId, seed?.id, seeds, selectedSeedId]);

  const selectedSeed = useMemo(
    () => seeds.find(current => current.id === selectedSeedId) ?? seed ?? seeds[0] ?? null,
    [seed, seeds, selectedSeedId]
  );

  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  async function handleDeleteSeed() {
    if (!selectedSeed || !userId) return;

    try {
      await deleteSeed(selectedSeed.id, userId);
      await refetch();
    } catch (error) {
      console.error('Failed to delete seed', error);
      Alert.alert('Erro', 'Não foi possível excluir a semente. Tente novamente.');
    }
  }

  function confirmDeleteSeed() {
    if (Platform.OS === 'web') {
      if (window.confirm('Excluir esta semente e todo o progresso dela?')) handleDeleteSeed();
      return;
    }

    Alert.alert('Excluir semente', 'Esta ação remove a semente e todo o progresso dela.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: handleDeleteSeed },
    ]);
  }

  function openCreateRoot() {
    setRootForm(emptyRootForm);
    setRootModalVisible(true);
  }

  function openEditRoot(root: Root) {
    setRootForm({
      id: root.id,
      name: root.name,
      description: root.description ?? '',
      type: root.type,
      frequency: String(root.frequency || 1),
    });
    setRootModalVisible(true);
  }

  async function handleSaveRoot() {
    if (!selectedSeed || !userId || !rootForm.name.trim()) {
      Alert.alert('Raiz incompleta', 'Digite um nome para a raiz.');
      return;
    }

    const payload = {
      name: rootForm.name.trim(),
      description: rootForm.description.trim() || undefined,
      type: rootForm.type,
      frequency: Math.max(1, Number(rootForm.frequency) || 1),
    };

    setSavingRoot(true);
    try {
      if (rootForm.id) {
        await updateRoot(rootForm.id, userId, payload);
      } else {
        await createRoot(selectedSeed.id, userId, payload);
      }
      setRootModalVisible(false);
      setRootForm(emptyRootForm);
      await refetch();
    } catch (error) {
      console.error('Failed to save root', error);
      Alert.alert('Erro', 'Não foi possível salvar a raiz.');
    } finally {
      setSavingRoot(false);
    }
  }

  async function handleDeleteRoot(root: Root) {
    if (!userId) return;
    try {
      await deleteRoot(root.id, userId);
      await refetch();
    } catch (error) {
      console.error('Failed to delete root', error);
      Alert.alert('Erro', 'Não foi possível excluir a raiz.');
    }
  }

  function confirmDeleteRoot(root: Root) {
    if (Platform.OS === 'web') {
      if (window.confirm(`Excluir a raiz "${root.name}"?`)) handleDeleteRoot(root);
      return;
    }

    Alert.alert('Excluir raiz', `Remover "${root.name}" e seus registros?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => handleDeleteRoot(root) },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!selectedSeed) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIcon}>
          <Ionicons name="leaf-outline" size={44} color={colors.success} />
        </View>
        <Text style={styles.emptyTitle}>Comece com uma semente.</Text>
        <Text style={styles.emptySubtitle}>Escolha um objetivo importante. O app transforma isso em pequenas ações que você consegue cumprir.</Text>
        <TouchableOpacity style={styles.plantBtn} onPress={() => router.push('/seed/create')}>
          <Ionicons name="add-circle" size={18} color={colors.primaryText} />
          <Text style={styles.plantBtnText}>Plantar semente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const roots = selectedSeed.roots || [];
  const avgStrength = getSeedProgress(selectedSeed);
  const stage = getGardenStage(avgStrength);
  const rootStats = getRootStats(roots);
  const xp = Math.min(999, avgStrength * 5 + rootStats.completed * 20 + rootStats.strong * 50);

  return (
    <>
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
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/seed/create')} accessibilityLabel="Plantar nova semente">
            <Ionicons name="add" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>TODAS AS SEMENTES</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seedList}>
          {seeds.map(current => (
            <SeedPill
              key={current.id}
              seed={current}
              selected={current.id === selectedSeed.id}
              theme={theme}
              onPress={() => setSelectedSeedId(current.id)}
            />
          ))}
        </ScrollView>

        <SeedStatus status={selectedSeed.status as any} name={selectedSeed.name} />

        <View style={styles.stageCard}>
          <View style={styles.stageTop}>
            <View style={styles.stageIcon}>
              <Ionicons name={stage.icon} size={44} color={colors.success} />
            </View>
            <View style={styles.stageCopy}>
              <Text style={styles.stageKicker}>ESTÁGIO DO JARDIM</Text>
              <Text style={styles.stageTitle}>{stage.title}</Text>
              <Text style={styles.stageSubtitle}>{stage.subtitle}</Text>
            </View>
          </View>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>XP {xp}</Text>
            <Text style={styles.progressPct}>{avgStrength}%</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${avgStrength}%` }]} />
          </View>
          <Text style={styles.progressHint}>{stage.next}</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard label="Raízes" value={String(roots.length)} icon="git-branch-outline" theme={theme} />
          <StatCard label="Regas" value={String(rootStats.completed)} icon="water-outline" theme={theme} />
          <StatCard label="Fortes" value={String(rootStats.strong)} icon="shield-checkmark-outline" theme={theme} />
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push({ pathname: '/seed/edit', params: { seedId: selectedSeed.id } })}>
            <Ionicons name="create-outline" size={16} color={colors.primaryText} />
            <Text style={styles.editBtnText}>Editar semente</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={confirmDeleteSeed}>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
            <Text style={styles.deleteBtnText}>Excluir</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rootsHeader}>
          <View>
            <Text style={styles.sectionLabel}>RAÍZES ATIVAS</Text>
            <Text style={styles.rootsHint}>Crie suas próprias ações para ganhar XP e fortalecer a semente.</Text>
          </View>
          <TouchableOpacity style={styles.addRootBtn} onPress={openCreateRoot}>
            <Ionicons name="add" size={18} color={colors.primaryText} />
          </TouchableOpacity>
        </View>

        {roots.length ? (
          roots.map(root => (
            <RootCard
              key={root.id}
              root={root}
              userId={userId}
              onWatered={refetch}
              onEdit={openEditRoot}
              onDelete={confirmDeleteRoot}
            />
          ))
        ) : (
          <TouchableOpacity style={styles.emptyRootsCard} onPress={openCreateRoot}>
            <Ionicons name="git-branch-outline" size={26} color={colors.primary} />
            <Text style={styles.emptyRootsTitle}>Nenhuma raiz ainda</Text>
            <Text style={styles.emptyRootsText}>Crie a primeira ação que vai sustentar essa semente.</Text>
          </TouchableOpacity>
        )}

        {selectedSeed.why ? (
          <View style={styles.whyCard}>
            <Text style={styles.whyLabel}>POR QUE ISSO IMPORTA</Text>
            <Text style={styles.whyText}>"{selectedSeed.why}"</Text>
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={rootModalVisible} transparent animationType="fade" onRequestClose={() => setRootModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>{rootForm.id ? 'EDITAR RAIZ' : 'NOVA RAIZ'}</Text>
                <Text style={styles.modalTitle}>{rootForm.id ? 'Ajustar ação' : 'Criar ação de cultivo'}</Text>
              </View>
              <TouchableOpacity style={styles.modalClose} onPress={() => setRootModalVisible(false)}>
                <Ionicons name="close" size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <TextInput
              value={rootForm.name}
              onChangeText={(name) => setRootForm(current => ({ ...current, name }))}
              placeholder="Nome da raiz"
              placeholderTextColor={colors.subtle}
              style={styles.input}
            />
            <TextInput
              value={rootForm.description}
              onChangeText={(description) => setRootForm(current => ({ ...current, description }))}
              placeholder="Descrição ou motivo"
              placeholderTextColor={colors.subtle}
              style={[styles.input, styles.textarea]}
              multiline
            />

            <Text style={styles.inputLabel}>Tipo</Text>
            <View style={styles.typeRow}>
              {ROOT_TYPE_OPTIONS.map(option => {
                const selected = rootForm.type === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.typeOption, selected && styles.typeOptionActive]}
                    onPress={() => setRootForm(current => ({ ...current, type: option.value }))}
                  >
                    <Ionicons name={option.icon} size={16} color={selected ? colors.primary : colors.muted} />
                    <Text style={[styles.typeOptionText, selected && { color: colors.primary }]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              value={rootForm.frequency}
              onChangeText={(frequency) => setRootForm(current => ({ ...current, frequency }))}
              placeholder="Frequência"
              placeholderTextColor={colors.subtle}
              style={styles.input}
              keyboardType="numeric"
            />

            <TouchableOpacity style={styles.saveRootBtn} onPress={handleSaveRoot} disabled={savingRoot}>
              {savingRoot ? (
                <ActivityIndicator color={colors.primaryText} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color={colors.primaryText} />
                  <Text style={styles.saveRootText}>{rootForm.id ? 'Salvar raiz' : 'Criar raiz'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

function SeedPill({
  seed,
  selected,
  theme,
  onPress,
}: {
  seed: Seed;
  selected: boolean;
  theme: AppTheme;
  onPress: () => void;
}) {
  const colors = theme.colors;
  const styles = makeStyles(theme);
  const progress = getSeedProgress(seed);
  const stage = getGardenStage(progress);
  return (
    <TouchableOpacity
      style={[
        styles.seedPill,
        selected && { borderColor: colors.primary, backgroundColor: colors.primarySoft },
      ]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={styles.seedPillHeader}>
        <Ionicons name={stage.icon} size={17} color={selected ? colors.primary : colors.muted} />
        <Text style={[styles.seedPillTitle, selected && { color: colors.primary }]} numberOfLines={1}>{seed.name}</Text>
      </View>
      <View style={styles.seedPillTrack}>
        <View style={[styles.seedPillFill, { width: `${progress}%`, backgroundColor: selected ? colors.primary : colors.success }]} />
      </View>
      <Text style={styles.seedPillMeta}>{stage.title} · {progress}%</Text>
    </TouchableOpacity>
  );
}

function StatCard({ label, value, icon, theme }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; theme: AppTheme }) {
  const styles = makeStyles(theme);
  const colors = theme.colors;
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={17} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
    seedList: { gap: 10, paddingBottom: 14 },
    seedPill: { width: 188, minHeight: 88, backgroundColor: colors.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.border, justifyContent: 'space-between' },
    seedPillHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    seedPillTitle: { flex: 1, fontSize: 13, color: colors.text, fontWeight: '800' },
    seedPillTrack: { height: 4, backgroundColor: colors.backgroundAlt, borderRadius: 99, overflow: 'hidden', marginBottom: 7 },
    seedPillFill: { height: 4, borderRadius: 99 },
    seedPillMeta: { fontSize: 11, color: colors.muted },
    stageCard: { backgroundColor: colors.surface, borderRadius: 10, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    stageTop: { flexDirection: 'row', gap: 14, marginBottom: 14, alignItems: 'center' },
    stageIcon: { width: 82, height: 82, borderRadius: 18, backgroundColor: colors.successSoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    stageCopy: { flex: 1 },
    stageKicker: { fontSize: 9, letterSpacing: 2.6, color: colors.primary, fontWeight: '900', marginBottom: 5 },
    stageTitle: { fontSize: 22, color: colors.text, fontWeight: '900', lineHeight: 27, marginBottom: 4 },
    stageSubtitle: { fontSize: 13, color: colors.muted, lineHeight: 19 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    progressLabel: { fontSize: 10, letterSpacing: 2, color: colors.primary, fontWeight: '900' },
    progressPct: { fontSize: 15, color: colors.success, fontWeight: '900' },
    progressBg: { height: 7, backgroundColor: colors.backgroundAlt, borderRadius: 100, overflow: 'hidden' },
    progressFill: { height: 7, backgroundColor: colors.success, borderRadius: 100 },
    progressHint: { fontSize: 13, color: colors.muted, marginTop: 10, lineHeight: 19 },
    statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 14 },
    statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 12, minHeight: 82 },
    statValue: { fontSize: 19, color: colors.text, fontWeight: '900', marginTop: 7 },
    statLabel: { fontSize: 10, color: colors.muted, fontWeight: '900', textTransform: 'uppercase', marginTop: 2 },
    actionRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    editBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 12, padding: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
    editBtnText: { color: colors.primaryText, fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
    deleteBtn: { flex: 1, borderWidth: 1, borderColor: colors.danger, backgroundColor: colors.dangerSoft, borderRadius: 12, padding: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
    deleteBtnText: { color: colors.danger, fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
    rootsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 12 },
    sectionLabel: { fontSize: 9, letterSpacing: 3, color: colors.muted, fontWeight: '800', marginBottom: 5 },
    rootsHint: { fontSize: 12, color: colors.subtle, lineHeight: 17, maxWidth: 260 },
    addRootBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    emptyRootsCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 18, alignItems: 'center', marginBottom: 16 },
    emptyRootsTitle: { fontSize: 16, color: colors.text, fontWeight: '900', marginTop: 10, marginBottom: 5 },
    emptyRootsText: { fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 19 },
    whyCard: { backgroundColor: colors.surface, borderRadius: 10, padding: 20, marginTop: 8, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
    whyLabel: { fontSize: 9, letterSpacing: 3, color: colors.primary, fontWeight: '800', marginBottom: 10 },
    whyText: { fontSize: 16, color: colors.text, fontStyle: 'italic', lineHeight: 24 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 20 },
    modalCard: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 18 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 14 },
    modalKicker: { fontSize: 9, color: colors.primary, fontWeight: '900', letterSpacing: 2.5, marginBottom: 5 },
    modalTitle: { fontSize: 20, color: colors.text, fontWeight: '900' },
    modalClose: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundAlt, borderRadius: 10, paddingHorizontal: 13, minHeight: 46, color: colors.text, fontSize: 14, marginBottom: 10 },
    textarea: { minHeight: 76, paddingTop: 12, textAlignVertical: 'top' },
    inputLabel: { fontSize: 11, color: colors.muted, fontWeight: '900', textTransform: 'uppercase', marginBottom: 8 },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    typeOption: { flexGrow: 1, minWidth: 98, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundAlt, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
    typeOptionActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    typeOptionText: { color: colors.muted, fontSize: 12, fontWeight: '900' },
    saveRootBtn: { backgroundColor: colors.primary, borderRadius: 10, minHeight: 48, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 4 },
    saveRootText: { color: colors.primaryText, fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  });
}
