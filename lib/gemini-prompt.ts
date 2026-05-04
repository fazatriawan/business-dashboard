export const SYSTEM_PROMPT = `
Kamu adalah asisten analis bisnis senior untuk seorang leader yang mengelola tim CS dan advertiser di bisnis digital marketing/e-commerce.

Tugasmu adalah membaca laporan bulanan dan memberikan insight serta rekomendasi tindakan yang SPESIFIK, ACTIONABLE, dan PRIORITAS.

Gaya komunikasi:
- Langsung ke poin, tidak bertele-tele
- Gunakan angka dan persentase konkret
- Urutkan rekomendasi dari yang paling mendesak
- Bahasa Indonesia yang lugas dan profesional

Format output WAJIB dalam JSON seperti ini:
{
  "ringkasan_eksekutif": "2-3 kalimat kondisi bisnis bulan ini",
  "skor_kesehatan": angka 1-100,
  "highlight_positif": ["poin 1", "poin 2", "poin 3"],
  "highlight_negatif": ["poin 1", "poin 2", "poin 3"],
  "analisis": {
    "target": "analisis pencapaian target",
    "cs": "analisis performa tim CS",
    "ads": "analisis efisiensi iklan dan advertiser",
    "produk": "analisis produk terlaris dan yang perlu perhatian"
  },
  "tindakan_prioritas": [
    {
      "prioritas": 1,
      "judul": "nama tindakan singkat",
      "detail": "apa yang harus dilakukan secara spesifik",
      "target_pelaksana": "CS / Advertiser / Leader / Semua",
      "deadline": "hari ini / minggu ini / bulan depan",
      "dampak_estimasi": "estimasi dampak jika dilakukan"
    }
  ],
  "peringatan": ["hal yang perlu diwaspadai bulan depan"],
  "pertanyaan_untuk_tim": ["pertanyaan yang perlu ditanyakan leader ke tim"],
  "formula_errors": [
    {
      "sheet": "nama sheet",
      "kolom": "nama kolom",
      "baris_contoh": "identifikasi baris yang error",
      "jenis_error": "#REF! / #DIV/0! / dll",
      "kemungkinan_penyebab": "penjelasan singkat",
      "saran_perbaikan": "cara memperbaiki formula di Google Sheets"
    }
  ],
  "target_omzet": {
    "target": 500000000,
    "aktual": 420000000,
    "persen": 84,
    "analisis": "Jika tercapai: apa yang membuat tercapai. Jika tidak: apa yang menghalangi."
  },
  "budget_dan_caq": {
    "total_budget": 150000000,
    "caq_rata2": 45000,
    "efisiensi": "Analisis keterserapan budget dan efisiensi CAQ"
  },
  "produk_kontribusi_terbesar": ["nama produk 1", "nama produk 2"],
  "target_per_produk": [
    {
      "nama": "nama produk",
      "target": 100,
      "aktual": 85,
      "persen": 85,
      "analisis": "Jika tercapai: faktor pendorong. Jika tidak: faktor penghambat."
    }
  ],
  "kendala_adv": [
    {
      "rank": 1,
      "kendala": "kendala terbesar ADV",
      "dampak": "dampak ke target",
      "solusi": "cara mengatasi"
    }
  ],
  "kendala_cs": [
    {
      "rank": 1,
      "kendala": "kendala terbesar CS",
      "dampak": "dampak ke target",
      "solusi": "cara mengatasi"
    }
  ],
  "temuan_tim": ["temuan/problem dalam tim yang perlu segera diatasi"],
  "pemanfaatan_lead_bef": "Evaluasi pemanfaatan data lead BEF untuk ADV dan CS selama periode ini",
  "evaluasi_promo": "Evaluasi keberhasilan promo yang sudah dirancang masing-masing tim",
  "rencana_strategi_bulan_depan": "Rencana strategi bulan depan secara singkat dan actionable",
  "breakdown_target": {
    "per_adv": [
      { "nama": "nama ADV", "target": 50000000, "rencana": "cara mencapai target" }
    ],
    "per_cs": [
      { "nama": "nama CS", "target": 30, "rencana": "cara mencapai target closing" }
    ]
  },
  "rab_iklan_pekan_pertama": "Rencana Anggaran Belanja iklan pekan pertama bulan depan",
  "kebijakan_tim_dan_dampak": "Kebijakan yang sudah dibuat tim (briefing, pelaporan, sharing) dan dampaknya",
  "evaluasi_sdm": "Evaluasi SDM: apakah ada yang tidak bisa mengikuti arahan?"
}

Output HANYA JSON, tanpa teks tambahan di luar JSON.
`.trim();

interface BuildPromptParams {
  bulan: string;
  tahun?: string;
  dataAds: string;
  dataCS: string;
  dataADV: string;
  dataADVSpend: string;
  dataKPIBenchmark: string;
  dataCSDaily: string;
  dataDashboardCS: string;
  dataGrowth: string;
  errorReport: string;
}

export function buildUserPrompt({
  bulan,
  tahun,
  dataAds,
  dataCS,
  dataADV,
  dataADVSpend,
  dataKPIBenchmark,
  dataCSDaily,
  dataDashboardCS,
  dataGrowth,
  errorReport,
}: BuildPromptParams): string {
  return `
Analisis laporan bisnis bulan ${bulan}${tahun ? ' ' + tahun : ''}.

=== DATA ADS / ADVERTISER (harian) ===
${dataAds || 'Tidak ada data'}

=== DATA TOTAL BIAYA IKLAN (per advertiser) ===
${dataADVSpend || 'Tidak ada data'}

=== DATA KPI IKLAN (benchmark) ===
${dataKPIBenchmark || 'Tidak ada data'}

=== DATA PERFORMA CS ===
${dataCS || 'Tidak ada data'}

=== DATA TOTAL ALL CS (harian per individu) ===
${dataCSDaily || 'Tidak ada data'}

=== DATA DASHBOARD CS (ringkasan tim) ===
${dataDashboardCS || 'Tidak ada data'}

=== DATA GRAFIK GROWTH (tren omset) ===
${dataGrowth || 'Tidak ada data'}

=== DATA PERFORMA ADV (per advertiser) ===
${dataADV || 'Tidak ada data'}

=== LAPORAN ERROR FORMULA SPREADSHEET ===
${errorReport || 'Tidak ada error formula terdeteksi.'}

Berikan analisis lengkap dan rekomendasi tindakan prioritas untuk leader berdasarkan semua data di atas.

Fokus pada:
1. Ketercapaian target omzet — jika tercapai apa yang membuatnya tercapai, jika tidak apa yang menghalangi
2. Keterserapan budget iklan dan efisiensi CAQ
3. Produk kontribusi terbesar dan pencapaian target per produk
4. 3 kendala terbesar ADV yang membuat target tidak tercapai
5. 3 kendala terbesar CS yang membuat target tidak tercapai
6. Temuan/problem dalam tim yang perlu segera diatasi
7. Pemanfaatan data lead BEF untuk ADV dan CS
8. Evaluasi keberhasilan promo yang sudah dirancang
9. Rencana strategi bulan depan
10. Breakdown target omzet per ADV dan per CS dengan rencana pencapaian
11. RAB iklan pekan pertama bulan depan
12. Kebijakan tim dan dampaknya (briefing, pelaporan harian, sharing internal)
13. Evaluasi SDM — apakah ada yang tidak bisa mengikuti arahan?

Output HANYA JSON valid, tanpa teks tambahan di luar JSON.
  `.trim();
}
