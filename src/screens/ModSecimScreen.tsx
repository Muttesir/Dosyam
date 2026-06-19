import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { F, ThemeColors } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useMod, Mod } from '../context/ModContext';

export default function ModSecimScreen() {
  const { C } = useTheme();
  const { setMod } = useMod();
  const s = useMemo(() => makeStyles(C), [C]);

  function onSelect(m: Mod) {
    setMod(m);
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <View style={s.inner}>
        <View style={s.emblem}>
          <Text style={s.emblemIcon}>⚖</Text>
        </View>
        <Text style={s.logo}>İŞ TAKİP</Text>
        <Text style={s.subtitle}>Profesyonel İş Yönetim Sistemi</Text>

        <View style={s.divider} />

        <Text style={s.prompt}>Profilinizi seçin</Text>
        <Text style={s.promptSub}>Bu seçim panelinizi ve form alanlarını şekillendirir.</Text>

        <View style={s.cards}>
          <TouchableOpacity style={s.card} onPress={() => onSelect('bilirkisi')} activeOpacity={0.75}>
            <Text style={s.cardIcon}>🔬</Text>
            <Text style={s.cardTitle}>Bilirkişi</Text>
            <Text style={s.cardTitle}>Adli Bilimci</Text>
            <View style={s.cardDivider} />
            <Text style={s.cardDesc}>Mahkeme dosyaları</Text>
            <Text style={s.cardDesc}>Teslim tarihleri</Text>
            <Text style={s.cardDesc}>Rapor takibi</Text>
            <Text style={s.cardDesc}>Bilirkişilik ücreti</Text>
            <View style={[s.cardBtn, { backgroundColor: C.blue }]}>
              <Text style={s.cardBtnText}>Seç</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={s.card} onPress={() => onSelect('avukat')} activeOpacity={0.75}>
            <Text style={s.cardIcon}>⚖</Text>
            <Text style={s.cardTitle}>Avukat</Text>
            <Text style={s.cardTitle}> </Text>
            <View style={s.cardDivider} />
            <Text style={s.cardDesc}>Müvekkil yönetimi</Text>
            <Text style={s.cardDesc}>Duruşma takibi</Text>
            <Text style={s.cardDesc}>Süre kontrolü</Text>
            <Text style={s.cardDesc}>Tahsilat takibi</Text>
            <View style={[s.cardBtn, { backgroundColor: C.gold }]}>
              <Text style={s.cardBtnText}>Seç</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={s.footer}>Profili daha sonra hesap menüsünden değiştirebilirsiniz.</Text>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (C: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    inner: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },

    emblem: {
      width: 64, height: 64, borderRadius: 20,
      backgroundColor: C.goldTint, borderWidth: 1, borderColor: C.goldDim,
      justifyContent: 'center', alignItems: 'center',
      alignSelf: 'center', marginBottom: 14,
    },
    emblemIcon: { fontSize: 30 },
    logo: { fontFamily: F.sansBold, color: C.gold, fontSize: 24, textAlign: 'center', letterSpacing: 4, marginBottom: 4 },
    subtitle: { fontFamily: F.sans, color: C.muted, fontSize: 12, textAlign: 'center' },

    divider: { height: 1, backgroundColor: C.border, marginVertical: 24 },

    prompt: { fontFamily: F.sansBold, color: C.text, fontSize: 20, textAlign: 'center', marginBottom: 6 },
    promptSub: { fontFamily: F.sans, color: C.muted, fontSize: 13, textAlign: 'center', marginBottom: 24 },

    cards: { flexDirection: 'row', gap: 12 },
    card: {
      flex: 1, backgroundColor: C.surface, borderRadius: 18,
      borderWidth: 1, borderColor: C.border, padding: 18,
      alignItems: 'center',
    },
    cardIcon: { fontSize: 32, marginBottom: 10 },
    cardTitle: { fontFamily: F.sansBold, color: C.text, fontSize: 15, textAlign: 'center' },
    cardDivider: { height: 1, backgroundColor: C.border, width: '100%', marginVertical: 12 },
    cardDesc: { fontFamily: F.sans, color: C.muted, fontSize: 12, textAlign: 'center', marginBottom: 3 },
    cardBtn: { marginTop: 14, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 8, width: '100%', alignItems: 'center' },
    cardBtnText: { fontFamily: F.sansBold, color: '#fff', fontSize: 14 },

    footer: { fontFamily: F.sans, color: C.faint, fontSize: 11, textAlign: 'center', marginTop: 24 },
  });
