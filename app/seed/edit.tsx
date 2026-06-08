import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { getCurrentUser } from '@/services/authService';
import { getSeedById, updateSeed } from '@/services/seedService';
import type { SeedType } from '@/types';

const SEED_TYPES = [
  { id: 'dream', label: 'Sonho', icon: '✨' },
  { id: 'career', label: 'Carreira', icon: '🚀' },
  { id: 'health', label: 'Saúde', icon: '💪' },
  { id: 'relationship', label: 'Relacionamentos', icon: '❤️' },
  { id: 'finance', label: 'Finanças', icon: '💰' },
  { id: 'custom', label: 'Outro', icon: '🌱' },
] as const;

export default function EditSeed() {
  const { seedId } = useLocalSearchParams<{ seedId: string }>();
  const [selectedType, setSelectedType] = useState<SeedType | null>(null);
  const [name, setName] = useState('');
  const [why, setWhy] = useState('');
  const [forWhom, setForWhom] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSeed() {
      try {
        const user = await getCurrentUser();
        if (!user || !seedId) return;

        const seed = await getSeedById(seedId, user.id);
        if (!seed) {
          Alert.alert('Semente não encontrada');
          router.back();
          return;
        }

        setSelectedType(seed.type);
        setName(seed.name);
        setWhy(seed.why || '');
        setForWhom(seed.for_whom || '');
      } catch (error) {
        console.error('Failed to load seed', error);
        Alert.alert('Erro', 'Não foi possível carregar a semente.');
      } finally {
        setLoading(false);
      }
    }

    fetchSeed();
  }, [seedId]);

  async function handleSave() {
    if (!selectedType) { Alert.alert('Escolha um tipo de semente'); return; }
    if (!name.trim()) { Alert.alert('Dê um nome para sua semente'); return; }

    setSaving(true);
    try {
      const user = await getCurrentUser();
      if (!user || !seedId) { setSaving(false); return; }

      await updateSeed(seedId, user.id, {
        name: name.trim(),
        type: selectedType,
        why: why.trim() || undefined,
        for_whom: forWhom.trim() || undefined,
      });

      router.back();
    } catch (error) {
      console.error('Failed to update seed', error);
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#C4A882" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>EDITAR SEMENTE</Text>
        <Text style={styles.title}>Ajuste o que você{'\n'}quer cultivar</Text>

        <Text style={styles.label}>TIPO DE SEMENTE</Text>
        <View style={styles.typeGrid}>
          {SEED_TYPES.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.typeCard, selectedType === t.id && styles.typeCardSelected]}
              onPress={() => setSelectedType(t.id as SeedType)}
            >
              <Text style={styles.typeIcon}>{t.icon}</Text>
              <Text style={[styles.typeLabel, selectedType === t.id && styles.typeLabelSelected]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>NOME DA SEMENTE</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Sair das dívidas, aprender inglês..."
          placeholderTextColor="#6A6258"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>POR QUE ISSO IMPORTA? <Text style={styles.optional}>(opcional)</Text></Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="O motivo real por trás desse objetivo..."
          placeholderTextColor="#6A6258"
          value={why}
          onChangeText={setWhy}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <Text style={styles.label}>PARA QUEM VOCÊ FAZ ISSO? <Text style={styles.optional}>(opcional)</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Para minha família, para mim mesmo..."
          placeholderTextColor="#6A6258"
          value={forWhom}
          onChangeText={setForWhom}
        />

        <TouchableOpacity
          style={[styles.saveBtn, (!selectedType || !name.trim()) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!selectedType || !name.trim() || saving}
        >
          {saving ? (
            <ActivityIndicator color="#0A0906" />
          ) : (
            <Text style={styles.saveBtnText}>Salvar alterações</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0906' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 48 },
  center: { flex: 1, backgroundColor: '#0A0906', alignItems: 'center', justifyContent: 'center' },
  back: { marginBottom: 32 },
  backText: { color: '#6A6258', fontSize: 14 },
  eyebrow: { fontSize: 9, letterSpacing: 4, color: '#C4A882', fontWeight: 'bold', marginBottom: 8 },
  title: { fontSize: 34, fontWeight: 'bold', color: '#F0E8D8', lineHeight: 40, marginBottom: 32 },
  label: { fontSize: 9, letterSpacing: 3, color: '#C4A882', fontWeight: 'bold', marginBottom: 12 },
  optional: { color: '#6A6258', fontWeight: 'normal', letterSpacing: 0 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  typeCard: {
    width: '30%',
    backgroundColor: '#1C1915',
    borderWidth: 1,
    borderColor: '#2A2420',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  typeCardSelected: { borderColor: '#C4A882', backgroundColor: 'rgba(196,168,130,0.08)' },
  typeIcon: { fontSize: 24 },
  typeLabel: { fontSize: 10, color: '#6A6258', textAlign: 'center', fontWeight: '500' },
  typeLabelSelected: { color: '#C4A882' },
  input: {
    backgroundColor: '#1C1915',
    borderWidth: 1,
    borderColor: '#2A2420',
    borderRadius: 12,
    padding: 14,
    color: '#F0E8D8',
    fontSize: 15,
    marginBottom: 24,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top', lineHeight: 22 },
  saveBtn: { backgroundColor: '#C4A882', borderRadius: 100, padding: 16, alignItems: 'center', marginTop: 8 },
  saveBtnDisabled: { opacity: 0.3 },
  saveBtnText: { color: '#0A0906', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
});
