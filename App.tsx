import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  useFonts,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from '@expo-google-fonts/instrument-serif';
import { auth } from './src/firebase';
import HomeScreen from './src/screens/HomeScreen';
import BasvurularScreen from './src/screens/BasvurularScreen';
import YeniBasvuruScreen from './src/screens/YeniBasvuruScreen';
import SonuclarScreen from './src/screens/SonuclarScreen';
import YeniSonucScreen from './src/screens/YeniSonucScreen';
import AuthScreen from './src/screens/AuthScreen';
import ModSecimScreen from './src/screens/ModSecimScreen';
import TakvimScreen from './src/screens/TakvimScreen';
import { Basvuru, Sonuc } from './src/types';
import { F } from './src/theme';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { ModProvider, useMod } from './src/context/ModContext';

export type RootStackParamList = {
  Tabs: undefined;
  YeniBasvuru: { basvuru?: Basvuru };
  YeniSonuc: { sonuc?: Sonuc };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const BilirkisiTab = createBottomTabNavigator();
const AvukatTab = createBottomTabNavigator();

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: string | null }
> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) {
    return { error: e.message + '\n\n' + e.stack };
  }
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#000' }} contentContainerStyle={{ padding: 24, paddingTop: 70 }}>
          <Text style={{ color: 'red', fontSize: 16, fontWeight: 'bold' }}>HATA</Text>
          <Text style={{ color: 'white', fontSize: 11, marginTop: 8 }}>{this.state.error}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    AnaSayfa: '⊞', Basvurular: '📋', Sonuclar: '⚖',
    Dosyalar: '📁', Takvim: '📅', Arsiv: '🗂',
  };
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>{icons[label] ?? '●'}</Text>;
}

function BilirkisiTabs() {
  const { C } = useTheme();
  return (
    <BilirkisiTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: C.surface, borderTopColor: C.border, borderTopWidth: 1 },
        tabBarActiveTintColor: C.gold,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontSize: 11, marginBottom: 2, fontFamily: F.sansSemi },
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
      })}
    >
      <BilirkisiTab.Screen name="AnaSayfa" component={HomeScreen} options={{ title: 'Ana Sayfa' }} />
      <BilirkisiTab.Screen name="Basvurular" component={BasvurularScreen} options={{ title: 'Başvurular' }} />
      <BilirkisiTab.Screen name="Sonuclar" component={SonuclarScreen} options={{ title: 'Sonuçlar' }} />
    </BilirkisiTab.Navigator>
  );
}

function AvukatTabs() {
  const { C } = useTheme();
  return (
    <AvukatTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: C.surface, borderTopColor: C.border, borderTopWidth: 1 },
        tabBarActiveTintColor: C.gold,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontSize: 9, marginBottom: 2, fontFamily: F.sansSemi },
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
      })}
    >
      <AvukatTab.Screen name="AnaSayfa" component={HomeScreen} options={{ title: 'Sayfa' }} />
      <AvukatTab.Screen name="Dosyalar" component={BasvurularScreen} options={{ title: 'Dosyalar' }} />
      <AvukatTab.Screen name="Takvim" component={TakvimScreen} options={{ title: 'Takvim' }} />
      <AvukatTab.Screen name="Arsiv" component={SonuclarScreen} options={{ title: 'Arşiv' }} />
    </AvukatTab.Navigator>
  );
}

function Tabs() {
  const { mod } = useMod();
  return mod === 'avukat' ? <AvukatTabs /> : <BilirkisiTabs />;
}

function AppNav() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="YeniBasvuru" component={YeniBasvuruScreen} />
        <Stack.Screen name="YeniSonuc" component={YeniSonucScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function AppContent() {
  const { C, scheme } = useTheme();
  const { mod, modLoaded } = useMod();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [fontsLoaded] = useFonts({
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
  });

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading || !modLoaded || !fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 36, marginBottom: 24 }}>⚖</Text>
        <ActivityIndicator color={C.gold} size="large" />
      </View>
    );
  }

  if (!user) return <AuthScreen />;
  if (!mod) return <ModSecimScreen />;

  return (
    <ErrorBoundary>
      <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
      <AppNav />
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ModProvider>
        <AppContent />
      </ModProvider>
    </ThemeProvider>
  );
}
