import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase';
import { getBasvurular, getSonuclar } from '../storage';
import { Basvuru, Sonuc } from '../types';
import {
  F, DURUM_LABEL, AVUKAT_DURUM_LABEL, getDurumBadge, getOdemeBadge,
  initials, avatarColor, avatarBorderColor, zamanDamgasi,
  teslimGun, teslimMetin, ThemeColors,
} from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useMod } from '../context/ModContext';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const { C, scheme, toggleTheme } = useTheme();
  const { mod, setMod } = useMod();
  const nav = useNavigation<Nav>();
  const [basvurular, setBasvurular] = useState<Basvuru[]>([]);
  const [sonuclar, setSonuclar] = useState<Sonuc[]>([]);

  const s = useMemo(() => makeStyles(C), [C]);
  const DURUM_B = useMemo(() => getDurumBadge(C), [C]);
  const ODEME_B = useMemo(() => getOdemeBadge(C), [C]);

  useFocusEffect(useCallback(() => {
    getBasvurular().then(setBasvurular);
    getSonuclar().then(setSonuclar);
  }, []));

  function onAvatar() {
    Alert.alert('Hesap', auth.currentUser?.email ?? '', [
      {
        text: 'Profil Değiştir', onPress: () =>
          Alert.alert('Profil', 'Hangi profili kullanmak istiyorsunuz?', [
            { text: 'Bilirkişi / Adli Bilimci', onPress: () => setMod('bilirkisi') },
            { text: 'Avukat', onPress: () => setMod('avukat') },
            { text: 'İptal', style: 'cancel' },
          ]),
      },
      {
        text: 'Çıkış Yap', style: 'destructive', onPress: async () => {
          await AsyncStorage.clear();
          signOut(auth);
        },
      },
      { text: 'İptal', style: 'cancel' },
    ]);
  }

  const emailInitial = (auth.currentUser?.email ?? '?')[0].toUpperCase();

  const headerNode = (eyebrow: string) => (
    <>
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>{eyebrow}</Text>
          <Text style={s.logo}>DOSYAM</Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.themeBtn} onPress={toggleTheme}>
            <Text style={s.themeBtnText}>{scheme === 'dark' ? '☀' : '◐'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.avatarBtn} onPress={onAvatar}>
            <Text style={s.avatarBtnText}>{emailInitial}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={s.divider} />
    </>
  );

  const avukatBasvurular   = basvurular.filter(b => b.mod === 'avukat');
  const bilirkisiBasvurular = basvurular.filter(b => !b.mod || b.mod === 'bilirkisi');
  const avukatSonuclar     = sonuclar.filter(s => s.mod === 'avukat');
  const bilirkisiSonuclar  = sonuclar.filter(s => !s.mod || s.mod === 'bilirkisi');

  if (mod === 'avukat') {
    return <AvukatDashboard basvurular={avukatBasvurular} sonuclar={avukatSonuclar} nav={nav} C={C} s={s} DURUM_B={DURUM_B} ODEME_B={ODEME_B} header={headerNode('AVUKAT PANELİ')} />;
  }
  return <BilirkisiDashboard basvurular={bilirkisiBasvurular} sonuclar={bilirkisiSonuclar} nav={nav} C={C} s={s} DURUM_B={DURUM_B} ODEME_B={ODEME_B} header={headerNode('BİLİRKİŞİ PANELİ')} />;
}

// ── Bilirkişi Dashboard ────────────────────────────────────────

