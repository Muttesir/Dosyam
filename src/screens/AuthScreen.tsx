import React, { useMemo, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { F, ThemeColors } from '../theme';
import { useTheme } from '../context/ThemeContext';

export default function AuthScreen() {
  const { C } = useTheme();
  const s = useMemo(() => makeStyles(C), [C]);

  const [mode, setMode] = useState<'giris' | 'kayit'>('giris');
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!email.trim() || !sifre) {
      Alert.alert('Eksik Alan', 'E-posta ve şifre zorunludur.'); return;
    }
    setLoading(true);
    try {
      if (mode === 'giris') {
        await signInWithEmailAndPassword(auth, email.trim(), sifre);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), sifre);
      }
    } catch (e: any) {
      const mesajlar: Record<string, string> = {
        'auth/invalid-email': 'Geçersiz e-posta adresi.',
        'auth/user-not-found': 'Bu e-posta ile kayıtlı kullanıcı yok.',
        'auth/wrong-password': 'Şifre hatalı.',
        'auth/email-already-in-use': 'Bu e-posta zaten kayıtlı.',
        'auth/weak-password': 'Şifre en az 6 karakter olmalı.',
        'auth/invalid-credential': 'E-posta veya şifre hatalı.',
      };
      Alert.alert('Hata', mesajlar[e.code] ?? e.message);
    }
    setLoading(false);
  }

  async function onSifreSifirla() {
    if (!email.trim()) { Alert.alert('E-posta gir', 'Önce e-posta adresini yaz.'); return; }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert('Gönderildi', 'Şifre sıfırlama e-postası gönderildi.');
    } catch {
      Alert.alert('Hata', 'E-posta gönderilemedi.');
    }
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.inner}>
          <View style={s.emblem}>
            <Text style={s.emblemIcon}>⚖</Text>
          </View>
          <Text style={s.logo}>İŞ TAKİP</Text>
          <Text style={s.subtitle}>Profesyonel İş Yönetim Sistemi</Text>

          <View style={s.divider} />

          <View style={s.tabs}>
            <TouchableOpacity style={[s.tab, mode === 'giris' && s.tabActive]} onPress={() => setMode('giris')}>
              <Text style={[s.tabText, mode === 'giris' && s.tabTextActive]}>Giriş Yap</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.tab, mode === 'kayit' && s.tabActive]} onPress={() => setMode('kayit')}>
              <Text style={[s.tabText, mode === 'kayit' && s.tabTextActive]}>Kayıt Ol</Text>
            </TouchableOpacity>
          </View>

          <View style={s.fieldWrap}>
            <Text style={s.label}>E-POSTA</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@email.com"
              placeholderTextColor={C.faint}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={s.fieldWrap}>
            <Text style={s.label}>ŞİFRE</Text>
            <TextInput
              style={s.input}
              value={sifre}
              onChangeText={setSifre}
              placeholder="••••••••"
              placeholderTextColor={C.faint}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]} onPress={onSubmit} disabled={loading}>
            <Text style={s.btnText}>{mode === 'giris' ? 'Giriş Yap' : 'Hesap Oluştur'}</Text>
          </TouchableOpacity>

          {mode === 'giris' && (
            <TouchableOpacity onPress={onSifreSifirla} style={s.forgotBtn}>
              <Text style={s.forgotText}>Şifremi unuttum</Text>
            </TouchableOpacity>
          )}

          <Text style={s.footer}>Verileriniz güvenli şekilde saklanır</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (C: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    inner: { flex: 1, paddingHorizontal: 28, justifyContent: 'center' },

    emblem: {
      width: 76, height: 76, borderRadius: 24,
      backgroundColor: C.goldTint, borderWidth: 1, borderColor: C.goldDim,
      justifyContent: 'center', alignItems: 'center',
      alignSelf: 'center', marginBottom: 18,
    },
    emblemIcon: { fontSize: 38 },
    logo: { fontFamily: F.sansBold, color: C.gold, fontSize: 28, textAlign: 'center', letterSpacing: 4, marginBottom: 6 },
    subtitle: { fontFamily: F.sans, color: C.muted, fontSize: 12, textAlign: 'center', letterSpacing: 0.5 },

    divider: { height: 1, backgroundColor: C.border, marginVertical: 28 },

    tabs: {
      flexDirection: 'row', backgroundColor: C.surface2,
      borderRadius: 14, padding: 4, marginBottom: 24,
      borderWidth: 1, borderColor: C.border,
    },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
    tabActive: { backgroundColor: C.goldTint, borderWidth: 1, borderColor: C.goldDim },
    tabText: { fontFamily: F.sansSemi, color: C.muted, fontSize: 14 },
    tabTextActive: { fontFamily: F.sansSemi, color: C.gold },

    fieldWrap: { marginBottom: 14 },
    label: { fontFamily: F.sans, color: C.faint, fontSize: 10, letterSpacing: 1.2, marginBottom: 7 },
    input: {
      backgroundColor: C.surface, borderRadius: 14, padding: 15,
      fontFamily: F.sans, color: C.text, fontSize: 15,
      borderWidth: 1, borderColor: C.border,
    },

    btn: {
      backgroundColor: C.gold, borderRadius: 14,
      padding: 16, alignItems: 'center', marginTop: 8,
    },
    btnText: { fontFamily: F.sansBold, color: C.bg, fontSize: 15, letterSpacing: 0.3 },

    forgotBtn: { alignItems: 'center', marginTop: 18 },
    forgotText: { fontFamily: F.sans, color: C.muted, fontSize: 13 },

    footer: { fontFamily: F.sans, color: C.faint, fontSize: 11, textAlign: 'center', marginTop: 36 },
  });
