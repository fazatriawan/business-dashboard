import { CSRow } from './types';

function num(v: string | undefined): number {
  if (!v || v === '-' || v === '#REF!' || v === '#DIV/0!' || v.trim() === '') return 0;
  return parseFloat(v.toString().replace(',', '.').replace('%', '')) || 0;
}

function str(v: string | undefined): string {
  if (!v || v === '#REF!' || v === '#DIV/0!') return '';
  return v.trim();
}

// Parses INFORMASI TAMBAHAN CS sheet.
// Columns: NO, CS, ADV, PRODUK, PLATFORM, REAL TIME LEAD, CLOSING, BOTOL,
//          CR, RATIO, TOTAL LEAD, TOTAL CLOSING, TOTAL BOTOL, AVG CR,
//          TOTAL RATIO, JUMLAH RETURE, RETURE RATE, CROSS SELL, ...
export function parseCSData(raw: Record<string, string>[]): CSRow[] {
  const find = (row: Record<string, string>, terms: string[]): string => {
    const key = Object.keys(row).find(k =>
      terms.some(t => k.toLowerCase().includes(t.toLowerCase()))
    );
    return key ? row[key] : '';
  };

  return raw
    .filter(row => {
      const cs = find(row, ['cs']);
      return cs && cs.trim() && cs !== '#REF!' && cs !== 'CS';
    })
    .map(row => ({
      no:              num(find(row, ['no'])),
      cs:              str(find(row, ['cs'])),
      adv:             str(find(row, ['adv'])),
      produk:          str(find(row, ['produk'])),
      platform:        str(find(row, ['platform'])),
      realtimeLead:    num(find(row, ['real time lead', 'realtime lead'])),
      closing:         num(find(row, ['closing'])),
      botol:           num(find(row, ['botol'])),
      cr:              num(find(row, ['cr'])),
      ratio:           num(find(row, ['ratio'])),
      totalLead:       num(find(row, ['total lead'])),
      totalClosing:    num(find(row, ['total closing'])),
      totalBotol:      num(find(row, ['total botol'])),
      avgCR:           num(find(row, ['avg cr'])),
      totalRatio:      num(find(row, ['total ratio'])),
      jumlahRetur:     num(find(row, ['jumlah reture', 'jumlah retur'])),
      returRate:       num(find(row, ['reture rate', 'retur rate'])),
      crossSell:       str(find(row, ['cross sell'])),
    }));
}
