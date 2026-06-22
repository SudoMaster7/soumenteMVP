import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme, type AppTheme } from '@/lib/theme';

function parseRoots(raw?: string) {
  if (!raw) return ['Reflexão diária', 'Ação concreta', 'Revisão semanal'];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed.map(String) : ['Reflexão diária', 'Ação concreta', 'Revisão semanal'];
  } catch {
    return ['Reflexão diária', 'Ação concreta', 'Revisão semanal'];
  }
}

export default function Planted() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const { seedId, seedName, rootsJson } = useLocalSearchParams<{ seedId?: string; seedName: string; rootsJson?: string }>();
  const roots = parseRoots(rootsJson);

  return (
    <View style={styles.container}>
      <View style={styles.emojiWrap}>
        <Ionicons name="leaf" size={58} color={colors.success} />
      </View>
      <Text style={styles.eyebrow}>SEMENTE PLANTADA</Text>
      <Text style={styles.title}>"{seedName}"</Text>
      <Text style={styles.subtitle}>
        Suas raízes foram criadas. Regue uma por vez e veja sua semente ganhar corpo.
      </Text>

      <View style={styles.rootsPreview}>
        <Text style={styles.rootsLabel}>RAIZES CRIADAS</Text>
        {roots.map(root => (
          <View key={root} style={styles.rootItem}>
            <Ionicons name="checkmark-circle-outline" size={17} color={colors.success} />
            <Text style={styles.rootName}>{root}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.replace({ pathname: '/(tabs)/garden', params: seedId ? { seedId } : undefined })}
      >
        <Text style={styles.btnText}>Ver meu jardim</Text>
        <Ionicons name="arrow-forward" size={17} color={colors.primaryText} />
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(theme: AppTheme) {
  const colors = theme.colors;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    emojiWrap: { width: 104, height: 104, borderRadius: 52, backgroundColor: colors.successSoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    eyebrow: { fontSize: 9, letterSpacing: 4, color: colors.primary, fontWeight: '900', marginBottom: 12 },
    title: { fontSize: 28, fontWeight: '900', color: colors.text, textAlign: 'center', marginBottom: 16 },
    subtitle: { fontSize: 16, color: colors.muted, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
    rootsPreview: { backgroundColor: colors.surface, borderRadius: 12, padding: 20, width: '100%', marginBottom: 32, borderWidth: 1, borderColor: colors.border },
    rootsLabel: { fontSize: 9, letterSpacing: 3, color: colors.primary, fontWeight: '900', marginBottom: 12 },
    rootItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    rootName: { color: colors.text, fontSize: 14, flex: 1 },
    btn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28, flexDirection: 'row', alignItems: 'center', gap: 8 },
    btnText: { color: colors.primaryText, fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  });
}
