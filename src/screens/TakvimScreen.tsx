import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getBasvurular } from '../storage';
import { Basvuru } from '../types';
import { F, ThemeColors } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type EventType = 'teslim' | 'durusma' | 'sure';
type CalEvent = {
  date: string;
  type: EventType;
  label: string;
  sublabel: string;
  basvuru: Basvuru;
};

const AYLAR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const GUNLER = ['Pt','Sa','Ça','Pe','Cu','Ct','Pa'];
const CELL_W = Math.floor((Dimensions.get('window').width - 32) / 7);

function firstDayOffset(year: number, month: number): number {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function collectEvents(basvurular: Basvuru[]): Record<string, CalEvent[]> {
  const map: Record<string, CalEvent[]> = {};
  const add = (date: string, type: EventType, label: string, sublabel: string, b: Basvuru) => {
    const key = (date ?? '').slice(0, 10);
    if (!key || key.length < 10) return;
    if (!map[key]) map[key] = [];
    map[key].push({ date: key, type, label, sublabel, basvuru: b });
  };
  for (const b of basvurular) {
    if (b.teslimTarihi)   add(b.teslimTarihi, 'teslim', 'Teslim', b.esasNo ?? b.ad, b);
    if (b.durusmaTarihi)  add(b.durusmaTarihi, 'durusma', 'Duruşma', b.esasNo ?? b.ad, b);
    b.durusmalar?.forEach(d => add(d.tarih, 'durusma', d.saat ? `Duruşma ${d.saat}` : 'Duruşma', b.ad, b));
    b.sureler?.forEach(s => { if (!s.tamamlandi) add(s.tarih, 'sure', s.baslik, b.ad, b); });
  }
  return map;
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function TakvimScreen() {
  const { C } = useTheme();
  const nav = useNavigation<Nav>();
  const [basvurular, setBasvurular] = useState<Basvuru[]>([]);
  const s = useMemo(() => makeStyles(C), [C]);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(todayStr);

  useFocusEffect(useCallback(() => { getBasvurular().then(setBasvurular); }, []));

  const events = useMemo(() => collectEvents(basvurular), [basvurular]);

  const offset = firstDayOffset(year, month);
  const days = daysInMonth(year, month);
  const cells = offset + days;
  const rows = Math.ceil(cells / 7);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const selectedEvents = events[selected] ?? [];

  function eventColor(type: EventType): string {
    if (type === 'teslim') return C.orange;
    if (type === 'durusma') return C.purple;
    return C.crimson;
  }
  function eventBg(type: EventType): string {
    if (type === 'teslim') return C.orangeTint;
    if (type === 'durusma') return C.purpleTint;
    return C.crimsonTint;
  }

  const selectedLabel = (() => {
    if (selected === todayStr) return 'BUGÜN';
    const [y, m, d] = selected.split('-').map(Number);
    return `${d} ${AYLAR[m - 1]} ${y}`;
  })();

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.eyebrow}>TAKVİM</Text>
            <Text style={s.title}>Tarihler</Text>
          </View>
        </View>

        {/* Month navigator */}
        <View style={s.monthNav}>
          <TouchableOpacity style={s.navBtn} onPress={prevMonth}>
            <Text style={s.navBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={s.monthLabel}>{AYLAR[month]} {year}</Text>
          <TouchableOpacity style={s.navBtn} onPress={nextMonth}>
            <Text style={s.navBtnText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Day headers */}
        <View style={s.dayHeaders}>
          {GUNLER.map(g => (
            <View key={g} style={[s.dayHeaderCell, { width: CELL_W }]}>
              <Text style={s.dayHeaderText}>{g}</Text>
            </View>
          ))}
        </View>

        {/* Grid */}
        <View style={s.grid}>
          {Array.from({ length: rows * 7 }).map((_, i) => {
            const day = i - offset + 1;
            const isValid = day >= 1 && day <= days;
            if (!isValid) return <View key={i} style={[s.cell, { width: CELL_W }]} />;

            const dateStr = toDateStr(year, month, day);
            const dayEvents = events[dateStr] ?? [];
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selected;
            const isPast = dateStr < todayStr;

            const types = new Set(dayEvents.map(e => e.type));

            return (
              <TouchableOpacity
                key={i}
                style={[s.cell, { width: CELL_W }]}
                onPress={() => setSelected(dateStr)}
                activeOpacity={0.7}
              >
                <View style={[
                  s.dayNum,
                  isToday && s.dayToday,
                  isSelected && !isToday && s.daySelected,
                ]}>
                  <Text style={[
                    s.dayNumText,
                    isPast && !isToday && s.dayPastText,
                    isToday && s.dayTodayText,
                    isSelected && !isToday && s.daySelectedText,
                  ]}>{day}</Text>
                </View>
                <View style={s.dotRow}>
                  {types.has('teslim')  && <View style={[s.dot, { backgroundColor: C.orange }]} />}
                  {types.has('durusma') && <View style={[s.dot, { backgroundColor: C.purple }]} />}
                  {types.has('sure')    && <View style={[s.dot, { backgroundColor: C.crimson }]} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={s.legend}>
          <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: C.orange }]} /><Text style={s.legendText}>Teslim</Text></View>
          <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: C.purple }]} /><Text style={s.legendText}>Duruşma</Text></View>
          <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: C.crimson }]} /><Text style={s.legendText}>Süre</Text></View>
        </View>

        <View style={s.sectionDivider} />

        {/* Selected day events */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>{selectedLabel}</Text>
          {selectedEvents.length === 0 ? (
            <View style={s.emptyDay}>
              <Text style={s.emptyDayText}>Bu tarihte etkinlik yok</Text>
            </View>
          ) : (
            selectedEvents.map((e, i) => (
              <TouchableOpacity
                key={i}
                style={[s.eventCard, { borderLeftColor: eventColor(e.type) }]}
                onPress={() => nav.navigate('YeniBasvuru', { basvuru: e.basvuru })}
                activeOpacity={0.75}
              >
                <View style={[s.eventTypeBadge, { backgroundColor: eventBg(e.type) }]}>
                  <Text style={[s.eventTypeBadgeText, { color: eventColor(e.type) }]}>{e.label}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.eventName} numberOfLines={1}>{e.basvuru.ad}</Text>
                  <Text style={s.eventSub} numberOfLines={1}>{e.sublabel}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },

    header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
    eyebrow: { fontFamily: F.sans, fontSize: 10, color: C.muted, letterSpacing: 1.5, marginBottom: 3 },
    title: { fontFamily: F.sansBold, fontSize: 26, color: C.text },

    monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
    navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
    navBtnText: { fontFamily: F.sansBold, fontSize: 20, color: C.gold, lineHeight: 24 },
    monthLabel: { fontFamily: F.sansBold, fontSize: 18, color: C.text },

    dayHeaders: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 4 },
    dayHeaderCell: { alignItems: 'center' },
    dayHeaderText: { fontFamily: F.sans, fontSize: 11, color: C.faint },

    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginBottom: 8 },
    cell: { height: 52, alignItems: 'center', paddingVertical: 4 },
    dayNum: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    dayToday: { backgroundColor: C.gold },
    daySelected: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.gold },
    dayNumText: { fontFamily: F.sansSemi, fontSize: 14, color: C.text },
    dayPastText: { color: C.faint },
    dayTodayText: { color: C.bg, fontFamily: F.sansBold },
    daySelectedText: { color: C.gold },
    dotRow: { flexDirection: 'row', gap: 2, marginTop: 2, height: 6, alignItems: 'center' },
    dot: { width: 5, height: 5, borderRadius: 3 },

    legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingBottom: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontFamily: F.sans, fontSize: 11, color: C.muted },

    sectionDivider: { height: 1, backgroundColor: C.border, marginHorizontal: 16, marginBottom: 4 },
    section: { paddingHorizontal: 16, paddingTop: 16 },
    sectionLabel: { fontFamily: F.sans, fontSize: 10, color: C.faint, letterSpacing: 1.5, marginBottom: 12 },

    emptyDay: { paddingVertical: 24, alignItems: 'center' },
    emptyDayText: { fontFamily: F.sans, color: C.faint, fontSize: 13 },

    eventCard: { backgroundColor: C.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.border, borderLeftWidth: 3, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
    eventTypeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    eventTypeBadgeText: { fontFamily: F.sansSemi, fontSize: 11 },
    eventName: { fontFamily: F.sansSemi, fontSize: 14, color: C.text },
    eventSub: { fontFamily: F.sans, fontSize: 12, color: C.muted, marginTop: 1 },
  });
