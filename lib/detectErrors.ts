const ERROR_PATTERNS = ['#REF!', '#DIV/0!', '#N/A', '#VALUE!', '#NAME?', '#NUM!', '#NULL!'];

export interface CellError {
  baris: string;       // row identifier (usually date or CS name)
  kolom: string;       // column header
  jenisError: string;  // #REF!, #DIV/0!, etc.
}

export interface FixProposal {
  baris: string;
  kolom: string;
  jenisError: string;
  saranFormula: string;
  penjelasan: string;
  approved: boolean;
}

export interface SheetErrorReport {
  namaSheet: string;
  errors: CellError[];
  totalErrors: number;
  kolomTerpengaruh: string[];
  fixProposals: FixProposal[];
}

export interface ErrorSummary {
  totalSemuaError: number;
  adaError: boolean;
  perSheet: SheetErrorReport[];
  byType: Record<string, number>;
  fixProposals: FixProposal[];
}

function generateFixProposal(error: CellError): FixProposal {
  let saranFormula = '';
  let penjelasan = '';

  switch (error.jenisError) {
    case '#REF!':
      saranFormula = `=IFERROR([formula_asli], 0)`;
      penjelasan = `#REF! terjadi karena referensi cell/range yang dirujuk tidak ditemukan (mungkin kolom dihapus atau sheet berubah). Gunakan IFERROR untuk menangani error, atau perbaiki referensi range yang benar.`;
      break;
    case '#DIV/0!':
      saranFormula = `=IFERROR([pembilang]/[penyebut], 0)`;
      penjelasan = `#DIV/0! terjadi karena pembagian dengan nol. Bungkus dengan IFERROR(..., 0) atau tambahkan IF(penyebut=0, 0, ...).`;
      break;
    case '#N/A':
      saranFormula = `=IFERROR(VLOOKUP(...), "Tidak ditemukan")`;
      penjelasan = `#N/A terjadi karena data yang dicari tidak ditemukan (misalnya VLOOKUP/INDEX-MATCH gagal). Pastikan data lookup ada, atau gunakan IFERROR.`;
      break;
    case '#VALUE!':
      saranFormula = `=VALUE([teks]) atau perbaiki tipe data`;
      penjelasan = `#VALUE! terjadi karena tipe data tidak cocok (misalnya teks dioperasikan matematika). Pastikan input berupa angka.`;
      break;
    case '#NAME?':
      saranFormula = `=NAMA_FUNGSI(...)`;
      penjelasan = `#NAME? terjadi karena nama fungsi tidak dikenali (typo atau fungsi tidak tersedia). Periksa ejaan fungsi.`;
      break;
    default:
      saranFormula = `=IFERROR([formula_asli], 0)`;
      penjelasan = `${error.jenisError} terjadi pada formula. Bungkus dengan IFERROR untuk menangani error gracefully.`;
  }

  return {
    baris: error.baris,
    kolom: error.kolom,
    jenisError: error.jenisError,
    saranFormula,
    penjelasan,
    approved: false,
  };
}

function scanSheet(raw: Record<string, string>[], namaSheet: string): SheetErrorReport {
  const errors: CellError[] = [];
  const kolomSet = new Set<string>();
  const fixProposals: FixProposal[] = [];

  for (const row of raw) {
    const entries = Object.entries(row);
    const baris = (entries[0]?.[1] ?? '').trim() || '—';

    for (const [kolom, val] of entries) {
      const v = (val ?? '').trim();
      if (ERROR_PATTERNS.includes(v)) {
        const error = { baris, kolom: kolom.trim(), jenisError: v };
        errors.push(error);
        kolomSet.add(kolom.trim());
        fixProposals.push(generateFixProposal(error));
      }
    }
  }

  return {
    namaSheet,
    errors,
    totalErrors: errors.length,
    kolomTerpengaruh: Array.from(kolomSet),
    fixProposals,
  };
}

export function buildErrorSummary(
  rawAds:  Record<string, string>[],
  rawCS:   Record<string, string>[],
  rawADV:  Record<string, string>[],
): ErrorSummary {
  const sheets = [
    scanSheet(rawAds,  'Laporan Harian Ads'),
    scanSheet(rawCS,   'Informasi Tambahan CS'),
    scanSheet(rawADV,  'Informasi Tambahan ADV'),
  ].filter(s => s.totalErrors > 0);

  const byType: Record<string, number> = {};
  const allFixProposals: FixProposal[] = [];

  for (const s of sheets) {
    for (const e of s.errors) {
      byType[e.jenisError] = (byType[e.jenisError] || 0) + 1;
    }
    allFixProposals.push(...s.fixProposals);
  }

  const totalSemuaError = sheets.reduce((sum, s) => sum + s.totalErrors, 0);

  return {
    totalSemuaError,
    adaError: totalSemuaError > 0,
    perSheet: sheets,
    byType,
    fixProposals: allFixProposals,
  };
}

export function formatErrorForPrompt(summary: ErrorSummary): string {
  if (!summary.adaError) return 'Tidak ada error formula yang terdeteksi.';

  const lines: string[] = [
    `Total error: ${summary.totalSemuaError}`,
    `Jenis error: ${Object.entries(summary.byType).map(([k, v]) => `${k} (${v}x)`).join(', ')}`,
    '',
  ];

  for (const s of summary.perSheet) {
    lines.push(`Sheet "${s.namaSheet}" — ${s.totalErrors} error:`);
    lines.push(`  Kolom terdampak: ${s.kolomTerpengaruh.join(', ')}`);
    const samples = s.errors.slice(0, 10);
    for (const e of samples) {
      lines.push(`  • Baris "${e.baris}", kolom "${e.kolom}" → ${e.jenisError}`);
    }
    if (s.errors.length > 10) {
      lines.push(`  ... dan ${s.errors.length - 10} error lainnya`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
