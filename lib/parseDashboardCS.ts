import { DashboardCSRow } from './types';

function num(v: string | undefined): number {
  if (!v || v === '-' || v === '#REF!' || v === '#DIV/0!' || v.trim() === '') return 0;
  return parseFloat(v.toString().replace(',', '.').replace('%', '')) || 0;
}

function str(v: string | undefined): string {
  if (!v || v === '#REF!' || v === '#DIV/0!') return '';
  return v.trim();
}

// Parses DASHBOARD CS sheet.
// Columns: PRODUK, CS, PENCAPAIAN CS & TEAM LEAD, CLOSING, BOTOL, TARGET CR CS, TARGET CR TEAM, CR CS, KET CR CS, KET CR TEAM, AVG LEAD HARIAN, AVG CLOSING HARIAN
export function parseDashboardCS(raw: Record<string, string>[]): DashboardCSRow[] {
  const find = (row: Record<string, string>, terms: string[]): string => {
    const key = Object.keys(row).find(k =>
      terms.some(t => k.toLowerCase().includes(t.toLowerCase()))
    );
    return key ? row[key] : '';
  };

  return raw
    .filter(row => {
      const cs = str(find(row, ['cs']));
      return cs && cs.trim() && cs !== 'CS' && !cs.toLowerCase().includes('team');
    })
    .map(row => ({
      produk:          str(find(row, ['produk'])),
      cs:              str(find(row, ['cs'])),
      closing:         num(find(row, ['closing'])),
      botol:           num(find(row, ['botol'])),
      targetCRCS:      num(find(row, ['target cr cs'])),
      targetCRTeam:    num(find(row, ['target cr team'])),
      crCS:            num(find(row, ['cr cs'])),
      ketCRCS:         str(find(row, ['ket cr cs'])),
      ketCRTeam:       str(find(row, ['ket cr team'])),
      avgLeadHarian:   num(find(row, ['avg lead harian'])),
      avgClosingHarian:num(find(row, ['avg closing harian'])),
    }));
}
