import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export default function Login() {
  const { setUser, fetchProfile } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Preencha todos os campos');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      Alert.alert('Erro', error.message);
    } else if (data.session?.user) {
      setUser(data.session.user);
      await fetchProfile(data.session.user.id);
      setLoading(false);
      router.replace('/(tabs)');
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
        <Text style={styles.subtitle}>Entre na sua jornada</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#6A6258"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Senha com olho */}
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.inputInner}
            placeholder="Senha"
            placeholderTextColor="#6A6258"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeBtn}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/forgot-password')}
          style={{ alignSelf: 'flex-end', marginBottom: 24 }}
        >
          <Text style={styles.forgotText}>Esqueci minha senha</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.link}>Não tem conta? Cadastre-se</Text>
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
  inputWrap: {
    width: '100%',
    backgroundColor: '#1C1915',
    borderWidth: 1,
    borderColor: '#2A2420',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputInner: {
    flex: 1,
    padding: 16,
    color: '#F0E8D8',
    fontSize: 16,
  },
  eyeBtn: {
    padding: 16,
  },
  eyeIcon: {
    fontSize: 18,
  },
  forgotText: {
    color: '#6A6258',
    fontSize: 13,
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