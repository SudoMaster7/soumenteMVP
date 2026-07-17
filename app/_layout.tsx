import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { View } from 'react-native';
import {
  Cinzel_400Regular,
  Cinzel_700Bold,
} from '@expo-google-fonts/cinzel';
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import { DMMono_400Regular } from '@expo-google-fonts/dm-mono';
import { ThemeProvider, useTheme } from '@/lib/theme';
import MentorFab from '@/components/MentorFab';

function AppStack() {
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="seed" />
        <Stack.Screen name="report" />
      </Stack>
      <MentorFab />
    </View>
  );
}

export default function RootLayout() {
  useFonts({
    Cinzel_400Regular,
    Cinzel_700Bold,
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    DMMono_400Regular,
  });

  return (
    <ThemeProvider>
      <AppStack />
    </ThemeProvider>
  );
}
