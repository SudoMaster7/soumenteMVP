import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getCurrentUser } from '@/services/authService';
import { createSeed } from '@/services/seedService';
import { useTheme, type AppTheme } from '@/lib/theme';
import type { SeedType } from '@/types';

const SEED_TYPES: { id: SeedType; label: string; icon: keyof typeof Ionicons.glyphMap; hint: string }[] = [
  { id: 'dream', label: 'Sonho', icon: 'sparkles-outline', hint: 'Algo que te chama' },
  { id: 'career', label: 'Carreira', icon: 'briefcase-outline', hint: 'Trabalho e direcao' },
  { id: 'health', label: 'Saude', icon: 'fitness-outline', hint: 'Corpo e energia' },
  { id: 'relationship', label: 'Relacoes', icon: 'heart-outline', hint: 'Vinculos e cuidado' },
  { id: 'finance', label: 'Finanças', icon: 'wallet-outline', hint: 'Dinheiro e escolhas' },
  { id: 'custom', label: 'Outro', icon: 'leaf-outline', hint: 'Seu proprio caminho' },
];

export default function CreateSeed() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const [selectedType, setSelectedType] = useState<SeedType | null>(null);
  const [name, setName] = useState('');
  const [why, setWhy] = useState('');
  const [forWhom, setForWhom] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleNext() {
    if (!selectedType) { Alert.alert('Escolha um tipo de semente'); return; }
    if (!name.trim()) { Alert.alert('De um nome para sua semente'); return; }

    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) { setLoading(false); return; }
      const seed = await createSeed(user.id, {
        name: name.trim(),
        type: selectedType,
        why: why.trim() || undefined,
        for_whom: forWhom.trim() || undefined,
      });
      router.push({
        pathname: '/seed/questions',
        params: {
          seedId: seed.id,
          seedName: seed.name,
          seedType: seed.type,
          seedWhy: why.trim(),
          seedForWhom: forWhom.trim(),
        },
      });
    } catch (error) {
      console.error('Failed to create seed', error);
      Alert.alert('Erro', 'Não foi possível criar a semente. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={18} color={colors.muted} />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>NOVA SEMENTE</Text>
        <Text style={styles.title}>O que você quer cultivar?</Text>
        <Text style={styles.subtitle}>Escolha um objetivo que mereca atencao diaria. Pequeno, real e importante.</Text>

        <Text style={styles.label}>TIPO DE SEMENTE</Text>
        <View style={styles.typeGrid}>
          {SEED_TYPES.map(t => {
            const selected = selectedType === t.id;
            return (
              <TouchableOpacity key={t.id} style={[styles.typeCard, selected && styles.typeCardSelected]} onPress={() => setSelectedType(t.id)}>
                <Ionicons name={t.icon} size={23} color={selected ? colors.primary : colors.muted} />
                <Text style={[styles.typeLabel, selected && styles.typeLabelSelected]}>{t.label}</Text>
                <Text style={styles.typeHint}>{t.hint}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>NOME DA SEMENTE</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: sair das dividas, treinar 3x na semana..."
          placeholderTextColor={colors.subtle}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>POR QUE ISSO IMPORTA? <Text style={styles.optional}>(opcional)</Text></Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="O motivo real por tras desse objetivo..."
          placeholderTextColor={colors.subtle}
          value={why}
          onChangeText={setWhy}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <Text style={styles.label}>PARA QUEM VOCE FAZ ISSO? <Text style={styles.optional}>(opcional)</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Para mim, minha familia, meu futuro..."
          placeholderTextColor={colors.subtle}
          value={forWhom}
          onChangeText={setForWhom}
        />

        <TouchableOpacity
          style={[styles.nextBtn, (!selectedType || !name.trim()) && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!selectedType || !name.trim() || loading}
        >
          {loading ? <ActivityIndicator color={colors.primaryText} /> : (
            <>
              <Text style={styles.nextBtnText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.primaryText} />
            </>
          )}
        </TouchableOpacity>
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
    title: { fontSize: 35, fontWeight: '800', color: colors.text, lineHeight: 40, marginBottom: 10 },
    subtitle: { fontSize: 15, color: colors.muted, lineHeight: 22, marginBottom: 28 },
    label: { fontSize: 9, letterSpacing: 3, color: colors.primary, fontWeight: '800', marginBottom: 12 },
    optional: { color: colors.subtle, fontWeight: 'normal', letterSpacing: 0 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    typeCard: { width: '30%', minHeight: 116, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, alignItems: 'center', justifyContent: 'center', gap: 5 },
    typeCardSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    typeLabel: { fontSize: 11, color: colors.text, textAlign: 'center', fontWeight: '800' },
    typeLabelSelected: { color: colors.primary },
    typeHint: { fontSize: 9, color: colors.muted, textAlign: 'center', lineHeight: 12 },
    input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, color: colors.text, fontSize: 15, marginBottom: 24 },
    textarea: { minHeight: 96, textAlignVertical: 'top', lineHeight: 22 },
    nextBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8, flexDirection: 'row', gap: 8 },
    nextBtnDisabled: { opacity: 0.35 },
    nextBtnText: { color: colors.primaryText, fontSize: 14, fontWeight: '800', letterSpacing: 1.4 },
  });
}
