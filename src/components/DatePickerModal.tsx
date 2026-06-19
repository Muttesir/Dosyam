import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { F, ThemeColors } from '../theme';
import { useTheme } from '../context/ThemeContext';

const AYLAR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const GUNLER = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'];
const W = Dimensions.get('window').width;
const CELL = Math.floor((W - 80) / 7);

function firstDayOffset(y: number, m: number): number {
  const d = new Date(y, m, 1).getDay();
  return d === 0 ? 6 : d - 1;
}
function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}
function toStr(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function parseDate(s: string): Date | null {
  if (!s || s.length < 10) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

interface Props {
  visible: boolean;
  value?: string;
  onSelect: (date: string) => void;
  onClose: () => void;
}

export default function DatePickerModal({ visible, value, onSelect, onClose }: Props) {
  const { C } = useTheme();
  const s = useMemo(() => makeStyles(C), [C]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const init = parseDate(value ?? '') ?? new Date();

  const [year,     setYear]     = useState(init.getFullYear());
  const [month,    setMonth]    = useState(init.getMonth());
  const [selected, setSelected] = useState(value || todayStr);

  useEffect(() => {
    if (visible) {
      const d = parseDate(value ?? '') ?? new Date();
      setYear(d.getFullYear());
      setMonth(d.getMonth());
      setSelected(value || todayStr);
    }
  }, [visible, value]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const offset = firstDayOffset(year, month);
  const days   = daysInMonth(year, month);
  const rows   = Math.ceil((offset + days) / 7);

  function onConfirm() {
    onSelect(selected);
  }

  const selParsed = parseDate(selected);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={s.card} activeOpacity={1} onPress={() => {}}>

          {/* Month nav */}
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
              <View key={g} style={[s.cell, { width: CELL }]}>
                <Text style={s.dayHeaderText}>{g}</Text>
              </View>
            ))}
          </View>

          {/* Grid */}
          <View style={s.grid}>
            {Array.from({ length: rows * 7 }).map((_, i) => {
              const day = i - offset + 1;
              if (day < 1 || day > days) {
                return <View key={i} style={[s.cell, { width: CELL }]} />;
              }
              const dateStr  = toStr(year, month, day);
              const isToday  = dateStr === todayStr;
              const isSel    = dateStr === selected;

              return (
                <TouchableOpacity
                  key={i}
                  style={[s.cell, { width: CELL }]}
                  onPress={() => setSelected(dateStr)}
                  activeOpacity={0.7}
                >
                  <View style={[s.dayNum, isToday && s.dayToday, isSel && !isToday && s.daySel]}>
                    <Text style={[
                      s.dayNumText,
                      isToday && s.dayTodayText,
                      isSel && !isToday && s.daySelText,
                    ]}>
                      {day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected label */}
          {selParsed && (
            <Text style={s.selLabel}>
              {selParsed.getDate()} {AYLAR[selParsed.getMonth()]} {selParsed.getFullYear()}
            </Text>
          )}

          {/* Buttons */}
          <View style={s.btnRow}>
            <TouchableOpacity style={s.btnCancel} onPress={onClose}>
              <Text style={s.btnCancelText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnConfirm} onPress={onConfirm}>
              <Text style={s.btnConfirmText}>Seç</Text>
            </TouchableOpacity>
          </View>

        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const makeStyles = (C: ThemeColors) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
    card: { backgroundColor: C.bgRaised, borderRadius: 20, padding: 20, width: W - 48, borderWidth: 1, borderColor: C.border },

    monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    navBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
    navBtnText: { fontFamily: F.sansBold, fontSize: 20, color: C.gold, lineHeight: 24 },
    monthLabel: { fontFamily: F.sansBold, fontSize: 17, color: C.text },

    dayHeaders: { flexDirection: 'row', marginBottom: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    cell: { height: 40, alignItems: 'center', justifyContent: 'center' },
    dayHeaderText: { fontFamily: F.sans, fontSize: 11, color: C.faint },

    dayNum: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    dayToday: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.gold },
    daySel: { backgroundColor: C.gold },
    dayNumText: { fontFamily: F.sansSemi, fontSize: 14, color: C.text },
    dayTodayText: { color: C.gold },
    daySelText: { color: C.bg, fontFamily: F.sansBold },

    selLabel: { fontFamily: F.sansSemi, color: C.gold, fontSize: 14, textAlign: 'center', marginTop: 12, marginBottom: 4 },

    btnRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
    btnCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
    btnCancelText: { fontFamily: F.sansSemi, color: C.muted, fontSize: 14 },
    btnConfirm: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.gold, alignItems: 'center' },
    btnConfirmText: { fontFamily: F.sansBold, color: C.bg, fontSize: 14 },
  });
