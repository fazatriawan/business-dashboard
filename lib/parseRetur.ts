// Parser untuk data retur / refund / return

export interface ReturRow {
  date: string;
  produk: string;
  cs: string;
  adv: string;
  jumlah: number;
  nilai: number;
  alasan: string;
  status: 'open' | 'resolved' | 'pending';
}

const DATE_PATTERNS = [
  /(\d{2})[\-\/](\d{2})[\-\/](\d{4})/,           // DD/MM/YYYY atau DD-MM-YYYY
  /(\d{4})[\-\/](\d{2})[\-\/](\d{2})/,           // YYYY-MM-DD
  /(\d{1,2})\s+(\w+)\s+(\d{4})/i,               // 3 Mei 2026
];

const MONTH_MAP: Record<string, string> = {
  januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
  juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12',
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

function normalizeDate(val: string): string {
  val = val.trim();
  for (const re of DATE_PATTERNS) {
    const m = val.match(re);
    if (m) {
      if (re.source.startsWith('(\\d{4})')) {
        // YYYY-MM-DD
        return `${m[1]}-${m[2]}-${m[3]}`;
      }
      if (parseInt(m[3]) > 1000) {
        // DD/MM/YYYY
        return `${m[3]}-${m[2]}-${m[1]}`;
      }
    }
  }
  // Try Indonesian month name
  const m2 = val.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
  if (m2) {
    const month = MONTH_MAP[m2[2].toLowerCase()];
    if (month) {
      return `${m2[3]}-${month}-${m2[1].padStart(2, '0')}`;
    }
  }
  // Try ISO
  const d = Date.parse(val);
  if (!isNaN(d)) {
    return new Date(d).toISOString().split('T')[0];
  }
  return val;
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/[\s_]+/g, '');
}

function detectColumns(headers: string[]): Record<keyof ReturRow, string | null> {
  const map: Record<string, string[]> = {
    date: ['tanggal', 'tgl', 'date', 'tanggalkirim', 'tglretur', 'tglretur'],
    produk: ['produk', 'product', 'nama produk', 'item', 'namabarang', 'barang'],
    cs: ['cs', 'customerservice', 'nama cs', 'pic', 'nama'],
    adv: ['adv', 'advertiser', 'nama adv', 'advertiser'],
    jumlah: ['jumlah', 'qty', 'quantity', 'banyak', 'jml', 'jmlretur'],
    nilai: ['nilai', 'harga', 'total', 'nominal', 'rp', 'rupiah', 'amount', 'value'],
    alasan: ['alasan', 'reason', 'keterangan', 'ket', 'catatan', 'note', 'penyebab'],
    status: ['status', 'stts', 'kondisi', 'state'],
  };

  const result: Record<string, string | null> = {};
  for (const [key, candidates] of Object.entries(map)) {
    const found = headers.find(h => candidates.includes(normalizeHeader(h)));
    result[key] = found || null;
  }
  return result as Record<keyof ReturRow, string | null>;
}

export function parseReturCSV(rows: Record<string, string>[]): ReturRow[] {
  if (rows.length === 0) return [];
  const headers = Object.keys(rows[0]);
  const cols = detectColumns(headers);

  return rows.map(row => {
    const get = (col: string | null) => col ? (row[col] || '').trim() : '';

    const dateVal = get(cols.date);
    const jumlahVal = parseInt(get(cols.jumlah).replace(/[^\d]/g, '')) || 0;
    const nilaiVal = parseFloat(get(cols.nilai).replace(/[^\d.]/g, '')) || 0;
    const statusVal = get(cols.status).toLowerCase();

    let status: ReturRow['status'] = 'open';
    if (statusVal.includes('selesai') || statusVal.includes('resolve') || statusVal.includes('done')) status = 'resolved';
    else if (statusVal.includes('tunda') || statusVal.includes('pending') || statusVal.includes('proses')) status = 'pending';

    return {
      date: normalizeDate(dateVal),
      produk: get(cols.produk) || 'Tidak diketahui',
      cs: get(cols.cs) || '',
      adv: get(cols.adv) || '',
      jumlah: jumlahVal,
      nilai: nilaiVal,
      alasan: get(cols.alasan) || '',
      status,
    };
  }).filter(r => r.date && r.produk && r.produk !== 'Tidak diketahui');
}
