import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { deleteBasvuru, getBasvurular } from '../storage';
import { Basvuru } from '../types';
import { F, DURUM_LABEL, AVUKAT_DURUM_LABEL, getDurumBadge, getOdemeBadge, initials, avatarColor, avatarBorderColor, zamanDamgasi, teslimGun, teslimMetin, ThemeColors } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useMod } from '../context/ModContext';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function BasvurularScreen() {
  const { C } = useTheme();
  const { mod } = useMod();
  const nav = useNavigation<Nav>();
  const [list, setList] = useState<Basvuru[]>([]);
  const [query, setQuery] = useState('');

  const s = useMemo(() => makeStyles(C), [C]);
  const DURUM_B = useMemo(() => getDurumBadge(C), [C]);
  const ODEME_B = useMemo(() => getOdemeBadge(C), [C]);
  const durumLabel = mod === 'avukat' ? AVUKAT_DURUM_LABEL : DURUM_LABEL;
  const today = new Date().toISOString().slice(0, 10);

  useFocusEffect(useCallback(() => { getBasvurular().then(setList); }, []));

  const modList = mod === 'avukat'
    ? list.filter(b => b.mod === 'avukat')
    : list.filter(b => !b.mod || b.mod === 'bilirkisi');

  const filtered = query.trim()
    ? modList.filter(b => {
        const q = query.toLowerCase();
        return (
          b.ad.toLowerCase().includes(q) ||
          b.konu.toLowerCase().includes(q) ||
          (b.telefon ?? '').includes(q)
        );
      })
    : modList;

  function onDelete(id: string, ad: string) {
    Alert.alert('Sil', `${ad} silinsin mi?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => { await deleteBasvuru(id); setList(l => l.filter(b => b.id !== id)); },
      },
    ]);
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>{mod === 'avukat' ? 'AKTİF DOSYALAR' : 'AKTİF İŞLER'}</Text>
          <Text style={s.title}>{mod === 'avukat' ? 'Dosyalar' : 'Başvurular'}</Text>
        </View>
        <TouchableOpacity style={s.fab} onPress={() => nav.navigate('YeniBasvuru', {})}>
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

      <FlatList
        data={filtered}
        keyExtractor={b => b.id}
        contentContainerStyle={s.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyBox}>
              <Text style={s.emptyIcon}>📋</Text>
            </View>
            <Text style={s.emptyTitle}>{query ? 'Sonuç bulunamadı' : 'Henüz başvuru yok'}</Text>
            <Text style={s.emptySub}>{query ? `"${query}" için kayıt yok` : '+ Yeni ile ekleyin'}</Text>
          </View>
        }
        renderItem={({ item: b }) => {
          const durumBadge = DURUM_B[b.durum] ?? { bg: C.surface2, text: C.muted };
          const odemeBadge = ODEME_B[b.odemeDurumu ?? 'bekliyor'];
          const ini = initials(b.ad);
          return (
            <TouchableOpacity
              style={s.card}
              onPress={() => nav.navigate('YeniBasvuru', { basvuru: b })}
              onLongPress={() => onDelete(b.id, b.ad)}
              activeOpacity={0.75}
            >
              <View style={s.cardTop}>
                <View style={[s.avatar, { backgroundColor: avatarColor(C, b.ad), borderColor: avatarBorderColor(C, b.ad) }]}>
                  <Text style={s.avatarText}>{ini}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.name} numberOfLines={1}>{b.ad}</Text>
                  <Text style={s.konu} numberOfLines={1}>
                    {b.esasNo
                      ? `${b.esasNo}${b.mahkeme ? ' · ' + b.mahkeme : ''}`
                      : (b.davaTuru ?? b.konu)}
                  </Text>
                </View>
                <View style={[s.badge, { backgroundColor: durumBadge.bg }]}>
                  <Text style={[s.badgeText, { color: durumBadge.text }]}>{durumLabel[b.durum] ?? b.durum}</Text>
                </View>
              </View>

              <View style={s.cardBottom}>
                <View style={[s.odemeBadge, { backgroundColor: odemeBadge.bg }]}>
                  <Text style={[s.odemeBadgeText, { color: odemeBadge.text }]}>{odemeBadge.label}</Text>
                </View>
                {b.ucret && b.ucret !== '0'
                  ? <Text style={s.ucret}>₺{b.ucret}</Text>
                  : <View style={{ flex: 1 }} />
                }
                {(() => {
                  const gun = teslimGun(b.teslimTarihi);
                  if (gun === null) return <Text style={s.time}>{zamanDamgasi(b.olusturma)}</Text>;
                  const color = gun < 0 ? C.crimson : gun <= 7 ? C.orange : C.gold;
                  return <Text style={[s.time, { color, fontFamily: F.sansSemi }]}>{teslimMetin(gun)}</Text>;
                })()}
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

    searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
    searchIcon: { fontSize: 15 },
    searchInput: { flex: 1, fontFamily: F.sans, fontSize: 14, color: C.text },

    list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16, gap: 10 },

    card: { backgroundColor: C.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    avatar: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, flexShrink: 0 },
    avatarText: { fontFamily: F.sansBold, fontSize: 15, color: C.text },
    name: { fontFamily: F.sansSemi, fontSize: 15, color: C.text },
    konu: { fontFamily: F.sans, fontSize: 12, color: C.muted, marginTop: 2 },
    badge: { borderRadius: 9, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
    badgeText: { fontFamily: F.sansSemi, fontSize: 11 },

    cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: C.borderSoft, paddingTop: 10 },
    odemeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    odemeBadgeText: { fontFamily: F.sansSemi, fontSize: 11 },
    ucret: { fontFamily: F.sansSemi, fontSize: 13, color: C.greenBright, flex: 1 },
    time: { fontFamily: F.sans, fontSize: 11, color: C.faint },

    empty: { alignItems: 'center', paddingTop: 60 },
    emptyBox: { width: 64, height: 64, backgroundColor: C.surface, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border, marginBottom: 16 },
    emptyIcon: { fontSize: 26 },
    emptyTitle: { fontFamily: F.sansBold, fontSize: 16, color: C.muted, marginBottom: 6 },
    emptySub: { fontFamily: F.sans, fontSize: 13, color: C.faint },
  });
