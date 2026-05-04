export interface SheetUrls {
  dataAds: string;
  totalBiayaIklan: string;
  totalAllCS: string;
}

export interface AdsRow {
  date: string;
  products: ProductAdsData[];
  total: TotalAdsData;
}

export interface ProductAdsData {
  name: string;
  budgetIklan: number;
  jumlahLead: number;
  closing: number;
  closingBotol: number;
  closingRate: number;
  biayaAcquisisiLead: number;
  biayaAcquisisiCustomer: number;
  biayaAcquisisiBottle: number;
  evaluasi: string;
  omset: number;
}

export interface TotalAdsData {
  totalBudget: number;
  totalLead: number;
  totalClosing: number;
  totalBotol: number;
  cr: number;
  omset: number;
  caq: number;           // Biaya Akuisisi Customer (Rp)
  evaluasiIklan: string; // SCALE | HOLD | OFF | DOWNSCALE
}

export interface KPISummary {
  totalBudget: number;
  totalLead: number;
  totalClosing: number;
  totalOmset: number;
  avgCR: number;
  avgCAQ: number;        // Average Biaya Akuisisi Customer (Rp)
  roas: number;
  evaluasiDominant: string;
}

// INFORMASI TAMBAHAN CS sheet
export interface CSRow {
  no: number;
  cs: string;
  adv: string;
  produk: string;
  platform: string;
  realtimeLead: number;
  closing: number;
  botol: number;
  cr: number;
  ratio: number;
  totalLead: number;
  totalClosing: number;
  totalBotol: number;
  avgCR: number;
  totalRatio: number;
  jumlahRetur: number;
  returRate: number;
  crossSell: string;
}

// INFORMASI TAMBAHAN ADV sheet
export interface ADVRow {
  no: number;
  adv: string;
  produk: string;
  cs: string;
  realtimeLead: number;
  closing: number;
  botol: number;
  totalBotolByProduct: number;
  cr: number;
  caq: number;
  ratio: number;
  avgRatio: number;
  totalLead: number;
  totalClosing: number;
  totalBotol: number;
  avgCR: number;
  totalRatio: number;
  jumlahRetur: number;
  returRate: number;
}

// ── NEW: KPI IKLAN (benchmark/target sheet) ──────────────────────────────────

export interface KPIBenchmark {
  produk: string;      // e.g. "PG", "HRB", "NMA", "NRA", "BAJ"
  channel: string;     // "WEBSITE" | "CTWA"
  metric: string;      // "CPR" | "CAQ" | "CAC" | "CR" | "UPSELL" | "RTS"
  value: number;
  maksimal: number;
  persentase: number;
}

// ── NEW: Total Biaya Iklan (per advertiser daily) ────────────────────────────

export interface ADVSpendRow {
  date: string;
  adv: string;
  topUp: number;
  selisih: number;
  budgetAktual: number;
  persentaseCAQ: number;
  rekomendasiTopUp: number;
  status: string;      // Scale Up | SCALE | HOLD | DO | OFF
  omset: number;
}

// ── NEW: TOTAL ALL CS (daily per CS) ─────────────────────────────────────────

export interface CSDailyRow {
  date: string;
  cs: string;
  whatsapp: number;
  closing: number;
  botol: number;
  cr: number;
  omset: number;
}

// ── NEW: DASHBOARD CS (team summary per produk) ──────────────────────────────

export interface DashboardCSRow {
  produk: string;
  cs: string;
  closing: number;
  botol: number;
  targetCRCS: number;
  targetCRTeam: number;
  crCS: number;
  ketCRCS: string;
  ketCRTeam: string;
  avgLeadHarian: number;
  avgClosingHarian: number;
}

// ── NEW: Grafik Growth (time-series omset) ───────────────────────────────────

export interface GrowthRow {
  date: string;
  omset: number;
}

// ── Report / AI Analysis enriched types ──────────────────────────────────────

export interface TindakanItem {
  prioritas: number;
  judul: string;
  detail: string;
  target_pelaksana: string;
  deadline: string;
  dampak_estimasi: string;
}

export interface KendalaItem {
  rank: number;
  kendala: string;
  dampak: string;
  solusi: string;
}

export interface ProdukTargetItem {
  nama: string;
  target: number;
  aktual: number;
  persen: number;
  analisis: string;
}

export interface BreakdownTarget {
  nama: string;
  target: number;
  rencana: string;
}

export interface AnalisisLengkap {
  ringkasan_eksekutif: string;
  skor_kesehatan: number;
  target_omzet: {
    target: number;
    aktual: number;
    persen: number;
    analisis: string;
  };
  budget_dan_caq: {
    total_budget: number;
    caq_rata2: number;
    efisiensi: string;
  };
  produk_kontribusi_terbesar: string[];
  target_per_produk: ProdukTargetItem[];
  kendala_adv: KendalaItem[];
  kendala_cs: KendalaItem[];
  temuan_tim: string[];
  pemanfaatan_lead_bef: string;
  evaluasi_promo: string;
  rencana_strategi_bulan_depan: string;
  breakdown_target: {
    per_adv: BreakdownTarget[];
    per_cs: BreakdownTarget[];
  };
  rab_iklan_pekan_pertama: string;
  kebijakan_tim_dan_dampak: string;
  evaluasi_sdm: string;
  data_retur: string;
  highlight_positif: string[];
  highlight_negatif: string[];
  analisis: {
    target: string;
    cs: string;
    ads: string;
    produk: string;
  };
  tindakan_prioritas: TindakanItem[];
  peringatan: string[];
  pertanyaan_untuk_tim: string[];
  formula_errors: {
    sheet: string;
    kolom: string;
    baris_contoh: string;
    jenis_error: string;
    kemungkinan_penyebab: string;
    saran_perbaikan: string;
  }[];
}
