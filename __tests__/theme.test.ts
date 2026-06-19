import {
  getSonucBadge,
  getDurumBadge,
  getOdemeBadge,
  teslimGun,
  teslimMetin,
  zamanDamgasi,
  initials,
  DURUM_LABEL,
  AVUKAT_DURUM_LABEL,
  DAVA_TURLERI,
} from '../src/theme';

// Minimal ThemeColors mock
const C: any = {
  gold: '#C9A84C', goldTint: '#F5EDD8', goldDim: '#A88B3E',
  greenBright: '#3CB371', greenTint: '#D4EDDA',
  crimson: '#DC143C', crimsonTint: '#FADADD',
  orange: '#FFA500', orangeTint: '#FFE5B4',
  blue: '#4169E1', blueTint: '#D6E4FF',
  purple: '#6A0DAD', purpleTint: '#E6D5F5',
  muted: '#888', faint: '#AAA',
  surface: '#F5F5F5', surface2: '#E5E5E5',
  bg: '#FFF', text: '#111', border: '#DDD',
  borderSoft: '#EEE', bgRaised: '#FFF',
};

// ── getSonucBadge ────────────────────────────────────────────

describe('getSonucBadge', () => {
  const badges = getSonucBadge(C);

  const ALL_SONUC_TYPES = ['anlasıldı', 'tamamlandı', 'olumsuz', 'dava', 'beklemede', 'rapor', 'diger'];

  test.each(ALL_SONUC_TYPES)('"%s" türü için badge tanımlı', (key) => {
    expect((badges as any)[key]).toBeDefined();
    expect((badges as any)[key].bg).toBeTruthy();
    expect((badges as any)[key].text).toBeTruthy();
    expect((badges as any)[key].label).toBeTruthy();
  });

  it('"diger" badge label "Diğer" döner', () => {
    expect((badges as any)['diger'].label).toBe('Diğer');
  });
});

// ── getDurumBadge ────────────────────────────────────────────

describe('getDurumBadge', () => {
  const badges = getDurumBadge(C);
  const DURUM_KEYS = ['yeni', 'kesif', 'hazirlaniyor', 'teslim', 'durusma'];

  test.each(DURUM_KEYS)('"%s" durumu için badge tanımlı', (key) => {
    expect((badges as any)[key]).toBeDefined();
  });
});

// ── getOdemeBadge ────────────────────────────────────────────

describe('getOdemeBadge', () => {
  const badges = getOdemeBadge(C);

  it('bekliyor, kismi, odendi için badge döner', () => {
    expect(badges.bekliyor).toBeDefined();
    expect(badges.kismi).toBeDefined();
    expect(badges.odendi).toBeDefined();
  });
});

// ── DURUM_LABEL ──────────────────────────────────────────────

describe('DURUM_LABEL', () => {
  it('tüm durum key\'leri için label var', () => {
    const keys = ['yeni', 'kesif', 'hazirlaniyor', 'teslim', 'durusma'];
    keys.forEach(k => {
      expect(DURUM_LABEL[k as keyof typeof DURUM_LABEL]).toBeTruthy();
    });
  });

  it('bilirkişi yeni = "Görevlendirme"', () => {
    expect(DURUM_LABEL.yeni).toBe('Görevlendirme');
  });
});

describe('AVUKAT_DURUM_LABEL', () => {
  it('avukat yeni = "Yeni"', () => {
    expect(AVUKAT_DURUM_LABEL.yeni).toBe('Yeni');
  });

  it('bilirkişi ve avukat label\'ları birbirinden farklı', () => {
    expect(DURUM_LABEL.yeni).not.toBe(AVUKAT_DURUM_LABEL.yeni);
  });
});

// ── teslimGun ────────────────────────────────────────────────

describe('teslimGun', () => {
  it('undefined için null döner', () => {
    expect(teslimGun(undefined)).toBeNull();
  });

  it('boş string için null döner', () => {
    expect(teslimGun('')).toBeNull();
  });

  it('geçmiş tarih negatif döner', () => {
    expect(teslimGun('2020-01-01')).toBeLessThan(0);
  });

  it('gelecek tarih pozitif döner', () => {
    expect(teslimGun('2099-12-31')).toBeGreaterThan(0);
  });

  it('bugünün tarihi 0 veya 1 döner', () => {
    const today = new Date().toISOString().slice(0, 10);
    const gun = teslimGun(today);
    expect(gun).not.toBeNull();
    expect(Math.abs(gun!)).toBeLessThanOrEqual(1);
  });
});

// ── teslimMetin ──────────────────────────────────────────────

describe('teslimMetin', () => {
  it('negatif sayı için "X gün gecikti" döner', () => {
    expect(teslimMetin(-3)).toBe('3 gün gecikti');
  });

  it('pozitif sayı için "X gün kaldı" döner', () => {
    expect(teslimMetin(5)).toBe('5 gün kaldı');
  });

  it('0 için "Bugün teslim!" döner', () => {
    expect(teslimMetin(0)).toBe('Bugün teslim!');
  });
});

// ── zamanDamgasi ─────────────────────────────────────────────

describe('zamanDamgasi', () => {
  it('geçerli ISO string için string döner', () => {
    const result = zamanDamgasi('2024-06-01T10:00:00.000Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('boş string için "-" veya boş döner', () => {
    const result = zamanDamgasi('');
    expect(typeof result).toBe('string');
  });
});

// ── initials ─────────────────────────────────────────────────

describe('initials', () => {
  it('tek isim → tek harf', () => {
    expect(initials('Ahmet')).toBe('A');
  });

  it('ad soyad → iki harf', () => {
    expect(initials('Ahmet Yılmaz')).toBe('AY');
  });

  it('üç kelime → ilk + son kelimenin baş harfi', () => {
    expect(initials('Ahmet Mehmet Yılmaz')).toBe('AY');
  });

  it('boş string → "?" döner', () => {
    expect(initials('')).toBe('?');
  });

  it('büyük harfe çevirir', () => {
    expect(initials('ahmet yılmaz')).toBe('AY');
  });
});

// ── DAVA_TURLERI ─────────────────────────────────────────────

describe('DAVA_TURLERI', () => {
  it('dizi boş değil', () => {
    expect(DAVA_TURLERI.length).toBeGreaterThan(0);
  });

  it('"Diğer" en son', () => {
    expect(DAVA_TURLERI[DAVA_TURLERI.length - 1]).toBe('Diğer');
  });
});
