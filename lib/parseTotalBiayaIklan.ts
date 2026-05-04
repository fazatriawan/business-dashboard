import { ADVSpendRow } from './types';

function num(v: string | undefined): number {
  if (!v || v === '-' || v === '#REF!' || v === '#DIV/0!' || v.trim() === '') return 0;
  const cleaned = v.toString()
    .replace(/Rp/gi, '')
    .replace(/\./g, '')
    .replace(/,\d{2}(?:\s|$)/, '.$1')
    .replace(/,/g, '')
    .replace(/[^0-9.\-]/g, '');
  return parseFloat(cleaned) || 0;
}

function str(v: string | undefined): string {
  if (!v || v === '#REF!' || v === '#DIV/0!') return '';
  return v.trim();
}

// Parses Total Biaya iklan sheet.
// Wide format: each ADV has their own column group:
//   [ADV Name] Top Up Iklan, Selisih, Budget Iklan Aktual, Persentase CAQ, Rekomendasi Top Up, Status, Omset
// First column is "Tanggal".
// Last columns are "Total Top Up Iklan", "Selisih", "Budget Iklan Aktual", etc.
export function parseTotalBiayaIklan(raw: Record<string, string>[]): ADVSpendRow[] {
  if (!raw.length) return [];

  const headers = Object.keys(raw[0]);
  const advNames: { name: string; topUpCol: string; selisihCol: string; budgetCol: string; caqCol: string; rekomCol: string; statusCol: string; omsetCol: string }[] = [];

  // Scan headers to find ADV column groups
  // Pattern: "FAZA Top Up Iklan" followed by "Selisih", "Budget Iklan Aktual", etc.
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].trim();
    const match = h.match(/^([A-Za-z\s]+)\s+Top Up Iklan$/);
    if (match && i + 6 < headers.length) {
      const name = match[1].trim();
      // Check following columns match expected pattern
      const cols = headers.slice(i, i + 7);
      if (cols[1]?.toLowerCase().includes('selisih') &&
          cols[2]?.toLowerCase().includes('budget') &&
          cols[3]?.toLowerCase().includes('persentase') &&
          cols[4]?.toLowerCase().includes('rekomendasi') &&
          cols[5]?.toLowerCase().includes('status') &&
          cols[6]?.toLowerCase().includes('omset')) {
        advNames.push({
          name,
          topUpCol: cols[0],
          selisihCol: cols[1],
          budgetCol: cols[2],
          caqCol: cols[3],
          rekomCol: cols[4],
          statusCol: cols[5],
          omsetCol: cols[6],
        });
      }
    }
  }

  // Fallback: try matching by looking for "Top Up Iklan" anywhere in header
  if (advNames.length === 0) {
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i].trim();
      if (h.toLowerCase().includes('top up iklan') && !h.toLowerCase().includes('total')) {
        // Extract name: everything before "Top Up Iklan"
        const name = h.replace(/Top Up Iklan/i, '').trim();
        if (name && i + 6 < headers.length) {
          advNames.push({
            name,
            topUpCol: headers[i],
            selisihCol: headers[i + 1],
            budgetCol: headers[i + 2],
            caqCol: headers[i + 3],
            rekomCol: headers[i + 4],
            statusCol: headers[i + 5],
            omsetCol: headers[i + 6],
          });
        }
      }
    }
  }

  const rows: ADVSpendRow[] = [];

  for (const r of raw) {
    const date = (Object.values(r)[0] ?? '').trim();
    if (!date || date.toLowerCase().includes('tanggal')) continue;

    for (const adv of advNames) {
      const topUp = num(r[adv.topUpCol]);
      const budget = num(r[adv.budgetCol]);
      // Only include if there's actual data
      if (topUp > 0 || budget > 0) {
        rows.push({
          date,
          adv: adv.name,
          topUp,
          selisih: num(r[adv.selisihCol]),
          budgetAktual: budget,
          persentaseCAQ: num(r[adv.caqCol]),
          rekomendasiTopUp: num(r[adv.rekomCol]),
          status: str(r[adv.statusCol]),
          omset: num(r[adv.omsetCol]),
        });
      }
    }
  }

  return rows;
}
