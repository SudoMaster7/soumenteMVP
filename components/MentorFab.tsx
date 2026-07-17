import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSegments } from 'expo-router';
import { useTheme, type AppTheme } from '@/lib/theme';

const VISIBLE_ROOT_SEGMENTS = new Set(['(tabs)', 'seed', 'report']);

export default function MentorFab() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const colors = theme.colors;
  const [open, setOpen] = useState(false);
  const segments = useSegments();
  const visible = VISIBLE_ROOT_SEGMENTS.has(segments[0] as string);

  if (!visible) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Abrir Mentor"
      >
        <Ionicons name="sparkles-outline" size={24} color={colors.primaryText} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <Text style={styles.title}>Mentor SouMente</Text>
          <Text style={styles.body}>Em breve.</Text>
        </View>
      </Modal>
    </>
  );
}

function makeStyles(theme: AppTheme) {
  const colors = theme.colors;
  return StyleSheet.create({
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 88,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
    },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
    sheet: {
      backgroundColor: colors.surfaceElevated,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      padding: 24,
      paddingBottom: 40,
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    title: { fontSize: 18, color: colors.text, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
    body: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  });
}
