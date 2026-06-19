import React, { useMemo, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { addBasvuru, aktarToSonuc, updateBasvuru } from '../storage';
import { Basvuru, Durusma, Evrak, Sonuc, SureItem } from '../types';
import { F, getOdemeBadge, DAVA_TURLERI, ThemeColors } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useMod } from '../context/ModContext';
import DatePickerModal from '../components/DatePickerModal';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'YeniBasvuru'>;

const BILIRKISI_DURUMLAR: { key: Basvuru['durum']; label: string }[] = [
  { key: 'yeni',         label: 'Görevlendirme' },
  { key: 'kesif',        label: 'Keşif'         },
  { key: 'hazirlaniyor', label: 'Hazırlanıyor'  },
  { key: 'teslim',       label: 'Teslim Edildi' },
  { key: 'durusma',      label: 'Duruşma'       },
];

const AVUKAT_DURUMLAR: { key: Basvuru['durum']; label: string }[] = [
  { key: 'yeni',         label: 'Yeni'               },
  { key: 'kesif',        label: 'İnceleme'            },
  { key: 'hazirlaniyor', label: 'Aktif'               },
  { key: 'teslim',       label: 'Karar Bekleniyor'   },
  { key: 'durusma',      label: 'Duruşmada'          },
];

const ODEME_DURUMLAR: { key: Basvuru['odemeDurumu']; label: string }[] = [
  { key: 'bekliyor', label: 'Ödenmedi'     },
  { key: 'kismi',   label: 'Kısmi Ödendi' },
  { key: 'odendi',  label: 'Ödendi'       },
];

const SONUCLAR: { key: Sonuc['sonuc']; label: string }[] = [
  { key: 'anlasıldı',  label: 'Anlaşıldı'   },
  { key: 'tamamlandı', label: 'Tamamlandı'  },
  { key: 'olumsuz',    label: 'Olumsuz'     },
  { key: 'dava',       label: 'Dava Açıldı' },
  { key: 'beklemede',  label: 'Beklemede'   },
  { key: 'rapor',      label: 'Rapor Hazır' },
  { key: 'diger',      label: 'Diğer'       },
];

const DEFAULT_EVRAKLAR: Evrak[] = [
  { id: '1', baslik: 'Vekaletname', tamamlandi: false },
  { id: '2', baslik: 'Dava Dilekçesi', tamamlandi: false },
  { id: '3', baslik: 'Bilirkişi Raporu', tamamlandi: false },
  { id: '4', baslik: 'Tebligat', tamamlandi: false },
  { id: '5', baslik: 'Karar', tamamlandi: false },
];

