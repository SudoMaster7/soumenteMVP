import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (!email) {
      Alert.alert('Digite seu email');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      Alert.alert('Erro', error.message);
    } else {
      Alert.alert(
        'Email enviado!',
        'Verifique sua caixa de entrada para redefinir sua senha.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>🌱 Soumente</Text>
        <Text style={styles.subtitle}>Redefinir senha</Text>

        <TextInput
          style={styles.input}
          placeholder="Seu email"
          placeholderTextColor="#6A6258"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleReset}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Enviando...' : 'Enviar link'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Voltar ao login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0A0906',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#F0E8D8',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6A6258',
    marginBottom: 48,
    fontStyle: 'italic',
  },
  input: {
    width: '100%',
    backgroundColor: '#1C1915',
    borderWidth: 1,
    borderColor: '#2A2420',
    borderRadius: 14,
    padding: 16,
    color: '#F0E8D8',
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    width: '100%',
    backgroundColor: '#C4A882',
    borderRadius: 100,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: '#0A0906',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  link: {
    color: '#C4A882',
    fontSize: 14,
  },
});