import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth, db, uid } from './firebase';
import { Basvuru, Sonuc } from './types';

const CACHE = { b: 'cache_basvurular', s: 'cache_sonuclar' };

function bCol() { return collection(db, 'users', uid(), 'basvurular'); }
function sCol() { return collection(db, 'users', uid(), 'sonuclar'); }

async function readCache<T>(key: string): Promise<T[]> {
  try { const r = await AsyncStorage.getItem(key); return r ? JSON.parse(r) : []; }
  catch { return []; }
}
async function writeCache<T>(key: string, data: T[]) {
  try { await AsyncStorage.setItem(key, JSON.stringify(data)); } catch {}
}

// ── BAŞVURULAR ──────────────────────────────────────────────

export function normalizeBasvuru(raw: any): Basvuru {
  let durum = raw.durum;
  if (durum === 'gorüşüldü') durum = 'kesif';
  else if (durum === 'bekliyor') durum = 'hazirlaniyor';
  if (!['yeni', 'kesif', 'hazirlaniyor', 'teslim', 'durusma'].includes(durum)) durum = 'yeni';
  return { odemeDurumu: 'bekliyor', durusmalar: [], sureler: [], evraklar: [], ...raw, durum } as Basvuru;
}

export async function getBasvurular(): Promise<Basvuru[]> {
  const cached = await readCache<Basvuru>(CACHE.b);
  getDocs(query(bCol(), orderBy('olusturma', 'desc')))
    .then(snap => { writeCache(CACHE.b, snap.docs.map(docToBasvuru)); })
    .catch(() => {});
  if (cached.length > 0) return cached.map(normalizeBasvuru);
  const snap = await getDocs(query(bCol(), orderBy('olusturma', 'desc')));
  const data = snap.docs.map(docToBasvuru);
  writeCache(CACHE.b, data);
  return data;
}

function docToBasvuru(d: any): Basvuru {
  const { id: _id, ...rest } = d.data();
  return normalizeBasvuru({ id: d.id, ...rest });
}
function docToSonuc(d: any): Sonuc {
  const { id: _id, ...rest } = d.data();
  return { id: d.id, ...rest } as Sonuc;
}

export async function addBasvuru(b: Omit<Basvuru, 'id' | 'olusturma'>): Promise<void> {
  await addDoc(bCol(), { ...b, olusturma: new Date().toISOString() });
  const snap = await getDocs(query(bCol(), orderBy('olusturma', 'desc')));
  writeCache(CACHE.b, snap.docs.map(docToBasvuru));
}

export async function updateBasvuru(id: string, data: Partial<Basvuru>): Promise<void> {
  await updateDoc(doc(db, 'users', uid(), 'basvurular', id), data);
  const snap = await getDocs(query(bCol(), orderBy('olusturma', 'desc')));
  writeCache(CACHE.b, snap.docs.map(docToBasvuru));
}

export async function deleteBasvuru(id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid(), 'basvurular', id));
  const cached = await readCache<Basvuru>(CACHE.b);
  writeCache(CACHE.b, cached.filter(b => b.id !== id));
}

// ── SONUÇLAR ───────────────────────────────────────────────

export async function getSonuclar(): Promise<Sonuc[]> {
  const cached = await readCache<Sonuc>(CACHE.s);
  getDocs(query(sCol(), orderBy('olusturma', 'desc')))
    .then(snap => { writeCache(CACHE.s, snap.docs.map(docToSonuc)); })
    .catch(() => {});
  if (cached.length > 0) return cached;
  const snap = await getDocs(query(sCol(), orderBy('olusturma', 'desc')));
  const data = snap.docs.map(docToSonuc);
  writeCache(CACHE.s, data);
  return data;
}

export async function addSonuc(s: Omit<Sonuc, 'id' | 'olusturma'>): Promise<void> {
  await addDoc(sCol(), { ...s, olusturma: new Date().toISOString() });
  const snap = await getDocs(query(sCol(), orderBy('olusturma', 'desc')));
  writeCache(CACHE.s, snap.docs.map(docToSonuc));
}

export async function updateSonuc(id: string, data: Partial<Sonuc>): Promise<void> {
  await updateDoc(doc(db, 'users', uid(), 'sonuclar', id), data);
  const snap = await getDocs(query(sCol(), orderBy('olusturma', 'desc')));
  writeCache(CACHE.s, snap.docs.map(docToSonuc));
}

export async function deleteSonuc(id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid(), 'sonuclar', id));
  const cached = await readCache<Sonuc>(CACHE.s);
  writeCache(CACHE.s, cached.filter(s => s.id !== id));
}

export async function aktarToSonuc(
  basvuruId: string,
  sonuc: Sonuc['sonuc'],
  aciklama: string,
  mod?: 'bilirkisi' | 'avukat',
): Promise<void> {
  const cached = await readCache<Basvuru>(CACHE.b);
  let b = cached.find(x => x.id === basvuruId);
  if (!b) {
    // Cache boşsa doğrudan Firestore'dan çek
    const snap = await getDocs(query(bCol(), orderBy('olusturma', 'desc')));
    const all = snap.docs.map(d => normalizeBasvuru({ id: d.id, ...d.data() }));
    writeCache(CACHE.b, all);
    b = all.find(x => x.id === basvuruId);
    if (!b) return;
  }
  await addSonuc({
    ad: b.ad, telefon: b.telefon ?? '', tarih: b.tarih ?? '',
    konu: b.konu, talep: b.talep ?? '', ucret: b.ucret ?? '',
    sonuc, aciklama, kaynak_id: basvuruId,
    mod: mod ?? 'bilirkisi',
    ...(b.esasNo  ? { esasNo:  b.esasNo  } : {}),
    ...(b.mahkeme ? { mahkeme: b.mahkeme } : {}),
  });
  await deleteBasvuru(basvuruId);
}

export async function deleteAccount(password: string): Promise<void> {
  const user = auth.currentUser!;
  const credential = EmailAuthProvider.credential(user.email!, password);
  await reauthenticateWithCredential(user, credential);

  const basvurular = await getDocs(query(bCol(), orderBy('olusturma', 'desc')));
  await Promise.all(basvurular.docs.map(d => deleteDoc(doc(db, 'users', uid(), 'basvurular', d.id))));

  const sonuclar = await getDocs(query(sCol(), orderBy('olusturma', 'desc')));
  await Promise.all(sonuclar.docs.map(d => deleteDoc(doc(db, 'users', uid(), 'sonuclar', d.id))));

  await AsyncStorage.clear();
  await deleteUser(user);
}
