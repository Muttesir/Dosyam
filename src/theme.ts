export const F = {
  sans:        'Inter_500Medium',
  sansSemi:    'Inter_600SemiBold',
  sansBold:    'Inter_700Bold',
  serif:       'InstrumentSerif_400Regular',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
};

export interface ThemeColors {
  bg: string; bgRaised: string; surface: string; surface2: string;
  border: string; borderSoft: string;
  text: string; textDim: string; muted: string; faint: string;
  gold: string; goldDim: string; goldTint: string;
  crimson: string; crimsonTint: string;
  greenBright: string; green: string; greenTint: string;
  blue: string; blueTint: string;
  orange: string; orangeTint: string;
  purple: string; purpleTint: string;
}

// ── Koyu tema — adliye ceviz ahşabı ──────────────────────────
export const darkTheme: ThemeColors = {
  bg:          '#111210',
  bgRaised:    '#161513',
  surface:     '#1D1B18',
  surface2:    '#232118',
  border:      'rgba(255,248,235,0.08)',
  borderSoft:  'rgba(255,248,235,0.05)',
  text:        '#F2EBD9',
  textDim:     'rgba(242,235,217,0.65)',
  muted:       'rgba(242,235,217,0.40)',
  faint:       'rgba(242,235,217,0.22)',
  gold:        '#D2AE63',
  goldDim:     '#8B6E35',
  goldTint:    '#1E1608',
  crimson:     '#B5322A',
  crimsonTint: '#1E0908',
  greenBright: '#3DBF72',
  green:       '#2D9C5A',
  greenTint:   '#0A1C10',
  blue:        '#3A82C4',
  blueTint:    '#0A1622',
  orange:      '#C97B45',
  orangeTint:  '#1E1008',
  purple:      '#8A6DBF',
  purpleTint:  '#130E1E',
};

// ── Açık tema — adliye parşömen/krem ─────────────────────────
export const lightTheme: ThemeColors = {
  bg:          '#F5F1E8',
  bgRaised:    '#EDE8DC',
  surface:     '#FFFCF5',
  surface2:    '#F0EBE0',
  border:      'rgba(30,20,5,0.10)',
  borderSoft:  'rgba(30,20,5,0.06)',
  text:        '#1A1710',
  textDim:     'rgba(26,23,16,0.65)',
  muted:       'rgba(26,23,16,0.45)',
  faint:       'rgba(26,23,16,0.28)',
  gold:        '#A07820',
  goldDim:     '#C9A040',
  goldTint:    '#F5E8C8',
  crimson:     '#9B2820',
  crimsonTint: '#FADDDA',
  greenBright: '#1E9A52',
  green:       '#2D8050',
  greenTint:   '#D5F0E0',
  blue:        '#1A65A8',
  blueTint:    '#D5E8F8',
  orange:      '#A85E20',
  orangeTint:  '#F8E5D0',
  purple:      '#6A50A8',
  purpleTint:  '#E8E0F8',
};

// ── Badge sistemleri ─────────────────────────────────────────

export function getSonucBadge(C: ThemeColors) {
  return {
    'anlasıldı': { bg: C.goldTint,    text: C.gold,        label: 'Anlaşıldı'   },
    tamamlandı:  { bg: C.greenTint,   text: C.greenBright,  label: 'Tamamlandı'  },
    olumsuz:     { bg: C.crimsonTint, text: C.crimson,      label: 'Olumsuz'     },
    dava:        { bg: C.orangeTint,  text: C.orange,       label: 'Dava Açıldı' },
    beklemede:   { bg: C.blueTint,    text: C.blue,         label: 'Beklemede'   },
    rapor:       { bg: C.purpleTint,  text: C.purple,       label: 'Rapor Hazır' },
    diger:       { bg: C.surface2,   text: C.muted,        label: 'Diğer'       },
  };
}

export function getDurumBadge(C: ThemeColors) {
  return {
    yeni:         { bg: C.blueTint,    text: C.blue        },
    kesif:        { bg: C.goldTint,    text: C.gold        },
    hazirlaniyor: { bg: C.orangeTint,  text: C.orange      },
    teslim:       { bg: C.greenTint,   text: C.greenBright },
    durusma:      { bg: C.purpleTint,  text: C.purple      },
  };
}

export function getOdemeBadge(C: ThemeColors) {
  return {
    bekliyor: { bg: C.crimsonTint, text: C.crimson,     label: 'Ödenmedi' },
    kismi:    { bg: C.orangeTint,  text: C.orange,      label: 'Kısmi'    },
    odendi:   { bg: C.greenTint,   text: C.greenBright, label: 'Ödendi'   },
  };
}

export const DURUM_LABEL: Record<string, string> = {
  yeni:         'Görevlendirme',
  kesif:        'Keşif',
  hazirlaniyor: 'Hazırlanıyor',
  teslim:       'Teslim Edildi',
  durusma:      'Duruşma',
};

export function teslimGun(teslimTarihi?: string): number | null {
  if (!teslimTarihi) return null;
  return Math.ceil((new Date(teslimTarihi).getTime() - Date.now()) / 86400000);
}

export function teslimMetin(gun: number): string {
  if (gun < 0) return `${Math.abs(gun)} gün gecikti`;
  if (gun === 0) return 'Bugün teslim!';
  return `${gun} gün kaldı`;
}

export function avatarColor(C: ThemeColors, name: string): string {
  const p = [C.blueTint, C.goldTint, C.greenTint, C.crimsonTint, C.purpleTint, C.orangeTint];
  let h = 0; for (const c of name) h += c.charCodeAt(0);
  return p[h % p.length];
}

export function avatarBorderColor(C: ThemeColors, name: string): string {
  const p = [C.blue, C.gold, C.greenBright, C.crimson, C.purple, C.orange];
  let h = 0; for (const c of name) h += c.charCodeAt(0);
  return p[h % p.length] + '55';
}

export function zamanDamgasi(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const dk = Math.floor(diff / 60000);
  if (dk < 1)  return 'Az önce';
  if (dk < 60) return `${dk} dk`;
  const sa = Math.floor(dk / 60);
  if (sa < 24) return `${sa} saat`;
  const gun = Math.floor(sa / 24);
  if (gun < 7) return `${gun} gün önce`;
  return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
}

export const AVUKAT_DURUM_LABEL: Record<string, string> = {
  yeni:         'Yeni',
  kesif:        'İnceleme',
  hazirlaniyor: 'Aktif',
  teslim:       'Karar Bekleniyor',
  durusma:      'Duruşmada',
};

export const DAVA_TURLERI = [
  'İş Davası', 'Boşanma', 'İcra Takibi', 'Ceza Davası',
  'Tazminat', 'İdare Davası', 'Ticaret Davası', 'Diğer',
];

export function initials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
