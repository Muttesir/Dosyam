import React, { useMemo, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { addSonuc, deleteSonuc, updateSonuc } from '../storage';
import { Sonuc } from '../types';
import { F, getSonucBadge, ThemeColors } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useMod } from '../context/ModContext';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'YeniSonuc'>;

const SONUCLAR: { key: Sonuc['sonuc']; label: string }[] = [
  { key: 'anlasıldı',  label: 'Anlaşıldı'   },
  { key: 'tamamlandı', label: 'Tamamlandı'  },
  { key: 'olumsuz',    label: 'Olumsuz'     },
  { key: 'dava',       label: 'Dava Açıldı' },
  { key: 'beklemede',  label: 'Beklemede'   },
  { key: 'rapor',      label: 'Rapor Hazır' },
  { key: 'diger',      label: 'Diğer'       },
];

export default function YeniSonucScreen() {
  const { C } = useTheme();
  const { mod } = useMod();
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const existing = route.params?.sonuc;
  const today = new Date().toISOString().slice(0, 10);

  const s = useMemo(() => makeStyles(C), [C]);
  const SONUC_B = useMemo(() => getSonucBadge(C), [C]);

  const [ad,       setAd]       = useState(existing?.ad       ?? '');
  const [telefon,  setTelefon]  = useState(existing?.telefon  ?? '');
  const [tarih,    setTarih]    = useState(existing?.tarih    ?? today);
  const [konu,     setKonu]     = useState(existing?.konu     ?? '');
  const [talep,    setTalep]    = useState(existing?.talep    ?? '');
  const [ucret,    setUcret]    = useState(existing?.ucret    ?? '');
  const [aciklama, setAciklama] = useState(existing?.aciklama ?? '');
  const [sonuc,    setSonuc]    = useState<Sonuc['sonuc']>(existing?.sonuc ?? 'anlasıldı');
  const [saving,   setSaving]   = useState(false);

  async function onSave() {
    if (!ad.trim() || !konu.trim()) {
      Alert.alert('Eksik Alan', 'Ad Soyad ve Konu zorunludur.'); return;
    }
    setSaving(true);
    const data = {
      ad: ad.trim(), telefon, tarih, konu: konu.trim(), talep, ucret, aciklama, sonuc,
      mod: existing?.mod ?? mod ?? 'bilirkisi',
    };
    if (existing) await updateSonuc(existing.id, data);
    else await addSonuc(data);
    setSaving(false);
    nav.goBack();
  }

  async function onDelete() {
    if (!existing) return;
    Alert.alert('Sil', 'Bu kayıt silinsin mi?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => { await deleteSonuc(existing.id); nav.goBack(); } },
    ]);
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={s.back}>‹ Geri</Text>
          </TouchableOpacity>
          <Text style={s.title}>{existing ? 'Sonucu Düzenle' : 'Yeni Sonuç'}</Text>
          {existing
            ? <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={s.del}>Sil</Text>
              </TouchableOpacity>
            : <View style={{ width: 40 }} />
          }
        </View>
        <View style={s.headerDivider} />

        <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">
          <Field label="AD SOYAD *" value={ad} onChange={setAd} placeholder="Ad Soyad" s={s} C={C} />
          <Field label="TELEFON" value={telefon} onChange={setTelefon} placeholder="0555 ..." keyboardType="phone-pad" s={s} C={C} />
          <Field label="TARİH" value={tarih} onChange={setTarih} placeholder="YYYY-AA-GG" s={s} C={C} />
          <Field label="KONU *" value={konu} onChange={setKonu} placeholder="Konu" s={s} C={C} />
          <Field label="TALEP / AÇIKLAMA" value={talep} onChange={setTalep} placeholder="Açıklama..." multiline s={s} C={C} />
          <Field label="ÜCRET (₺)" value={ucret} onChange={setUcret} placeholder="0" keyboardType="decimal-pad" s={s} C={C} />
          <Field label="SONUÇ NOTU" value={aciklama} onChange={setAciklama} placeholder="Sonuç hakkında not..." multiline s={s} C={C} />

          <Text style={s.label}>SONUÇ TÜRÜ</Text>
          <View style={s.chipRow}>
            {SONUCLAR.map(sn => {
              const badge = SONUC_B[sn.key];
              const isActive = sonuc === sn.key;
              return (
                <TouchableOpacity
                  key={sn.key}
                  style={[
                    s.chip,
                    isActive && badge ? { backgroundColor: badge.bg, borderColor: badge.text + '60' } : null,
                  ]}
                  onPress={() => setSonuc(sn.key)}
                >
                  <Text style={[s.chipText, isActive && badge ? { color: badge.text, fontFamily: F.sansSemi } : null]}>
                    {sn.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={[s.btn, saving && { opacity: 0.6 }]} onPress={onSave} disabled={saving}>
            <Text style={s.btnText}>Kaydet</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChange, placeholder, multiline, keyboardType, s, C }: {
  label: string; value: string; onChange: (t: string) => void;
  placeholder?: string; multiline?: boolean; keyboardType?: any;
  s: ReturnType<typeof makeStyles>; C: ThemeColors;
}) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={[s.input, multiline && s.inputMulti]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.faint}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

const makeStyles = (C: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
    back: { fontFamily: F.sansSemi, color: C.gold, fontSize: 16 },
    title: { fontFamily: F.sansBold, color: C.text, fontSize: 17 },
    del: { fontFamily: F.sansSemi, color: C.crimson, fontSize: 14 },
    headerDivider: { height: 1, backgroundColor: C.border, marginHorizontal: 20, marginBottom: 4 },

    form: { paddingHorizontal: 20, paddingTop: 16 },

    fieldWrap: { marginBottom: 16 },
    label: { fontFamily: F.sans, color: C.faint, fontSize: 10, letterSpacing: 1.2, marginBottom: 8 },
    input: {
      backgroundColor: C.surface, borderRadius: 14, padding: 14,
      fontFamily: F.sans, color: C.text, fontSize: 15, borderWidth: 1, borderColor: C.border,
    },
    inputMulti: { minHeight: 90, textAlignVertical: 'top' },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
    chipText: { fontFamily: F.sans, color: C.muted, fontSize: 13 },

    btn: { backgroundColor: C.gold, borderRadius: 14, padding: 16, alignItems: 'center' },
    btnText: { fontFamily: F.sansBold, color: C.bg, fontSize: 15 },
  });
