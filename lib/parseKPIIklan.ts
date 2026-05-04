import { KPIBenchmark } from './types';

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

// Parses KPI IKLAN benchmark sheet.
// Structure: each product-channel has 3 columns: METRIC, MAKSIMAL, Persentase
// Rows are metrics: CPR, CAQ, CAC, CR, UPSELL, RTS
export function parseKPIIklan(raw: Record<string, string>[]): KPIBenchmark[] {
  if (!raw.length) return [];

  const headers = Object.keys(raw[0]);
  const benchmarks: KPIBenchmark[] = [];

  // Group headers by product-channel
  // Pattern: "PG WEBSITE COST", "MAKSIMAL", "Persentase", "", "PG CTWA COST", "MAKSIMAL", "Persentase"
  // We need to find triplets of (metric_col, maksimal_col, persentase_col) that belong to a product-channel

  interface ColGroup {
    produk: string;
    channel: string;
    metricCol: string;
    maksimalCol: string;
    persenCol: string;
  }

  const groups: ColGroup[] = [];

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].trim();
    // Look for headers like "PG WEBSITE COST" or "PG CTWA COST"
    const match = h.match(/^([A-Z]+)\s+(WEBSITE|CTWA)\s+COST$/i);
    if (match && i + 2 < headers.length) {
      const produk = match[1].toUpperCase();
      const channel = match[2].toUpperCase();
      const maksimalCol = headers[i + 1]?.trim();
      const persenCol = headers[i + 2]?.trim();
      if (maksimalCol?.toLowerCase().includes('maksimal') || persenCol?.toLowerCase().includes('persentase')) {
        groups.push({ produk, channel, metricCol: h, maksimalCol, persenCol });
      }
    }
  }

  // Also try looser matching for different naming conventions
  if (groups.length === 0) {
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i].trim();
      const match = h.match(/^([A-Z]+)\s+(WEBSITE|CTWA)/i);
      if (match && i + 2 < headers.length) {
        const produk = match[1].toUpperCase();
        const channel = match[2].toUpperCase();
        const maksimalCol = headers[i + 1]?.trim();
        const persenCol = headers[i + 2]?.trim();
        groups.push({ produk, channel, metricCol: h, maksimalCol, persenCol });
      }
    }
  }

  for (const row of raw) {
    // Skip empty rows and header-like rows
    const firstVal = Object.values(row)[0]?.trim() || '';
    if (!firstVal || ['', 'metric', 'cpr', 'caq', 'cac', 'cr', 'upsell', 'rts'].includes(firstVal.toLowerCase())) {
      // This is a metric row
      const metric = firstVal.toUpperCase();
      if (!metric || metric === 'METRIC') continue;

      for (const g of groups) {
        const valStr = row[g.metricCol];
        const maksStr = row[g.maksimalCol];
        const pctStr = row[g.persenCol];
        if (valStr !== undefined) {
          benchmarks.push({
            produk: g.produk,
            channel: g.channel,
            metric,
            value: num(valStr),
            maksimal: num(maksStr),
            persentase: pct(pctStr),
          });
        }
      }
    }
  }

  return benchmarks;
}
