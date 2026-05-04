import { CSDailyRow } from './types';

function num(v: string | undefined): number {
  if (!v || v === '-' || v === '#REF!' || v === '#DIV/0!' || v.trim() === '') return 0;
  const cleaned = v.toString()
    .replace(/Rp/gi, '')
    .replace(/\./g, '')
    .replace(/,\d{2}(?:\s|$)/, '.$1')
    .replace(/,/g, '')
    .replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

function pct(v: string | undefined): number {
  if (!v) return 0;
  return parseFloat(v.toString().replace(',', '.').replace('%', '')) || 0;
}

// Parses TOTAL ALL CS sheet.
// Wide format: each CS has columns: "CS [NAME] Whatsapp", "Closing ", "Botol", "CR", "Omset"
// First column is "Date".
// Last columns are "TOTAL WHATSAPP", "TOTAL CLOSING", "TOTAL BOTOL", "CR%", "OMSET".
export function parseTotalAllCS(raw: Record<string, string>[]): CSDailyRow[] {
  if (!raw.length) return [];

  const headers = Object.keys(raw[0]);
  const csGroups: { name: string; waCol: string; closingCol: string; botolCol: string; crCol: string; omsetCol: string }[] = [];

  // Scan headers to find CS column groups
  // Pattern: "CS NABILA Whatsapp" followed by "Closing ", "Botol", "CR", "Omset"
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].trim();
    const match = h.match(/^CS\s+(.+?)\s+Whatsapp$/i);
    if (match && i + 4 < headers.length) {
      const name = match[1].trim();
      const cols = headers.slice(i, i + 5);
      csGroups.push({
        name,
        waCol: cols[0],
        closingCol: cols[1],
        botolCol: cols[2],
        crCol: cols[3],
        omsetCol: cols[4],
      });
    }
  }

  // Fallback: match any header containing "Whatsapp" or "Closing" near a "CS" name
  if (csGroups.length === 0) {
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i].trim();
      if (h.toLowerCase().includes('whatsapp') && !h.toLowerCase().includes('total')) {
        // Try to extract CS name from nearby headers or from this header
        const nameMatch = h.match(/CS\s+(.+?)\s+Whatsapp/i);
        const name = nameMatch ? nameMatch[1].trim() : '';
        if (name && i + 4 < headers.length) {
          csGroups.push({
            name,
            waCol: headers[i],
            closingCol: headers[i + 1],
            botolCol: headers[i + 2],
            crCol: headers[i + 3],
            omsetCol: headers[i + 4],
          });
        }
      }
    }
  }

  const rows: CSDailyRow[] = [];

  for (const r of raw) {
    const date = (Object.values(r)[0] ?? '').trim();
    if (!date || date.toLowerCase().includes('date')) continue;

    for (const cs of csGroups) {
      const wa = num(r[cs.waCol]);
      const closing = num(r[cs.closingCol]);
      // Include even if zero to show all CS activity
      if (wa > 0 || closing > 0 || num(r[cs.omsetCol]) > 0) {
        rows.push({
          date,
          cs: cs.name,
          whatsapp: wa,
          closing,
          botol: num(r[cs.botolCol]),
          cr: pct(r[cs.crCol]),
          omset: num(r[cs.omsetCol]),
        });
      }
    }
  }

  return rows;
}
