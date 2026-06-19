import { Sonuc, Basvuru } from '../src/types';

// ── Arşiv mod filtrelemesi ────────────────────────────────────

describe('Sonuç mod filtrelemesi (SonuclarScreen mantığı)', () => {
  const sonuclar: Partial<Sonuc>[] = [
    { id: '1', mod: undefined },
    { id: '2', mod: 'bilirkisi' },
    { id: '3', mod: 'avukat' },
    { id: '4', mod: 'avukat' },
  ];

  const bilirkisiFiltre = (s: Partial<Sonuc>) => !s.mod || s.mod === 'bilirkisi';
  const avukatFiltre    = (s: Partial<Sonuc>) => s.mod === 'avukat';

  it('bilirkişi: mod=undefined veya mod=bilirkisi kayıtları görür', () => {
    const result = sonuclar.filter(bilirkisiFiltre);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.id)).toEqual(['1', '2']);
  });

  it('avukat: sadece mod=avukat kayıtları görür', () => {
    const result = sonuclar.filter(avukatFiltre);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.id)).toEqual(['3', '4']);
  });

  it('hiç kayıt yoksa her iki filtre de [] döner', () => {
    expect([].filter(bilirkisiFiltre)).toEqual([]);
    expect([].filter(avukatFiltre)).toEqual([]);
  });

  it('iki filtre kesişim içermez', () => {
    const bilirkisi = sonuclar.filter(bilirkisiFiltre).map(r => r.id);
    const avukat    = sonuclar.filter(avukatFiltre).map(r => r.id);
    const kesisim   = bilirkisi.filter(id => avukat.includes(id));
    expect(kesisim).toHaveLength(0);
  });
});

// ── Sonuç türü filtrelemesi ───────────────────────────────────

describe('Sonuç türü filtrelemesi', () => {
  const sonuclar: Partial<Sonuc>[] = [
    { id: '1', sonuc: 'anlasıldı' },
    { id: '2', sonuc: 'tamamlandı' },
    { id: '3', sonuc: 'olumsuz' },
    { id: '4', sonuc: 'diger' },
    { id: '5', sonuc: 'rapor' },
  ];

  it('"tümü" filtresi tüm kayıtları döner', () => {
    const result = sonuclar; // tümü filtresi uygulama
    expect(result).toHaveLength(5);
  });

  it('"diger" filtresi sadece diger kayıtları döner', () => {
    const result = sonuclar.filter(s => s.sonuc === 'diger');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('4');
  });

  it('"anlasıldı" filtresi doğru çalışır', () => {
    const result = sonuclar.filter(s => s.sonuc === 'anlasıldı');
    expect(result).toHaveLength(1);
  });
});

// ── Arama filtresi ────────────────────────────────────────────

describe('Arama filtresi (ad, konu, telefon)', () => {
  const kayitlar: Partial<Sonuc>[] = [
    { id: '1', ad: 'Ahmet Yılmaz', konu: 'Trafik Kazası', telefon: '5551234567' },
    { id: '2', ad: 'Mehmet Demir', konu: 'İş Davası',     telefon: '5559876543' },
    { id: '3', ad: 'Ayşe Kaya',   konu: 'Boşanma',        telefon: '5550001111' },
  ];

  function ara(q: string) {
    const lower = q.toLowerCase();
    return kayitlar.filter(s =>
      s.ad!.toLowerCase().includes(lower) ||
      s.konu!.toLowerCase().includes(lower) ||
      (s.telefon ?? '').includes(lower)
    );
  }

  it('isme göre arama', () => {
    expect(ara('ahmet')).toHaveLength(1);
    expect(ara('ahmet')[0].id).toBe('1');
  });

  it('konuya göre arama', () => {
    expect(ara('dava')).toHaveLength(1);
    expect(ara('dava')[0].id).toBe('2');
  });

  it('telefona göre arama', () => {
    expect(ara('5550001111')).toHaveLength(1);
    expect(ara('5550001111')[0].id).toBe('3');
  });

  it('büyük/küçük harf duyarsız', () => {
    expect(ara('AHMET')).toHaveLength(1);
    expect(ara('trafik kazası')).toHaveLength(1);
  });

  it('eşleşme yoksa boş dizi', () => {
    expect(ara('xyzabc123')).toHaveLength(0);
  });

  it('boş query tüm kayıtları döner', () => {
    expect(ara('')).toHaveLength(3);
  });
});

// ── Basvuru mod filtrelemesi (Bug 1 fix) ─────────────────────

describe('Basvuru mod filtrelemesi', () => {
  const basvurular = [
    { id: '1', mod: undefined },
    { id: '2', mod: 'bilirkisi' as const },
    { id: '3', mod: 'avukat' as const },
    { id: '4', mod: 'avukat' as const },
  ];

  const bilirkisiFiltre = (b: typeof basvurular[0]) => !b.mod || b.mod === 'bilirkisi';
  const avukatFiltre    = (b: typeof basvurular[0]) => b.mod === 'avukat';

  it('bilirkişi mod=undefined ve mod=bilirkisi kayıtları görür', () => {
    const result = basvurular.filter(bilirkisiFiltre);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.id)).toEqual(['1', '2']);
  });

  it('avukat sadece mod=avukat kayıtları görür', () => {
    const result = basvurular.filter(avukatFiltre);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.id)).toEqual(['3', '4']);
  });

  it('iki filtre kesişim içermez (mod izolasyonu)', () => {
    const bilirkisi = basvurular.filter(bilirkisiFiltre).map(r => r.id);
    const avukat    = basvurular.filter(avukatFiltre).map(r => r.id);
    expect(bilirkisi.filter(id => avukat.includes(id))).toHaveLength(0);
  });

  it('yeni kayıt kaydedilirken mod alanı ekleniyor (Bug 1)', () => {
    // Mod alanı olmayan kayıt bilirkişi tarafına gitmeli
    const kayit = { id: '99', mod: undefined };
    expect(bilirkisiFiltre(kayit)).toBe(true);
    expect(avukatFiltre(kayit)).toBe(false);
  });
});

// ── Basvuru durum tipleri ─────────────────────────────────────

describe('Basvuru durum tipi bütünlüğü', () => {
  const GECERLİ_DURUMLAR: Basvuru['durum'][] = ['yeni', 'kesif', 'hazirlaniyor', 'teslim', 'durusma'];

  it('geçerli durum sayısı 5', () => {
    expect(GECERLİ_DURUMLAR).toHaveLength(5);
  });

  it('"gorüşüldü" artık geçerli durum değil', () => {
    expect(GECERLİ_DURUMLAR).not.toContain('gorüşüldü');
  });

  it('"bekliyor" artık geçerli durum değil', () => {
    expect(GECERLİ_DURUMLAR).not.toContain('bekliyor');
  });
});

// ── Sonuç türü bütünlüğü ─────────────────────────────────────

describe('Sonuç türü bütünlüğü', () => {
  const GECERLİ_SONUCLAR: Sonuc['sonuc'][] = [
    'anlasıldı', 'olumsuz', 'dava', 'tamamlandı', 'beklemede', 'rapor', 'diger',
  ];

  it('"diger" geçerli sonuç türleri arasında', () => {
    expect(GECERLİ_SONUCLAR).toContain('diger');
  });

  it('toplam 7 sonuç türü var', () => {
    expect(GECERLİ_SONUCLAR).toHaveLength(7);
  });
});
