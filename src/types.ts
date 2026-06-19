export interface Durusma {
  id: string;
  tarih: string;
  saat?: string;
  mahkeme?: string;
  not?: string;
}

export interface SureItem {
  id: string;
  baslik: string;
  tarih: string;
  tamamlandi: boolean;
}

export interface Evrak {
  id: string;
  baslik: string;
  tamamlandi: boolean;
}

export interface Basvuru {
  id: string;
  ad: string;
  telefon: string;
  tarih: string;
  konu: string;
  talep: string;
  ucret: string;
  durum: 'yeni' | 'kesif' | 'hazirlaniyor' | 'teslim' | 'durusma';
  odemeDurumu: 'bekliyor' | 'kismi' | 'odendi';
  olusturma: string;
  // Bilirkişi
  esasNo?: string;
  mahkeme?: string;
  teslimTarihi?: string;
  durusmaTarihi?: string;
  mod?: 'bilirkisi' | 'avukat';
  // Avukat
  email?: string;
  adres?: string;
  davaTuru?: string;
  durusmalar?: Durusma[];
  sureler?: SureItem[];
  evraklar?: Evrak[];
  anlasilanUcret?: string;
  tahsilEdilen?: string;
}

export interface Sonuc {
  id: string;
  ad: string;
  telefon: string;
  tarih: string;
  konu: string;
  talep: string;
  ucret: string;
  sonuc: 'anlasıldı' | 'olumsuz' | 'dava' | 'tamamlandı' | 'beklemede' | 'rapor' | 'diger';
  aciklama: string;
  kaynak_id?: string;
  olusturma: string;
  esasNo?: string;
  mahkeme?: string;
  mod?: 'bilirkisi' | 'avukat';
}