function BilirkisiDashboard({ basvurular, sonuclar, nav, C, s, DURUM_B, ODEME_B, header }: any) {
  const buAy = new Date().toISOString().slice(0, 7);
  const olumlu = sonuclar.filter((s: Sonuc) => s.sonuc === 'anlasıldı' || s.sonuc === 'tamamlandı').length;
  const geciken = basvurular.filter((b: Basvuru) => {
    const gun = teslimGun(b.teslimTarihi);
    return gun !== null && gun < 0 && b.durum !== 'teslim';
  }).length;
  const bekleyenOdeme = basvurular
    .filter((b: Basvuru) => (b.odemeDurumu ?? 'bekliyor') !== 'odendi' && b.ucret && b.ucret !== '0')
    .reduce((sum: number, b: Basvuru) => sum + (parseFloat(b.ucret) || 0), 0);
  const buAyTahsilat = basvurular
    .filter((b: Basvuru) => b.odemeDurumu === 'odendi' && b.olusturma?.startsWith(buAy))
    .reduce((sum: number, b: Basvuru) => sum + (parseFloat(b.ucret) || 0), 0);
  const yaklaşanlar = basvurular
    .filter((b: Basvuru) => b.teslimTarihi && b.durum !== 'teslim')
    .sort((a: Basvuru, b: Basvuru) => {
      const aG = teslimGun(a.teslimTarihi) ?? 9999;
      const bG = teslimGun(b.teslimTarihi) ?? 9999;
      return aG - bG;
    })
    .slice(0, 5);
  const son4 = basvurular.slice(0, 4);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {header}
        <View style={s.section}>
          <Text style={s.sectionLabel}>İŞ DURUMU</Text>
          <View style={s.grid}>
            <KpiCard label="Aktif Dosya" value={basvurular.length} color={C.blue} s={s} />
            <KpiCard label="Geciken" value={geciken} color={geciken > 0 ? C.crimson : C.muted} s={s} />
          </View>
          <View style={s.grid}>
            <KpiCard label="Olumlu Sonuç" value={olumlu} color={C.greenBright} s={s} />
            <KpiCard label="Toplam Sonuç" value={sonuclar.length} color={C.purple} s={s} />
          </View>
        </View>

        {yaklaşanlar.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>YAKLAŞAN TESLİMLER</Text>
            {yaklaşanlar.map((b: Basvuru) => {
              const gun = teslimGun(b.teslimTarihi)!;
              const isGecikti = gun < 0;
              const isKritik = !isGecikti && gun <= 7;
              const urgColor = isGecikti ? C.crimson : isKritik ? C.orange : C.gold;
              const urgBg = isGecikti ? C.crimsonTint : isKritik ? C.orangeTint : C.goldTint;
              const durumB = DURUM_B[b.durum] ?? { bg: C.surface2, text: C.muted };
              return (
                <TouchableOpacity key={b.id} style={[s.deadlineCard, { borderLeftColor: urgColor }]} onPress={() => nav.navigate('YeniBasvuru', { basvuru: b })} activeOpacity={0.75}>
                  <View style={[s.deadlinePill, { backgroundColor: urgBg }]}>
                    <Text style={[s.deadlinePillNum, { color: urgColor }]}>{Math.abs(gun)}</Text>
                    <Text style={[s.deadlinePillLabel, { color: urgColor }]}>{isGecikti ? 'gecikti' : 'gün'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.deadlineName} numberOfLines={1}>{b.esasNo ?? b.ad}</Text>
                    <Text style={s.deadlineSub} numberOfLines={1}>{b.mahkeme ?? b.konu}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: durumB.bg }]}>
                    <Text style={[s.badgeText, { color: durumB.text }]}>{DURUM_LABEL[b.durum]}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={s.section}>
          <Text style={s.sectionLabel}>ÖDEME TAKİBİ</Text>
          <View style={s.grid}>
            <KpiMoney label="Bekleyen Tahsilat" value={bekleyenOdeme} color={C.crimson} s={s} />
            <KpiMoney label="Bu Ay Tahsilat" value={buAyTahsilat} color={C.greenBright} s={s} />
          </View>
        </View>

        {son4.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>SON DOSYALAR</Text>
            {son4.map((b: Basvuru) => <DosyaKart key={b.id} b={b} nav={nav} C={C} s={s} DURUM_B={DURUM_B} ODEME_B={ODEME_B} durumLabel={DURUM_LABEL} />)}
          </View>
        )}

        {basvurular.length === 0 && sonuclar.length === 0 && <EmptyState s={s} mod="bilirkisi" />}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Avukat Dashboard ───────────────────────────────────────────

function AvukatDashboard({ basvurular, sonuclar, nav, C, s, DURUM_B, ODEME_B, header }: any) {
  const today = new Date().toISOString().slice(0, 10);

  const bugunDurusmalar = (basvurular as Basvuru[]).flatMap(b =>
    (b.durusmalar ?? []).filter(d => d.tarih === today).map(d => ({ d, b }))
  );
  const yaklaşanSureler = (basvurular as Basvuru[]).flatMap(b =>
    (b.sureler ?? []).filter(s => !s.tamamlandi && s.tarih >= today).map(s => ({ s, b }))
  ).sort((a, b) => a.s.tarih.localeCompare(b.s.tarih)).slice(0, 5);

  const gecikenSure = (basvurular as Basvuru[]).flatMap(b =>
    (b.sureler ?? []).filter(s => !s.tamamlandi && s.tarih < today)
  ).length;

  const bekleyenTahsilat = (basvurular as Basvuru[]).reduce((sum, b) => {
    if (b.odemeDurumu === 'odendi') return sum;
    const anlas = parseFloat(b.anlasilanUcret || b.ucret || '0') || 0;
    const tahsil = parseFloat(b.tahsilEdilen || '0') || 0;
    return sum + Math.max(0, anlas - tahsil);
  }, 0);

  const son4 = (basvurular as Basvuru[]).slice(0, 4);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {header}
        <View style={s.section}>
          <Text style={s.sectionLabel}>GENEL DURUM</Text>
          <View style={s.grid}>
            <KpiCard label="Aktif Dosya" value={basvurular.length} color={C.blue} s={s} />
            <KpiCard label="Geciken Süre" value={gecikenSure} color={gecikenSure > 0 ? C.crimson : C.muted} s={s} />
          </View>
          <View style={s.grid}>
            <KpiCard label="Toplam Arşiv" value={sonuclar.length} color={C.purple} s={s} />
            <KpiMoney label="Bekleyen Tahsilat" value={bekleyenTahsilat} color={C.crimson} s={s} />
          </View>
        </View>

        {/* Bugünkü duruşmalar */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>BUGÜNKÜ DURUŞMALAR</Text>
          {bugunDurusmalar.length === 0 ? (
            <View style={s.emptySection}>
              <Text style={s.emptySectionText}>Bugün duruşma yok</Text>
            </View>
          ) : (
            bugunDurusmalar.map(({ d, b }, i) => (
              <TouchableOpacity key={i} style={[s.deadlineCard, { borderLeftColor: C.purple }]} onPress={() => nav.navigate('YeniBasvuru', { basvuru: b })} activeOpacity={0.75}>
                <View style={[s.deadlinePill, { backgroundColor: C.purpleTint }]}>
                  <Text style={[s.deadlinePillNum, { color: C.purple, fontSize: 14 }]}>{d.saat ?? '⚖'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.deadlineName} numberOfLines={1}>{b.ad}</Text>
                  <Text style={s.deadlineSub} numberOfLines={1}>{d.mahkeme ?? b.mahkeme ?? b.konu}</Text>
                </View>
                {b.esasNo && <Text style={s.esasNo}>{b.esasNo}</Text>}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Yaklaşan süreler */}
        {yaklaşanSureler.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>YAKLAŞAN SÜRELER</Text>
            {yaklaşanSureler.map(({ s: sItem, b }, i) => {
              const gun = teslimGun(sItem.tarih);
              const isKritik = gun !== null && gun <= 7;
              const urgColor = gun === null ? C.muted : gun < 0 ? C.crimson : isKritik ? C.orange : C.gold;
              const urgBg = gun === null ? C.surface2 : gun < 0 ? C.crimsonTint : isKritik ? C.orangeTint : C.goldTint;
              return (
                <TouchableOpacity key={i} style={[s.deadlineCard, { borderLeftColor: urgColor }]} onPress={() => nav.navigate('YeniBasvuru', { basvuru: b })} activeOpacity={0.75}>
                  <View style={[s.deadlinePill, { backgroundColor: urgBg }]}>
                    <Text style={[s.deadlinePillNum, { color: urgColor }]}>{gun !== null ? Math.abs(gun) : '—'}</Text>
                    <Text style={[s.deadlinePillLabel, { color: urgColor }]}>{gun !== null && gun < 0 ? 'gecikti' : 'gün'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.deadlineName} numberOfLines={1}>{sItem.baslik}</Text>
                    <Text style={s.deadlineSub} numberOfLines={1}>{b.ad}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {son4.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>SON DOSYALAR</Text>
            {son4.map((b: Basvuru) => <DosyaKart key={b.id} b={b} nav={nav} C={C} s={s} DURUM_B={DURUM_B} ODEME_B={ODEME_B} durumLabel={AVUKAT_DURUM_LABEL} />)}
          </View>
        )}

        {basvurular.length === 0 && sonuclar.length === 0 && <EmptyState s={s} mod="avukat" />}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Shared sub-components ──────────────────────────────────────

function DosyaKart({ b, nav, C, s, DURUM_B, ODEME_B, durumLabel }: any) {
  const durumB = DURUM_B[b.durum] ?? { bg: C.surface2, text: C.muted };
  const odemeB = ODEME_B[b.odemeDurumu ?? 'bekliyor'];
  const avBg = avatarColor(C, b.ad);
  const avBorder = avatarBorderColor(C, b.ad);
  const gun = teslimGun(b.teslimTarihi);
  const teslimColor = gun === null ? null : gun < 0 ? C.crimson : gun <= 7 ? C.orange : C.gold;
  return (
    <TouchableOpacity style={s.card} onPress={() => nav.navigate('YeniBasvuru', { basvuru: b })} activeOpacity={0.75}>
      <View style={s.cardTop}>
        <View style={[s.avatar, { backgroundColor: avBg, borderColor: avBorder }]}>
          <Text style={s.avatarText}>{initials(b.ad)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name} numberOfLines={1}>{b.ad}</Text>
          <Text style={s.konu} numberOfLines={1}>
            {b.esasNo ? `${b.esasNo}${b.mahkeme ? ' · ' + b.mahkeme : ''}` : (b.davaTuru ?? b.konu)}
          </Text>
        </View>
        <View style={[s.badge, { backgroundColor: durumB.bg }]}>
          <Text style={[s.badgeText, { color: durumB.text }]}>{durumLabel[b.durum] ?? b.durum}</Text>
        </View>
      </View>
      <View style={s.cardBottom}>
        <View style={[s.odemeBadge, { backgroundColor: odemeB.bg }]}>
          <Text style={[s.odemeBadgeText, { color: odemeB.text }]}>{odemeB.label}</Text>
        </View>
        {b.ucret && b.ucret !== '0' && <Text style={s.ucret}>₺{b.ucret}</Text>}
        {gun !== null
          ? <Text style={[s.time, { color: teslimColor!, fontFamily: F.sansSemi }]}>{teslimMetin(gun)}</Text>
          : <Text style={s.time}>{zamanDamgasi(b.olusturma)}</Text>
        }
      </View>
    </TouchableOpacity>
  );
}

function KpiCard({ label, value, color, s }: { label: string; value: number; color: string; s: any }) {
  return (
    <View style={[s.kpi, { borderLeftColor: color }]}>
      <Text style={[s.kpiValue, { color, fontFamily: F.serif }]}>{value}</Text>
      <Text style={s.kpiLabel}>{label}</Text>
    </View>
  );
}

function KpiMoney({ label, value, color, s }: { label: string; value: number; color: string; s: any }) {
  return (
    <View style={[s.kpi, { borderLeftColor: color }]}>
      <Text style={[s.kpiValue, { color, fontFamily: F.serif }]}>{value > 0 ? `₺${Math.round(value)}` : '—'}</Text>
      <Text style={s.kpiLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({ s, mod }: { s: any; mod?: string }) {
  return (
    <View style={s.empty}>
      <View style={s.emptyBox}><Text style={s.emptyIcon}>⚖</Text></View>
      <Text style={s.emptyTitle}>Henüz kayıt yok</Text>
      <Text style={s.emptySub}>{mod === 'avukat' ? 'Dosyalar' : 'Başvurular'} sekmesinden yeni dosya oluşturun.</Text>
    </View>
  );
}

const makeStyles = (C: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
    eyebrow: { fontFamily: F.sans, fontSize: 10, color: C.muted, letterSpacing: 1.5, marginBottom: 3 },
    logo: { fontFamily: F.sansBold, fontSize: 22, color: C.gold, letterSpacing: 0.5 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    themeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
    themeBtnText: { fontSize: 16 },
    avatarBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.goldTint, borderWidth: 1, borderColor: C.goldDim, justifyContent: 'center', alignItems: 'center' },
    avatarBtnText: { fontFamily: F.sansBold, fontSize: 15, color: C.gold },
    divider: { height: 1, backgroundColor: C.border, marginHorizontal: 20, marginBottom: 4 },
    section: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
    sectionLabel: { fontFamily: F.sans, fontSize: 10, color: C.faint, letterSpacing: 1.5, marginBottom: 12 },
    grid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    kpi: { flex: 1, backgroundColor: C.surface, borderRadius: 14, padding: 16, borderLeftWidth: 3, borderWidth: 1, borderColor: C.border },
    kpiValue: { fontSize: 30, lineHeight: 36 },
    kpiLabel: { fontFamily: F.sans, fontSize: 12, color: C.muted, marginTop: 4 },

    deadlineCard: { backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, borderLeftWidth: 3, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
    deadlinePill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6, alignItems: 'center', minWidth: 44 },
    deadlinePillNum: { fontFamily: F.sansBold, fontSize: 18, lineHeight: 22 },
    deadlinePillLabel: { fontFamily: F.sans, fontSize: 9, letterSpacing: 0.5 },
    deadlineName: { fontFamily: F.sansSemi, fontSize: 14, color: C.text },
    deadlineSub: { fontFamily: F.sans, fontSize: 12, color: C.muted, marginTop: 2 },
    esasNo: { fontFamily: F.sans, fontSize: 11, color: C.faint },

    emptySection: { paddingVertical: 16, alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border },
    emptySectionText: { fontFamily: F.sans, color: C.faint, fontSize: 13 },

    card: { backgroundColor: C.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 8 },
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

    empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
    emptyBox: { width: 72, height: 72, backgroundColor: C.surface, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border, marginBottom: 20 },
    emptyIcon: { fontSize: 32 },
    emptyTitle: { fontFamily: F.sansBold, fontSize: 18, color: C.muted, marginBottom: 8 },
    emptySub: { fontFamily: F.sans, fontSize: 13, color: C.faint, textAlign: 'center', lineHeight: 20 },
  });
