import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

export default function Planted() {
  const { seedName } = useLocalSearchParams<{ seedName: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🌱</Text>
      <Text style={styles.eyebrow}>SEMENTE PLANTADA</Text>
      <Text style={styles.title}>"{seedName}"</Text>
      <Text style={styles.subtitle}>
        Suas raízes foram criadas.{'\n'}
        Regue-as todos os dias e veja{'\n'}
        sua semente crescer.
      </Text>

      <View style={styles.rootsPreview}>
        <Text style={styles.rootsLabel}>RAÍZES CRIADAS</Text>
        {['Reflexão diária', 'Ação concreta', 'Revisão semanal'].map(root => (
          <View key={root} style={styles.rootItem}>
            <Text style={styles.rootDot}>•</Text>
            <Text style={styles.rootName}>{root}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.replace('/(tabs)/garden')}
      >
        <Text style={styles.btnText}>Ver meu jardim →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0906',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emoji: { fontSize: 80, marginBottom: 24 },
  eyebrow: { fontSize: 9, letterSpacing: 4, color: '#C4A882', fontWeight: 'bold', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#F0E8D8', textAlign: 'center', marginBottom: 16 },
  subtitle: { fontSize: 16, color: '#6A6258', fontStyle: 'italic', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  rootsPreview: { backgroundColor: '#1C1915', borderRadius: 16, padding: 20, width: '100%', marginBottom: 32, borderWidth: 1, borderColor: '#2A2420' },
  rootsLabel: { fontSize: 9, letterSpacing: 3, color: '#C4A882', fontWeight: 'bold', marginBottom: 12 },
  rootItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  rootDot: { color: '#4A7A5A', fontSize: 18 },
  rootName: { color: '#F0E8D8', fontSize: 14 },
  btn: { backgroundColor: '#C4A882', borderRadius: 100, paddingVertical: 14, paddingHorizontal: 40 },
  btnText: { color: '#0A0906', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
});
