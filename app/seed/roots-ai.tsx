import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { getCurrentUser } from '@/services/authService';
import { plantSeedWithRoots } from '@/services/seedService';
import { generateRootsWithAI, type GeneratedRootSuggestion } from '@/services/oracleService';
import { useTheme, type AppTheme } from '@/lib/theme';
import type { RootType } from '@/types';

const ROOT_TYPES: { value: RootType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'daily', label: 'Diária', icon: 'sunny-outline' },
  { value: 'weekly', label: 'Semanal', icon: 'calendar-outline' },
  { value: 'milestone', label: 'Marco', icon: 'flag-outline' },
];

function emptyRoot(): GeneratedRootSuggestion {
  return {
    name: '',
    description: '',
    type: 'daily',
    frequency: 1,
  };
}

function parseAnswers(raw?: string) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function paramText(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default function RootsAI() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const { seedId, seedName, seedType, seedWhy, seedForWhom, answersJson } = useLocalSearchParams<{
    seedId: string;
    seedName: string;
    seedType?: string;
    seedWhy?: string;
    seedForWhom?: string;
    answersJson?: string;
  }>();
  const [roots, setRoots] = useState<GeneratedRootSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const generationRef = useRef(0);
  const currentSeedId = paramText(seedId);
  const currentSeedName = paramText(seedName) || 'Nova semente';
  const answers = parseAnswers(paramText(answersJson));

  async function loadRoots() {
    generationRef.current += 1;
    setLoading(true);
    try {
      const result = await generateRootsWithAI({
        seedName: currentSeedName,
        seedType: paramText(seedType),
        seedWhy: paramText(seedWhy),
        seedForWhom: paramText(seedForWhom),
        answers,
        variant: generationRef.current,
      });
      setRoots(result);
    } catch (error) {
      console.error('Failed to generate roots', error);
      Alert.alert('Erro', 'Não foi possível gerar raízes agora.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateRoot(index: number, patch: Partial<GeneratedRootSuggestion>) {
    setRoots(current => current.map((root, i) => (i === index ? { ...root, ...patch } : root)));
  }

  function removeRoot(index: number) {
    setRoots(current => current.filter((_, i) => i !== index));
  }

  function addRoot() {
    setRoots(current => [...current, emptyRoot()]);
  }

  async function handleConfirm() {
    if (!currentSeedId) return;
    const validRoots = roots.filter(root => root.name.trim().length > 0);
    if (validRoots.length === 0) {
      Alert.alert('Crie pelo menos uma raiz para continuar.');
      return;
    }

    setSaving(true);
    try {
      const user = await getCurrentUser();
      if (!user) return;
      await plantSeedWithRoots(currentSeedId, user.id, answers, validRoots.map(root => ({
        name: root.name.trim(),
        description: root.description.trim() || undefined,
        type: root.type,
        frequency: Math.max(1, Number(root.frequency) || 1),
      })));
      router.replace({
        pathname: '/seed/planted',
        params: {
          seedId: currentSeedId,
          seedName: currentSeedName,
          rootsJson: JSON.stringify(validRoots.map(root => root.name)),
        },
      });
    } catch (error) {
      console.error('Failed to create generated roots', error);
      Alert.alert('Erro', 'Não foi possível salvar as raízes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={18} color={colors.muted} />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>RAÍZES SUGERIDAS</Text>
        <Text style={styles.title}>Revise antes de plantar.</Text>
        <Text style={styles.subtitle}>A IA sugeriu ações para "{currentSeedName}". Ajuste o que precisar e confirme apenas o que faz sentido.</Text>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Gerando raízes com base nas suas respostas...</Text>
          </View>
        ) : (
          <>
            {roots.map((root, index) => (
              <View key={`${root.name}-${index}`} style={styles.rootCard}>
                <View style={styles.rootHeader}>
                  <Text style={styles.rootNumber}>Raiz {index + 1}</Text>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeRoot(index)}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  value={root.name}
                  onChangeText={(name) => updateRoot(index, { name })}
                  placeholder="Nome da raiz"
                  placeholderTextColor={colors.subtle}
                  style={styles.input}
                />
                <TextInput
                  value={root.description}
                  onChangeText={(description) => updateRoot(index, { description })}
                  placeholder="Descrição curta"
                  placeholderTextColor={colors.subtle}
                  style={[styles.input, styles.textarea]}
                  multiline
                />

                <View style={styles.typeRow}>
                  {ROOT_TYPES.map(option => {
                    const selected = root.type === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[styles.typeOption, selected && styles.typeOptionActive]}
                        onPress={() => updateRoot(index, { type: option.value })}
                      >
                        <Ionicons name={option.icon} size={15} color={selected ? colors.primary : colors.muted} />
                        <Text style={[styles.typeOptionText, selected && { color: colors.primary }]}>{option.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={addRoot}>
                <Ionicons name="add" size={17} color={colors.primary} />
                <Text style={styles.secondaryText}>Adicionar raiz</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={loadRoots}>
                <Ionicons name="refresh" size={17} color={colors.primary} />
                <Text style={styles.secondaryText}>Regerar</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} disabled={saving}>
              {saving ? (
                <ActivityIndicator color={colors.primaryText} />
              ) : (
                <>
                  <Text style={styles.confirmText}>Confirmar e plantar</Text>
                  <Ionicons name="leaf" size={18} color={colors.primaryText} />
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(theme: AppTheme) {
  const colors = theme.colors;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 24, paddingTop: 58, paddingBottom: 48 },
    back: { marginBottom: 28, flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
    backText: { color: colors.muted, fontSize: 14, fontWeight: '700' },
    eyebrow: { fontSize: 9, letterSpacing: 4, color: colors.primary, fontWeight: '800', marginBottom: 8 },
    title: { fontSize: 34, fontWeight: '800', color: colors.text, lineHeight: 40, marginBottom: 10 },
    subtitle: { fontSize: 15, color: colors.muted, lineHeight: 22, marginBottom: 22 },
    loadingCard: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 22, alignItems: 'center', gap: 12 },
    loadingText: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21 },
    rootCard: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 },
    rootHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    rootNumber: { fontSize: 10, color: colors.primary, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
    removeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.danger },
    input: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 13, color: colors.text, fontSize: 14, marginBottom: 10 },
    textarea: { minHeight: 74, textAlignVertical: 'top', lineHeight: 20 },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    typeOption: { flexGrow: 1, minWidth: 94, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundAlt, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
    typeOptionActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    typeOptionText: { color: colors.muted, fontSize: 12, fontWeight: '900' },
    actionGrid: { flexDirection: 'row', gap: 10, marginTop: 6, marginBottom: 14 },
    secondaryBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 12, padding: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
    secondaryText: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 0.8 },
    confirmBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    confirmText: { color: colors.primaryText, fontSize: 14, fontWeight: '900', letterSpacing: 1.2 },
  });
}
