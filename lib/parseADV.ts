import { ADVRow } from './types';

function num(v: string | undefined): number {
  if (!v || v === '-' || v === '#REF!' || v === '#DIV/0!' || v.trim() === '') return 0;
  return parseFloat(v.toString().replace(',', '.').replace('%', '')) || 0;
}

function str(v: string | undefined): string {
  if (!v || v === '#REF!' || v === '#DIV/0!') return '';
  return v.trim();
}

// Parses INFORMASI TAMBAHAN ADV sheet.
// Columns: NO, ADV, PRODUK, CS, REAL TIME LEAD, CLOSING, BOTOL,
//          TOTAL BOTOL BY PRODUCT, CR, CAQ, RATIO, AVG RATIO,
//          TOTAL TOTAL LEAD, TOTAL CLOSING, TOTAL BOTOL, AVG CR,
//          TOTAL RATIO, JUMLAH RETURE, RETURE RATE
export function parseADVData(raw: Record<string, string>[]): ADVRow[] {
  const find = (row: Record<string, string>, terms: string[]): string => {
    const key = Object.keys(row).find(k =>
      terms.some(t => k.toLowerCase().includes(t.toLowerCase()))
    );
    return key ? row[key] : '';
  };

  return raw
    .filter(row => {
      const adv = find(row, ['adv']);
      return adv && adv.trim() && adv !== '#REF!' && adv !== 'ADV' && adv !== 'JANGAN DIHAPUS NO';
    })
    .map(row => ({
      no:                 num(find(row, ['no'])),
      adv:                str(find(row, ['adv'])),
      produk:             str(find(row, ['produk'])),
      cs:                 str(find(row, ['cs'])),
      realtimeLead:       num(find(row, ['real time lead', 'realtime lead'])),
      closing:            num(find(row, ['closing'])),
      botol:              num(find(row, ['botol'])),
      totalBotolByProduct:num(find(row, ['total botol by product'])),
      cr:                 num(find(row, ['cr'])),
      caq:                num(find(row, ['caq'])),
      ratio:              num(find(row, ['ratio'])),
      avgRatio:           num(find(row, ['avg ratio'])),
      totalLead:          num(find(row, ['total total lead', 'total lead'])),
      totalClosing:       num(find(row, ['total closing'])),
      totalBotol:         num(find(row, ['total botol'])),
      avgCR:              num(find(row, ['avg cr'])),
      totalRatio:         num(find(row, ['total ratio'])),
      jumlahRetur:        num(find(row, ['jumlah reture', 'jumlah retur'])),
      returRate:          num(find(row, ['reture rate', 'retur rate'])),
    }));
}
