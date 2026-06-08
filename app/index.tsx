import { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export default function Index() {
  const { setUser, fetchProfile } = useAuthStore();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    };
    checkSession();
  }, []);

  return (
    <View style={{ flex:1, backgroundColor:'#0A0906', alignItems:'center', justifyContent:'center' }}>
      <ActivityIndicator color="#C4A882" size="large" />
      <Text style={{ color:'#6A6258', marginTop:16, fontSize:12 }}>Carregando...</Text>
    </View>
  );
}