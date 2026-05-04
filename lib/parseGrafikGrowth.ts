import { GrowthRow } from './types';

function num(v: string | undefined): number {
  if (!v || v === '-' || v.trim() === '') return 0;
  const cleaned = v.toString()
    .replace(/Rp/gi, '')
    .replace(/\./g, '')
    .replace(/,\d{2}(?:\s|$)/, '.$1')
    .replace(/,/g, '')
    .replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

// Parses Grafik Growth sheet.
// Simple 2-column: Date, Revenue (Omset)
export function parseGrafikGrowth(raw: Record<string, string>[]): GrowthRow[] {
  if (!raw.length) return [];

  const headers = Object.keys(raw[0]);
  const dateCol = headers[0];
  const omsetCol = headers[1];

  return raw
    .filter(row => {
      const date = str(row[dateCol]);
      return date && date.trim() && !date.toLowerCase().includes('date') && date.includes('/');
    })
    .map(row => ({
      date: str(row[dateCol]),
      omset: num(row[omsetCol]),
    }))
    .filter(r => r.omset > 0);
}

function str(v: string | undefined): string {
  if (!v) return '';
  return v.trim();
}
