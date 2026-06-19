import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { deleteSonuc, getSonuclar } from '../storage';
import { Sonuc } from '../types';
import { F, getSonucBadge, initials, avatarColor, avatarBorderColor, zamanDamgasi, ThemeColors } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useMod } from '../context/ModContext';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Filter = 'tümü' | Sonuc['sonuc'];

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'tümü',       label: 'Tümü'      },
  { key: 'anlasıldı',  label: 'Anlaşıldı' },
  { key: 'tamamlandı', label: 'Tamamlandı'},
  { key: 'olumsuz',    label: 'Olumsuz'   },
  { key: 'dava',       label: 'Dava'      },
  { key: 'beklemede',  label: 'Beklemede' },
  { key: 'rapor',      label: 'Rapor'     },
  { key: 'diger',      label: 'Diğer'     },
];

export default function SonuclarScreen() {
  const { C } = useTheme();
  const { mod } = useMod();
  const nav = useNavigation<Nav>();
  const [list, setList] = useState<Sonuc[]>([]);
  const [filter, setFilter] = useState<Filter>('tümü');
  const [query, setQuery] = useState('');

  const s = useMemo(() => makeStyles(C), [C]);
  const SONUC_B = useMemo(() => getSonucBadge(C), [C]);

  useFocusEffect(useCallback(() => { getSonuclar().then(setList); }, []));

  // Her mod kendi arşivini görür; mod alanı olmayan eski kayıtlar bilirkişi sayılır
  const modList = list.filter(s =>
    mod === 'avukat' ? s.mod === 'avukat' : (!s.mod || s.mod === 'bilirkisi')
  );

  const afterFilter = filter === 'tümü' ? modList : modList.filter(s => s.sonuc === filter);
  const filtered = query.trim()
    ? afterFilter.filter(s => {
        const q = query.toLowerCase();
        return (
          s.ad.toLowerCase().includes(q) ||
          s.konu.toLowerCase().includes(q) ||
          (s.telefon ?? '').includes(q)
        );
      })
    : afterFilter;

  function onDelete(id: string, ad: string) {
    Alert.alert('Sil', `${ad} silinsin mi?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => { await deleteSonuc(id); setList(l => l.filter(s => s.id !== id)); },
      },
    ]);
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>{mod === 'avukat' ? 'ARŞİV' : 'TAMAMLANANLAR'}</Text>
          <Text style={s.title}>{mod === 'avukat' ? 'Arşiv' : 'Sonuçlar'}</Text>
        </View>
        <TouchableOpacity style={s.fab} onPress={() => nav.navigate('YeniSonuc', {})}>
          <Text style={s.fabText}>+ Yeni</Text>
        </TouchableOpacity>
      </View>

      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="İsim, konu veya telefon ara..."
          placeholderTextColor={C.faint}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
      </View>

      <View style={s.filterContent}>
        {FILTERS.map(f => {
          const badge = SONUC_B[f.key as keyof typeof SONUC_B];
          const isActive = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[
                s.chip,
                isActive && (badge ? { backgroundColor: badge.bg, borderColor: badge.text + '60' } : s.chipActive),
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[s.chipText, isActive && { color: badge?.text ?? C.gold, fontFamily: F.sansSemi }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyBox}>
              <Text style={s.emptyIcon}>⚖</Text>
            </View>
            <Text style={s.emptyTitle}>{query ? 'Sonuç bulunamadı' : 'Kayıt yok'}</Text>
            <Text style={s.emptySub}>{query ? `"${query}" için kayıt yok` : 'Henüz sonuçlandırılmış iş yok'}</Text>
          </View>
        }
        renderItem={({ item: sonuc }) => {
          const b = SONUC_B[sonuc.sonuc] ?? { bg: C.surface2, text: C.muted, label: sonuc.sonuc };
          const ini = initials(sonuc.ad);
          const avBg = avatarColor(C, sonuc.ad);
          const avBorder = avatarBorderColor(C, sonuc.ad);
          return (
            <TouchableOpacity
              style={s.card}
              onPress={() => nav.navigate('YeniSonuc', { sonuc })}
              onLongPress={() => onDelete(sonuc.id, sonuc.ad)}
              activeOpacity={0.75}
            >
              <View style={s.cardTop}>
                <View style={[s.avatar, { backgroundColor: avBg, borderColor: avBorder }]}>
                  <Text style={s.avatarText}>{ini}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.name} numberOfLines={1}>{sonuc.ad}</Text>
                  <Text style={s.konu} numberOfLines={1}>
                    {sonuc.esasNo ? `${sonuc.esasNo}${sonuc.mahkeme ? ' · ' + sonuc.mahkeme : ''}` : sonuc.konu}
                  </Text>
                </View>
                <View style={[s.badge, { backgroundColor: b.bg }]}>
                  <Text style={[s.badgeText, { color: b.text }]}>{b.label}</Text>
                </View>
              </View>

              <View style={s.cardBottom}>
                {sonuc.aciklama ? <Text style={s.aciklama} numberOfLines={1}>{sonuc.aciklama}</Text> : <View style={{ flex: 1 }} />}
                {sonuc.ucret && sonuc.ucret !== '0' ? <Text style={s.ucret}>₺{sonuc.ucret}</Text> : null}
                <Text style={s.time}>{zamanDamgasi(sonuc.olusturma)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const makeStyles = (C: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
    eyebrow: { fontFamily: F.sans, fontSize: 10, color: C.faint, letterSpacing: 1.5, marginBottom: 3 },
    title: { fontFamily: F.sansBold, fontSize: 26, color: C.text },
    fab: { backgroundColor: C.gold, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 9 },
    fabText: { fontFamily: F.sansBold, fontSize: 13, color: C.bg },

    searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
    searchIcon: { fontSize: 15 },
    searchInput: { flex: 1, fontFamily: F.sans, fontSize: 14, color: C.text },

    filterContent: { paddingHorizontal: 16, gap: 8, paddingVertical: 10, paddingBottom: 12, flexDirection: 'row', flexWrap: 'wrap' },
    chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
    chipActive: { backgroundColor: C.goldTint, borderColor: C.gold + '60' },
    chipText: { fontFamily: F.sans, color: C.muted, fontSize: 13 },

    list: { padding: 16, paddingTop: 8, gap: 10 },

    card: { backgroundColor: C.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    avatar: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, flexShrink: 0 },
    avatarText: { fontFamily: F.sansBold, fontSize: 15, color: C.text },
    name: { fontFamily: F.sansSemi, fontSize: 15, color: C.text },
    konu: { fontFamily: F.sans, fontSize: 12, color: C.muted, marginTop: 2 },
    badge: { borderRadius: 9, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
    badgeText: { fontFamily: F.sansSemi, fontSize: 11 },

    cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: C.borderSoft, paddingTop: 10 },
    aciklama: { fontFamily: F.sans, fontSize: 12, color: C.muted, flex: 1 },
    ucret: { fontFamily: F.sansSemi, fontSize: 13, color: C.greenBright },
    time: { fontFamily: F.sans, fontSize: 11, color: C.faint },

    empty: { alignItems: 'center', paddingTop: 60 },
    emptyBox: { width: 64, height: 64, backgroundColor: C.surface, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border, marginBottom: 16 },
    emptyIcon: { fontSize: 26 },
    emptyTitle: { fontFamily: F.sansBold, fontSize: 16, color: C.muted, marginBottom: 6 },
    emptySub: { fontFamily: F.sans, fontSize: 13, color: C.faint },
  });
