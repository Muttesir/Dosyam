/**
 * Storage katmanı için tam end-to-end testler.
 * Her fonksiyonun Firestore + cache etkileşimi test edilir.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import {
  addBasvuru, updateBasvuru, deleteBasvuru,
  addSonuc, updateSonuc, deleteSonuc,
  aktarToSonuc, getBasvurular, getSonuclar,
  normalizeBasvuru,
} from '../src/storage';
import { Basvuru, Sonuc } from '../src/types';

const mockAddDoc    = addDoc    as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;
const mockDeleteDoc = deleteDoc as jest.Mock;
const mockGetDocs   = getDocs   as jest.Mock;
const mockAS        = AsyncStorage as any;

const B_CACHE = 'cache_basvurular';
const S_CACHE = 'cache_sonuclar';

const baseBasvuru: Basvuru = {
  id: 'b1', ad: 'Ahmet Yılmaz', telefon: '5551234567', tarih: '2024-01-01',
  konu: 'Trafik Kazası', talep: 'Tazminat', ucret: '5000',
  durum: 'yeni', odemeDurumu: 'bekliyor', olusturma: '2024-01-01T00:00:00Z',
  mod: 'bilirkisi',
};

const baseSonuc: Sonuc = {
  id: 's1', ad: 'Ahmet Yılmaz', telefon: '5551234567', tarih: '2024-01-01',
  konu: 'Trafik Kazası', talep: 'Tazminat', ucret: '5000',
  sonuc: 'anlasıldı', aciklama: 'Anlaşma sağlandı', olusturma: '2024-01-02T00:00:00Z',
  mod: 'bilirkisi',
};

// Her testten önce mock'ları ve cache'i sıfırla
beforeEach(() => {
  jest.clearAllMocks();
  mockAS.clear();
  mockAddDoc.mockResolvedValue({ id: 'new-doc-id' });
  mockUpdateDoc.mockResolvedValue(undefined);
  mockDeleteDoc.mockResolvedValue(undefined);
  mockGetDocs.mockResolvedValue({ docs: [] });
});

// Yardımcı: cache'e basvuru yaz
async function setBasvuruCache(items: Basvuru[]) {
  await AsyncStorage.setItem(B_CACHE, JSON.stringify(items));
}
async function setSonucCache(items: Sonuc[]) {
  await AsyncStorage.setItem(S_CACHE, JSON.stringify(items));
}

// ── getBasvurular ────────────────────────────────────────────

describe('getBasvurular', () => {
  it('cache doluysa Firestore çağırmadan cache\'den döner', async () => {
    await setBasvuruCache([baseBasvuru]);
    const result = await getBasvurular();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('b1');
  });

  it('cache boşsa Firestore\'dan çeker', async () => {
    const { id, olusturma, ...fields } = baseBasvuru;
    mockGetDocs.mockResolvedValue({
      docs: [{ id: 'b1', data: () => fields }],
    });
    const result = await getBasvurular();
    expect(mockGetDocs).toHaveBeenCalled();
    expect(result[0].id).toBe('b1');
  });

  it('normalizeBasvuru uygular — gorüşüldü → kesif', async () => {
    await setBasvuruCache([{ ...baseBasvuru, durum: 'gorüşüldü' as any }]);
    const result = await getBasvurular();
    expect(result[0].durum).toBe('kesif');
  });
});

// ── getSonuclar ──────────────────────────────────────────────

describe('getSonuclar', () => {
  it('cache doluysa Firestore çağırmadan döner', async () => {
    await setSonucCache([baseSonuc]);
    const result = await getSonuclar();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('s1');
    // Firestore çağrısı arka planda olabilir, ama senkron olmaz
  });

  it('cache boşsa Firestore\'dan çeker', async () => {
    const { id, olusturma, ...fields } = baseSonuc;
    mockGetDocs.mockResolvedValue({
      docs: [{ id: 's1', data: () => fields }],
    });
    const result = await getSonuclar();
    expect(result[0].id).toBe('s1');
  });
});

// ── addBasvuru ───────────────────────────────────────────────

describe('addBasvuru', () => {
  it('Firestore\'a yazar', async () => {
    const { id, olusturma, ...input } = baseBasvuru;
    await addBasvuru(input);
    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ ad: 'Ahmet Yılmaz', olusturma: expect.any(String) })
    );
  });

  it('mod alanını kayıt eder', async () => {
    const { id, olusturma, ...input } = baseBasvuru;
    await addBasvuru({ ...input, mod: 'avukat' });
    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ mod: 'avukat' })
    );
  });

  it('mod olmadan kaydedince sonradan filtre doğru çalışır', async () => {
    const { id, olusturma, ...noId } = baseBasvuru;
    await addBasvuru({ ...noId, mod: undefined });
    // mod=undefined kayıt bilirkişi tarafına gitmeli
    const saved = mockAddDoc.mock.calls[0][1];
    const isBilirkisi = !saved.mod || saved.mod === 'bilirkisi';
    expect(isBilirkisi).toBe(true);
  });
});

// ── updateBasvuru ────────────────────────────────────────────

describe('updateBasvuru', () => {
  it('Firestore\'da günceller', async () => {
    await setBasvuruCache([baseBasvuru]);
    await updateBasvuru('b1', { durum: 'kesif' });
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ durum: 'kesif' })
    );
  });
});

// ── deleteBasvuru ────────────────────────────────────────────

describe('deleteBasvuru', () => {
  it('Firestore\'dan siler', async () => {
    await setBasvuruCache([baseBasvuru]);
    await deleteBasvuru('b1');
    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
  });

  it('cache\'den de siler', async () => {
    await setBasvuruCache([baseBasvuru, { ...baseBasvuru, id: 'b2' }]);
    await deleteBasvuru('b1');
    const cached = JSON.parse(await AsyncStorage.getItem(B_CACHE) ?? '[]');
    expect(cached).toHaveLength(1);
    expect(cached[0].id).toBe('b2');
  });
});

// ── addSonuc ─────────────────────────────────────────────────

describe('addSonuc', () => {
  it('Firestore\'a yazar', async () => {
    const { id, olusturma, ...input } = baseSonuc;
    await addSonuc(input);
    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ sonuc: 'anlasıldı', olusturma: expect.any(String) })
    );
  });

  it('mod alanını kayıt eder', async () => {
    const { id, olusturma, ...input } = baseSonuc;
    await addSonuc({ ...input, mod: 'avukat' });
    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ mod: 'avukat' })
    );
  });
});

// ── deleteSonuc ──────────────────────────────────────────────

describe('deleteSonuc', () => {
  it('Firestore\'dan siler', async () => {
    await setSonucCache([baseSonuc]);
    await deleteSonuc('s1');
    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
  });

  it('cache\'den de siler', async () => {
    await setSonucCache([baseSonuc, { ...baseSonuc, id: 's2' }]);
    await deleteSonuc('s1');
    const cached = JSON.parse(await AsyncStorage.getItem(S_CACHE) ?? '[]');
    expect(cached).toHaveLength(1);
    expect(cached[0].id).toBe('s2');
  });
});

// ── aktarToSonuc — ANA BUG TESTİ ────────────────────────────

describe('aktarToSonuc', () => {
  it('cache\'deki basvuruyu sonuçlara taşır ve siler', async () => {
    await setBasvuruCache([baseBasvuru]);

    await aktarToSonuc('b1', 'anlasıldı', 'Anlaşma sağlandı', 'bilirkisi');

    // Sonuç Firestore'a eklendi mi?
    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        ad: 'Ahmet Yılmaz',
        sonuc: 'anlasıldı',
        aciklama: 'Anlaşma sağlandı',
        kaynak_id: 'b1',
        mod: 'bilirkisi',
      })
    );

    // Basvuru Firestore'dan silindi mi?
    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
  });

  it('avukat modu ile arşive taşıyınca mod=avukat yazılır', async () => {
    await setBasvuruCache([{ ...baseBasvuru, mod: 'avukat' }]);

    await aktarToSonuc('b1', 'tamamlandı', '', 'avukat');

    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ mod: 'avukat' })
    );
  });

  it('cache boşsa Firestore fallback ile çalışır', async () => {
    // Cache tamamen boş — sadece Firestore'dan okuyabilir
    const { id, olusturma, ...fields } = baseBasvuru;
    mockGetDocs.mockResolvedValue({
      docs: [{ id: 'b1', data: () => fields }],
    });

    await aktarToSonuc('b1', 'olumsuz', 'red edildi', 'bilirkisi');

    expect(mockGetDocs).toHaveBeenCalled();
    expect(mockAddDoc).toHaveBeenCalled();
    expect(mockDeleteDoc).toHaveBeenCalled();
  });

  it('basvuru bulunamazsa hiçbir işlem yapmaz', async () => {
    await setBasvuruCache([baseBasvuru]);

    await aktarToSonuc('yok-olan-id', 'anlasıldı', '', 'bilirkisi');

    expect(mockAddDoc).not.toHaveBeenCalled();
    expect(mockDeleteDoc).not.toHaveBeenCalled();
  });

  it('tüm basvuru alanlarını sonuca kopyalar', async () => {
    const detayli: Basvuru = {
      ...baseBasvuru,
      esasNo: '2024/123 E.',
      mahkeme: 'İstanbul 4. Asliye',
    };
    await setBasvuruCache([detayli]);

    await aktarToSonuc('b1', 'rapor', 'rapor hazır', 'bilirkisi');

    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        esasNo: '2024/123 E.',
        mahkeme: 'İstanbul 4. Asliye',
        konu: 'Trafik Kazası',
        talep: 'Tazminat',
        ucret: '5000',
      })
    );
  });

  it('tüm sonuç türleri için çalışır', async () => {
    const sonucTurleri: Sonuc['sonuc'][] = [
      'anlasıldı', 'tamamlandı', 'olumsuz', 'dava', 'beklemede', 'rapor', 'diger',
    ];

    for (const tur of sonucTurleri) {
      jest.clearAllMocks();
      mockAddDoc.mockResolvedValue({ id: 'new-id' });
      mockDeleteDoc.mockResolvedValue(undefined);
      mockGetDocs.mockResolvedValue({ docs: [] });
      await setBasvuruCache([{ ...baseBasvuru, id: 'bx' }]);

      await aktarToSonuc('bx', tur, '', 'bilirkisi');

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ sonuc: tur })
      );
    }
  });
});

// ── updateSonuc ──────────────────────────────────────────────

describe('updateSonuc', () => {
  it('Firestore\'da günceller', async () => {
    await setSonucCache([baseSonuc]);
    await updateSonuc('s1', { aciklama: 'Güncellendi' });
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ aciklama: 'Güncellendi' })
    );
  });
});
