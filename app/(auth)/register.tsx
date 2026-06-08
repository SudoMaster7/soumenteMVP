import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Preencha todos os campos');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('As senhas não coincidem');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    setLoading(false);

    if (error) {
      Alert.alert('Erro', error.message);
    } else {
      Alert.alert(
        'Cadastro realizado!',
        'Verifique seu email para confirmar o cadastro.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
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
        <Text style={styles.subtitle}>Plante sua primeira semente</Text>

        <TextInput
          style={styles.input}
          placeholder="Seu nome"
          placeholderTextColor="#6A6258"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#6A6258"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Senha */}
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.inputInner}
            placeholder="Senha (mín. 6 caracteres)"
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

        {/* Confirmar senha */}
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.inputInner}
            placeholder="Confirmar senha"
            placeholderTextColor="#6A6258"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
          />
          <TouchableOpacity
            onPress={() => setShowConfirm(!showConfirm)}
            style={styles.eyeBtn}
          >
            <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Já tem conta? Entre aqui</Text>
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