export default function YeniBasvuruScreen() {
  const { C } = useTheme();
  const { mod } = useMod();
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const existing = route.params?.basvuru;
  const today = new Date().toISOString().slice(0, 10);
  const isAvukat = mod === 'avukat';

  const s = useMemo(() => makeStyles(C), [C]);
  const ODEME_B = useMemo(() => getOdemeBadge(C), [C]);

  // Common fields
  const [ad,            setAd]            = useState(existing?.ad            ?? '');
  const [telefon,       setTelefon]       = useState(existing?.telefon       ?? '');
  const [konu,          setKonu]          = useState(existing?.konu          ?? '');
  const [talep,         setTalep]         = useState(existing?.talep         ?? '');
  const [ucret,         setUcret]         = useState(existing?.ucret         ?? '');
  const [durum,         setDurum]         = useState<Basvuru['durum']>(existing?.durum ?? 'yeni');
  const [odemeDurumu,   setOdemeDurumu]   = useState<Basvuru['odemeDurumu']>(existing?.odemeDurumu ?? 'bekliyor');
  const [esasNo,        setEsasNo]        = useState(existing?.esasNo        ?? '');
  const [mahkeme,       setMahkeme]       = useState(existing?.mahkeme       ?? '');

  // Bilirkişi fields
  const [tarih,         setTarih]         = useState(existing?.tarih         ?? today);
  const [teslimTarihi,  setTeslimTarihi]  = useState(existing?.teslimTarihi  ?? '');
  const [durusmaTarihi, setDurusmaTarihi] = useState(existing?.durusmaTarihi ?? '');

  // Avukat fields
  const [email,         setEmail]         = useState(existing?.email         ?? '');
  const [adres,         setAdres]         = useState(existing?.adres         ?? '');
  const [davaTuru,      setDavaTuru]      = useState(existing?.davaTuru      ?? '');
  const [durusmalar,    setDurusmalar]    = useState<Durusma[]>(existing?.durusmalar ?? []);
  const [sureler,       setSureler]       = useState<SureItem[]>(existing?.sureler ?? []);
  const [evraklar,      setEvraklar]      = useState<Evrak[]>(
    existing?.evraklar?.length ? existing.evraklar : (isAvukat && !existing ? DEFAULT_EVRAKLAR : [])
  );
  const [anlasilanUcret, setAnlasilanUcret] = useState(existing?.anlasilanUcret ?? '');
  const [tahsilEdilen,   setTahsilEdilen]   = useState(existing?.tahsilEdilen   ?? '');

  const [saving, setSaving] = useState(false);
  const [durusmaPickerFor, setDurusmaPickerFor] = useState<string | null>(null);
  const [surePickerFor,    setSurePickerFor]    = useState<string | null>(null);

  const kalanAlacak = (() => {
    const a = parseFloat(anlasilanUcret || '0') || 0;
    const t = parseFloat(tahsilEdilen || '0') || 0;
    return Math.max(0, a - t);
  })();

  // Duruşma helpers
  function addDurusma() {
    setDurusmalar(p => [...p, { id: Date.now().toString(), tarih: '', saat: '', mahkeme: '', not: '' }]);
  }
  function removeDurusma(id: string) { setDurusmalar(p => p.filter(d => d.id !== id)); }
  function updateDurusma(id: string, key: keyof Durusma, val: string) {
    setDurusmalar(p => p.map(d => d.id === id ? { ...d, [key]: val } : d));
  }

  // Süre helpers
  function addSure() {
    setSureler(p => [...p, { id: Date.now().toString(), baslik: '', tarih: '', tamamlandi: false }]);
  }
  function removeSure(id: string) { setSureler(p => p.filter(s => s.id !== id)); }
  function updateSure(id: string, key: keyof SureItem, val: any) {
    setSureler(p => p.map(s => s.id === id ? { ...s, [key]: val } : s));
  }

  // Evrak helpers
  function toggleEvrak(id: string) {
    setEvraklar(p => p.map(e => e.id === id ? { ...e, tamamlandi: !e.tamamlandi } : e));
  }
  function addEvrak() {
    Alert.prompt('Evrak Ekle', 'Evrak adı:', (text) => {
      if (text?.trim()) {
        setEvraklar(p => [...p, { id: Date.now().toString(), baslik: text.trim(), tamamlandi: false }]);
      }
    });
  }
  function removeEvrak(id: string) { setEvraklar(p => p.filter(e => e.id !== id)); }

  async function onSave() {
    if (!ad.trim() || !konu.trim()) {
      Alert.alert('Eksik Alan', 'Ad Soyad ve Konu zorunludur.'); return;
    }
    setSaving(true);
    const data: Omit<Basvuru, 'id' | 'olusturma'> = {
      ad: ad.trim(), telefon, tarih, konu: konu.trim(), talep, ucret, durum, odemeDurumu,
      mod: existing?.mod ?? mod ?? 'bilirkisi',
      ...(esasNo.trim()        && { esasNo: esasNo.trim() }),
      ...(mahkeme.trim()       && { mahkeme: mahkeme.trim() }),
      ...(teslimTarihi.trim()  && { teslimTarihi: teslimTarihi.trim() }),
      ...(durusmaTarihi.trim() && { durusmaTarihi: durusmaTarihi.trim() }),
      ...(isAvukat && {
        email, adres, davaTuru, durusmalar, sureler, evraklar,
        anlasilanUcret, tahsilEdilen,
      }),
    };
    if (existing) await updateBasvuru(existing.id, data);
    else await addBasvuru(data);
    setSaving(false);
    nav.goBack();
  }

  function onAktar() {
    if (!existing) return;
    Alert.alert('Sonuçlandır', 'Hangi sonuçla aktarılsın?', [
      ...SONUCLAR.map(sn => ({ text: sn.label, onPress: () => showAciklamaPrompt(sn.key) })),
      { text: 'İptal', style: 'cancel' },
    ]);
  }

  function showAciklamaPrompt(sonuc: Sonuc['sonuc']) {
    Alert.prompt(
      SONUCLAR.find(sn => sn.key === sonuc)?.label ?? sonuc,
      'Açıklama (isteğe bağlı)',
      async (aciklama) => {
        if (aciklama === null) return;
        await aktarToSonuc(existing!.id, sonuc, aciklama ?? '', mod ?? 'bilirkisi');
        nav.goBack();
      },
      'plain-text', '', 'default'
    );
  }

  const durumlar = isAvukat ? AVUKAT_DURUMLAR : BILIRKISI_DURUMLAR;

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={s.back}>‹ Geri</Text>
          </TouchableOpacity>
          <Text style={s.title}>{existing ? 'Dosyayı Düzenle' : 'Yeni Dosya'}</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={s.headerDivider} />

        <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">

          {isAvukat ? (
            <>
              {/* ── AVUKAT FORMU ── */}
              <Text style={s.sectionLabel}>MÜVEKKİL BİLGİLERİ</Text>
              <Field label="AD SOYAD *" value={ad} onChange={setAd} placeholder="Ahmet Yılmaz" s={s} C={C} />
              <Field label="TELEFON" value={telefon} onChange={setTelefon} placeholder="0555 123 45 67" keyboardType="phone-pad" s={s} C={C} />
              <Field label="E-POSTA" value={email} onChange={setEmail} placeholder="ornek@email.com" keyboardType="email-address" s={s} C={C} />
              <Field label="ADRES" value={adres} onChange={setAdres} placeholder="Adres..." multiline s={s} C={C} />

              <View style={s.divider} />
              <Text style={s.sectionLabel}>DAVA BİLGİLERİ</Text>
              <Field label="ESAS NO" value={esasNo} onChange={setEsasNo} placeholder="2026/118 E." s={s} C={C} />
              <Field label="MAHKEME" value={mahkeme} onChange={setMahkeme} placeholder="İstanbul 4. Asliye Hukuk" s={s} C={C} />

              <Text style={s.label}>DAVA TÜRÜ</Text>
              <View style={s.chipRow}>
                {DAVA_TURLERI.map(dt => (
                  <TouchableOpacity
                    key={dt}
                    style={[s.chip, davaTuru === dt && s.chipActive]}
                    onPress={() => setDavaTuru(davaTuru === dt ? '' : dt)}
                  >
                    <Text style={[s.chipText, davaTuru === dt && s.chipTextActive]}>{dt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Field label="KONU *" value={konu} onChange={setKonu} placeholder="Davanın konusu" s={s} C={C} />
              <Field label="NOTLAR" value={talep} onChange={setTalep} placeholder="Dava hakkında notlar..." multiline s={s} C={C} />

              <View style={s.divider} />
              {/* Duruşmalar */}
              <View style={s.sectionRow}>
                <Text style={s.sectionLabel}>DURUŞMALAR</Text>
                <TouchableOpacity onPress={addDurusma} style={s.addBtn}>
                  <Text style={s.addBtnText}>+ Ekle</Text>
                </TouchableOpacity>
              </View>
              {durusmalar.length === 0 && (
                <Text style={s.emptyHint}>Duruşma tarihi eklemek için + Ekle butonuna basın.</Text>
              )}
              {durusmalar.map((d) => (
                <View key={d.id} style={s.arrayRow}>
                  <View style={s.arrayRowTop}>
                    <TouchableOpacity
                      style={[s.arrayInput, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                      onPress={() => setDurusmaPickerFor(d.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontFamily: F.sans, color: d.tarih ? C.text : C.faint, fontSize: 13 }}>
                        {d.tarih ? formatDateTR(d.tarih) : 'Tarih seçin'}
                      </Text>
                      <Text style={{ fontSize: 14 }}>📅</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={[s.arrayInput, { width: 72 }]}
                      value={d.saat ?? ''}
                      onChangeText={v => updateDurusma(d.id, 'saat', v)}
                      placeholder="10:00"
                      placeholderTextColor={C.faint}
                    />
                    <TouchableOpacity onPress={() => removeDurusma(d.id)} style={s.removeBtn}>
                      <Text style={s.removeBtnText}>×</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={[s.arrayInput, { marginTop: 6 }]}
                    value={d.mahkeme ?? ''}
                    onChangeText={v => updateDurusma(d.id, 'mahkeme', v)}
                    placeholder="Mahkeme (isteğe bağlı)"
                    placeholderTextColor={C.faint}
                  />
                </View>
              ))}
              <DatePickerModal
                visible={durusmaPickerFor !== null}
                value={durusmalar.find(d => d.id === durusmaPickerFor)?.tarih ?? ''}
                onSelect={(date) => { if (durusmaPickerFor) updateDurusma(durusmaPickerFor, 'tarih', date); setDurusmaPickerFor(null); }}
                onClose={() => setDurusmaPickerFor(null)}
              />

              <View style={s.divider} />
              {/* Süreler */}
              <View style={s.sectionRow}>
                <Text style={s.sectionLabel}>SÜRELER</Text>
                <TouchableOpacity onPress={addSure} style={s.addBtn}>
                  <Text style={s.addBtnText}>+ Ekle</Text>
                </TouchableOpacity>
              </View>
              {sureler.length === 0 && (
                <Text style={s.emptyHint}>İstinaf, itiraz, cevap dilekçesi gibi süreler için + Ekle.</Text>
              )}
              {sureler.map((sItem) => (
                <View key={sItem.id} style={s.arrayRow}>
                  <View style={s.arrayRowTop}>
                    <TouchableOpacity onPress={() => updateSure(sItem.id, 'tamamlandi', !sItem.tamamlandi)} style={s.checkBtn}>
                      <Text style={[s.checkBtnText, { color: sItem.tamamlandi ? C.greenBright : C.faint }]}>
                        {sItem.tamamlandi ? '✓' : '○'}
                      </Text>
                    </TouchableOpacity>
                    <TextInput
                      style={[s.arrayInput, { flex: 1 }]}
                      value={sItem.baslik}
                      onChangeText={v => updateSure(sItem.id, 'baslik', v)}
                      placeholder="İstinaf Son Günü..."
                      placeholderTextColor={C.faint}
                    />
                    <TouchableOpacity
                      style={[s.arrayInput, { width: 110, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                      onPress={() => setSurePickerFor(sItem.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontFamily: F.sans, color: sItem.tarih ? C.text : C.faint, fontSize: 12 }} numberOfLines={1}>
                        {sItem.tarih ? formatDateTR(sItem.tarih) : 'Tarih'}
                      </Text>
                      <Text style={{ fontSize: 12 }}>📅</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeSure(sItem.id)} style={s.removeBtn}>
                      <Text style={s.removeBtnText}>×</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <DatePickerModal
                visible={surePickerFor !== null}
                value={sureler.find(s => s.id === surePickerFor)?.tarih ?? ''}
                onSelect={(date) => { if (surePickerFor) updateSure(surePickerFor, 'tarih', date); setSurePickerFor(null); }}
                onClose={() => setSurePickerFor(null)}
              />

              <View style={s.divider} />
              {/* Evraklar */}
              <View style={s.sectionRow}>
                <Text style={s.sectionLabel}>EVRAKLAR</Text>
                <TouchableOpacity onPress={addEvrak} style={s.addBtn}>
                  <Text style={s.addBtnText}>+ Ekle</Text>
                </TouchableOpacity>
              </View>
              {evraklar.map(e => (
                <TouchableOpacity key={e.id} style={s.evrakRow} onPress={() => toggleEvrak(e.id)}>
                  <Text style={[s.evrakCheck, { color: e.tamamlandi ? C.greenBright : C.faint }]}>
                    {e.tamamlandi ? '✓' : '○'}
                  </Text>
                  <Text style={[s.evrakLabel, e.tamamlandi && s.evrakDone]} numberOfLines={1}>{e.baslik}</Text>
                  <TouchableOpacity onPress={() => removeEvrak(e.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={s.removeBtnText}>×</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}

              <View style={s.divider} />
              {/* Finans */}
              <Text style={s.sectionLabel}>FİNANS</Text>
              <Field label="ANLAŞILAN ÜCRET (₺)" value={anlasilanUcret} onChange={setAnlasilanUcret} placeholder="0" keyboardType="decimal-pad" s={s} C={C} />
              <Field label="TAHSİL EDİLEN (₺)" value={tahsilEdilen} onChange={setTahsilEdilen} placeholder="0" keyboardType="decimal-pad" s={s} C={C} />
              {(parseFloat(anlasilanUcret || '0') > 0) && (
                <View style={s.kalanRow}>
                  <Text style={s.kalanLabel}>KALAN ALACAK</Text>
                  <Text style={[s.kalanValue, { color: kalanAlacak > 0 ? C.crimson : C.greenBright }]}>
                    ₺{kalanAlacak.toFixed(0)}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              {/* ── BİLİRKİŞİ FORMU ── */}
              <Text style={s.sectionLabel}>DOSYA BİLGİLERİ</Text>
              <Field label="ESAS NUMARASI" value={esasNo} onChange={setEsasNo} placeholder="2026/118 E." s={s} C={C} />
              <Field label="MAHKEME" value={mahkeme} onChange={setMahkeme} placeholder="İstanbul 4. Asliye Hukuk Mahkemesi" s={s} C={C} />
              <DatePickerField label="TESLİM TARİHİ" value={teslimTarihi} onChange={setTeslimTarihi} s={s} C={C} />
              <DatePickerField label="DURUŞMA TARİHİ" value={durusmaTarihi} onChange={setDurusmaTarihi} s={s} C={C} />

              <View style={s.divider} />
              <Text style={s.sectionLabel}>TARAF BİLGİLERİ</Text>
              <Field label="AD SOYAD *" value={ad} onChange={setAd} placeholder="Ahmet Yılmaz" s={s} C={C} />
              <Field label="TELEFON" value={telefon} onChange={setTelefon} placeholder="0555 123 45 67" keyboardType="phone-pad" s={s} C={C} />
              <DatePickerField label="GÖREV TARİHİ" value={tarih} onChange={setTarih} s={s} C={C} />
              <Field label="KONU *" value={konu} onChange={setKonu} placeholder="Trafik kazası tazminat davası" s={s} C={C} />
              <Field label="GÖREV SORULARI / AÇIKLAMA" value={talep} onChange={setTalep} placeholder="Mahkemenin bilirkişiden talep ettiği hususlar..." multiline s={s} C={C} />
              <Field label="BİLİRKİŞİLİK ÜCRETİ (₺)" value={ucret} onChange={setUcret} placeholder="0" keyboardType="decimal-pad" s={s} C={C} />
            </>
          )}

          <View style={s.divider} />
          <Text style={s.sectionLabel}>AŞAMA</Text>
          <View style={s.chipRow}>
            {durumlar.map(d => (
              <TouchableOpacity
                key={d.key}
                style={[s.chip, durum === d.key && s.chipActive]}
                onPress={() => setDurum(d.key)}
              >
                <Text style={[s.chipText, durum === d.key && s.chipTextActive]}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.sectionLabel}>ÖDEME DURUMU</Text>
          <View style={s.chipRow}>
            {ODEME_DURUMLAR.map(od => {
              const badge = ODEME_B[od.key];
              const isActive = odemeDurumu === od.key;
              return (
                <TouchableOpacity
                  key={od.key}
                  style={[s.chip, isActive && { backgroundColor: badge.bg, borderColor: badge.text + '60' }]}
                  onPress={() => setOdemeDurumu(od.key)}
                >
                  <Text style={[s.chipText, isActive && { color: badge.text, fontFamily: F.sansSemi }]}>
                    {od.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={[s.btn, saving && { opacity: 0.6 }]} onPress={onSave} disabled={saving}>
            <Text style={s.btnText}>Kaydet</Text>
          </TouchableOpacity>

          {existing && (
            <TouchableOpacity style={s.btnSecondary} onPress={onAktar}>
              <Text style={s.btnSecondaryText}>⚖  Sonuçlandır →</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const AYLAR_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
function formatDateTR(iso: string): string {
  if (!iso || iso.length < 10) return iso;
  const [y, m, d] = iso.split('-');
  return `${parseInt(d, 10)} ${AYLAR_TR[parseInt(m, 10) - 1] ?? m} ${y}`;
}

function DatePickerField({ label, value, onChange, s, C }: {
  label: string; value: string; onChange: (t: string) => void;
  s: ReturnType<typeof makeStyles>; C: ThemeColors;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={s.fieldWrap}>
      <Text style={s.label}>{label}</Text>
      <TouchableOpacity style={s.dateField} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={[s.dateText, !value && { color: C.faint }]}>
          {value ? formatDateTR(value) : 'Tarih seçin'}
        </Text>
        <Text style={s.dateIcon}>📅</Text>
      </TouchableOpacity>
      <DatePickerModal
        visible={open}
        value={value}
        onSelect={(d) => { onChange(d); setOpen(false); }}
        onClose={() => setOpen(false)}
      />
    </View>
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
    headerDivider: { height: 1, backgroundColor: C.border, marginHorizontal: 20, marginBottom: 4 },
    form: { paddingHorizontal: 20, paddingTop: 16 },

    sectionLabel: { fontFamily: F.sans, fontSize: 10, color: C.faint, letterSpacing: 1.5, marginBottom: 14, marginTop: 4 },
    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    divider: { height: 1, backgroundColor: C.border, marginVertical: 16 },

    fieldWrap: { marginBottom: 16 },
    label: { fontFamily: F.sans, color: C.faint, fontSize: 10, letterSpacing: 1.2, marginBottom: 8 },
    input: { backgroundColor: C.surface, borderRadius: 14, padding: 14, fontFamily: F.sans, color: C.text, fontSize: 15, borderWidth: 1, borderColor: C.border },
    inputMulti: { minHeight: 80, textAlignVertical: 'top' },
    dateField: { backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dateText: { fontFamily: F.sans, color: C.text, fontSize: 15, flex: 1 },
    dateIcon: { fontSize: 18 },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
    chipActive: { backgroundColor: C.goldTint, borderColor: C.goldDim },
    chipText: { fontFamily: F.sans, color: C.muted, fontSize: 13 },
    chipTextActive: { fontFamily: F.sansSemi, color: C.gold },

    addBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
    addBtnText: { fontFamily: F.sansSemi, color: C.gold, fontSize: 12 },

    emptyHint: { fontFamily: F.sans, color: C.faint, fontSize: 12, marginBottom: 8, fontStyle: 'italic' },

    arrayRow: { backgroundColor: C.surface, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 8 },
    arrayRowTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    arrayInput: { backgroundColor: C.bg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontFamily: F.sans, color: C.text, fontSize: 13, borderWidth: 1, borderColor: C.border },
    removeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.crimsonTint, justifyContent: 'center', alignItems: 'center' },
    removeBtnText: { fontFamily: F.sansBold, color: C.crimson, fontSize: 16, lineHeight: 18 },
    checkBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
    checkBtnText: { fontSize: 18 },

    evrakRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.borderSoft },
    evrakCheck: { fontSize: 20, width: 24 },
    evrakLabel: { flex: 1, fontFamily: F.sans, color: C.text, fontSize: 14 },
    evrakDone: { color: C.faint, textDecorationLine: 'line-through' },

    kalanRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 16 },
    kalanLabel: { fontFamily: F.sans, color: C.faint, fontSize: 11, letterSpacing: 1 },
    kalanValue: { fontFamily: F.sansBold, fontSize: 20 },

    btn: { backgroundColor: C.gold, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10 },
    btnText: { fontFamily: F.sansBold, color: C.bg, fontSize: 15 },
    btnSecondary: { borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: C.gold },
    btnSecondaryText: { fontFamily: F.sansSemi, color: C.gold, fontSize: 14 },
  });
