import { normalizeBasvuru } from '../src/storage';

const base = {
  id: '1', ad: 'Test', telefon: '555', tarih: '2024-01-01',
  konu: 'Test konu', talep: '', ucret: '0',
  odemeDurumu: 'bekliyor' as const, olusturma: '2024-01-01T00:00:00Z',
};

// ── normalizeBasvuru ──────────────────────────────────────────

describe('normalizeBasvuru — durum göçü', () => {
  it('gorüşüldü → kesif', () => {
    expect(normalizeBasvuru({ ...base, durum: 'gorüşüldü' }).durum).toBe('kesif');
  });

  it('bekliyor → hazirlaniyor', () => {
    expect(normalizeBasvuru({ ...base, durum: 'bekliyor' }).durum).toBe('hazirlaniyor');
  });

  it('geçerli durum değişmez — yeni', () => {
    expect(normalizeBasvuru({ ...base, durum: 'yeni' }).durum).toBe('yeni');
  });

  it('geçerli durum değişmez — kesif', () => {
    expect(normalizeBasvuru({ ...base, durum: 'kesif' }).durum).toBe('kesif');
  });

  it('geçerli durum değişmez — hazirlaniyor', () => {
    expect(normalizeBasvuru({ ...base, durum: 'hazirlaniyor' }).durum).toBe('hazirlaniyor');
  });

  it('geçerli durum değişmez — teslim', () => {
    expect(normalizeBasvuru({ ...base, durum: 'teslim' }).durum).toBe('teslim');
  });

  it('geçerli durum değişmez — durusma', () => {
    expect(normalizeBasvuru({ ...base, durum: 'durusma' }).durum).toBe('durusma');
  });

  it('tanımsız durum → yeni', () => {
    expect(normalizeBasvuru({ ...base, durum: 'bilinmeyen' as any }).durum).toBe('yeni');
  });
});

describe('normalizeBasvuru — mod alanı', () => {
  it('mod alanı varsa korunur', () => {
    const r = normalizeBasvuru({ ...base, durum: 'yeni', mod: 'avukat' });
    expect((r as any).mod).toBe('avukat');
  });

  it('mod alanı yoksa undefined kalır (geriye dönük uyumluluk)', () => {
    const r = normalizeBasvuru({ ...base, durum: 'yeni' });
    expect((r as any).mod).toBeUndefined();
  });
});

describe('normalizeBasvuru — varsayılan diziler', () => {
  it('durusmalar yoksa [] döner', () => {
    const r = normalizeBasvuru({ ...base, durum: 'yeni' });
    expect(Array.isArray(r.durusmalar)).toBe(true);
    expect(r.durusmalar).toEqual([]);
  });

  it('sureler yoksa [] döner', () => {
    const r = normalizeBasvuru({ ...base, durum: 'yeni' });
    expect(Array.isArray(r.sureler)).toBe(true);
    expect(r.sureler).toEqual([]);
  });

  it('evraklar yoksa [] döner', () => {
    const r = normalizeBasvuru({ ...base, durum: 'yeni' });
    expect(Array.isArray(r.evraklar)).toBe(true);
    expect(r.evraklar).toEqual([]);
  });

  it('mevcut durusmalar korunur', () => {
    const durusmalar = [{ id: '1', tarih: '2024-06-01', saat: '10:00' }];
    const r = normalizeBasvuru({ ...base, durum: 'yeni', durusmalar });
    expect(r.durusmalar).toEqual(durusmalar);
  });

  it('odemeDurumu varsayılanı bekliyor', () => {
    const r = normalizeBasvuru({ ...base, durum: 'yeni' });
    expect(r.odemeDurumu).toBe('bekliyor');
  });
});
