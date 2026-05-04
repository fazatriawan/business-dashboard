import { AdsRow, ProductAdsData, TotalAdsData, KPISummary } from './types';

function parseRp(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.toString()
    .replace(/Rp/gi, '')
    .replace(/\./g, '')
    .replace(/,(\d{2})(?:\s|$)/, '.$1')
    .replace(/,/g, '')
    .replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

function parsePct(val: string | undefined): number {
  if (!val) return 0;
  return parseFloat(val.toString().replace(',', '.').replace('%', '')) || 0;
}

function parseNum(val: string | undefined): number {
  if (!val) return 0;
  return parseFloat(val.toString().replace(',', '.')) || 0;
}

function find(keys: string[], terms: string[]): string | undefined {
  return keys.find(k => terms.some(t => k.toLowerCase().includes(t.toLowerCase())));
}

function findLast(keys: string[], terms: string[]): string | undefined {
  return keys.findLast(k => terms.some(t => k.toLowerCase().includes(t.toLowerCase())));
}

// ── Product Detection ─────────────────────────────────────────────────────────

const KNOWN_PRODUCTS = ['PG', 'HRB', 'NMA', 'NRA', 'BAJ', 'MSD', 'AURORA', 'MIRACLE', 'ECO', 'PRO', 'LITE'];

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[_\-]+/g, ' ').trim();
}

function detectProducts(headers: string[]): { name: string; prefix: boolean }[] {
  const found = new Map<string, { name: string; prefix: boolean }>();

  for (const h of headers) {
    const norm = normalizeHeader(h);
    for (const prod of KNOWN_PRODUCTS) {
      const prodLower = prod.toLowerCase();
      // Pattern: "PG Budget Iklan" (prefix)
      if (norm.startsWith(prodLower + ' ') || norm.startsWith(prodLower + '_')) {
        if (!found.has(prod)) found.set(prod, { name: prod, prefix: true });
      }
      // Pattern: "Budget Iklan PG" (suffix)
      else if (norm.endsWith(' ' + prodLower) || norm.endsWith('_' + prodLower)) {
        if (!found.has(prod)) found.set(prod, { name: prod, prefix: false });
      }
      // Pattern: "PG" standalone or in middle
      else if (norm.includes(' ' + prodLower + ' ') || norm.includes('_' + prodLower + '_')) {
        if (!found.has(prod)) found.set(prod, { name: prod, prefix: norm.indexOf(prodLower) < norm.length / 2 });
      }
    }
  }

  return Array.from(found.values());
}

function findColumnForProduct(
  headers: string[],
  product: { name: string; prefix: boolean },
  metrics: string[][],
): string | undefined {
  for (const terms of metrics) {
    const found = headers.find(h => {
      const norm = normalizeHeader(h);
      const prodLower = product.name.toLowerCase();
      const hasProd = norm.includes(prodLower);
      const hasMetric = terms.some(t => norm.includes(t));
      if (!hasProd || !hasMetric) return false;

      // Ensure it's not a total column
      if (norm.includes('total') || norm.includes('all')) return false;

      return true;
    });
    if (found) return found;
  }
  return undefined;
}

export function parseProductsFromRow(
  row: Record<string, string>,
  headers: string[],
): ProductAdsData[] {
  const products = detectProducts(headers);
  if (products.length === 0) return [];

  const metricPatterns = {
    budgetIklan: [['budget iklan', 'biaya iklan', 'budget']],
    jumlahLead: [['jumlah lead', 'lead', 'jumlah']],
    closing: [['closing new', 'closing customer', 'closing']],
    closingBotol: [['closing botol', 'botol']],
    closingRate: [['closing rate', 'cr']],
    biayaAcquisisiLead: [['biaya akuisisi lead', 'akuisisi lead', 'bal']],
    biayaAcquisisiCustomer: [['biaya akuisisi customer', 'akuisisi customer', 'bac', 'caq']],
    biayaAcquisisiBottle: [['biaya akuisisi bottle', 'akuisisi bottle', 'bab']],
    evaluasi: [['evaluasi', 'status', 'keterangan']],
    omset: [['omset', 'revenue', 'total omset']],
  };

  return products.map(product => {
    const get = (patterns: string[][]) => {
      const key = findColumnForProduct(headers, product, patterns);
      return key ? row[key] : undefined;
    };

    return {
      name: product.name,
      budgetIklan: parseRp(get(metricPatterns.budgetIklan)),
      jumlahLead: parseNum(get(metricPatterns.jumlahLead)),
      closing: parseNum(get(metricPatterns.closing)),
      closingBotol: parseNum(get(metricPatterns.closingBotol)),
      closingRate: parsePct(get(metricPatterns.closingRate)),
      biayaAcquisisiLead: parseRp(get(metricPatterns.biayaAcquisisiLead)),
      biayaAcquisisiCustomer: parseRp(get(metricPatterns.biayaAcquisisiCustomer)),
      biayaAcquisisiBottle: parseRp(get(metricPatterns.biayaAcquisisiBottle)),
      evaluasi: (get(metricPatterns.evaluasi) || '').trim(),
      omset: parseRp(get(metricPatterns.omset)),
    };
  }).filter(p => p.budgetIklan > 0 || p.jumlahLead > 0 || p.closing > 0 || p.omset > 0);
}

// ── Total Parsing ─────────────────────────────────────────────────────────────

export function parseTotalFromRow(row: Record<string, string>): TotalAdsData {
  const keys = Object.keys(row);

  const budgetKey  = find(keys, ['budget iklan', 'total biaya iklan', 'biaya iklan']);
  const leadKey    = find(keys, ['jumlah lead', 'total lead']);
  const closingKey = find(keys, ['closing new', 'total closing']);
  const botolKey   = findLast(keys, ['closing botol', 'total botol', 'botol']);
  const crKey      = find(keys, ['closing rate', 'cr']);
  const omsetKey   = findLast(keys, ['omset']);
  const bacKey     = find(keys, ['biaya akuisisi customer', 'biaya aku', 'caq']);
  const evalKey    = findLast(keys, ['evaluasi perfomance', 'evaluasi performance', 'evaluasi iklan']);

  return {
    totalBudget:   parseRp(budgetKey  ? row[budgetKey]  : undefined),
    totalLead:     parseNum(leadKey   ? row[leadKey]    : undefined),
    totalClosing:  parseNum(closingKey ? row[closingKey] : undefined),
    totalBotol:    parseNum(botolKey  ? row[botolKey]   : undefined),
    cr:            parsePct(crKey     ? row[crKey]      : undefined),
    omset:         parseRp(omsetKey   ? row[omsetKey]   : undefined),
    caq:           parseRp(bacKey     ? row[bacKey]     : undefined),
    evaluasiIklan: evalKey            ? (row[evalKey] || '').trim() : '',
  };
}

// ── Main Parser ───────────────────────────────────────────────────────────────

export function parseAdsData(raw: Record<string, string>[]): AdsRow[] {
  if (raw.length === 0) return [];
  const headers = Object.keys(raw[0]);

  return raw
    .filter(row => {
      const date = Object.values(row)[0];
      return date && date.trim() && !date.toLowerCase().includes('date') && !date.toLowerCase().includes('tanggal');
    })
    .map(row => ({
      date: (Object.values(row)[0] ?? '').trim(),
      products: parseProductsFromRow(row, headers),
      total: parseTotalFromRow(row),
    }));
}

export function calcKPI(rows: AdsRow[]): KPISummary {
  const valid = rows.filter(r => r.total.totalBudget > 0 || r.total.totalLead > 0);

  const totalBudget  = valid.reduce((s, r) => s + r.total.totalBudget,  0);
  const totalLead    = valid.reduce((s, r) => s + r.total.totalLead,    0);
  const totalClosing = valid.reduce((s, r) => s + r.total.totalClosing, 0);
  const totalOmset   = valid.reduce((s, r) => s + r.total.omset,        0);
  const avgCR  = valid.length ? valid.reduce((s, r) => s + r.total.cr,  0) / valid.length : 0;
  const avgCAQ = valid.length ? valid.reduce((s, r) => s + r.total.caq, 0) / valid.length : 0;
  const roas   = totalBudget > 0 ? totalOmset / totalBudget : 0;

  const counts: Record<string, number> = {};
  for (const r of valid) {
    const e = r.total.evaluasiIklan;
    if (e) counts[e] = (counts[e] || 0) + 1;
  }
  const evaluasiDominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

  return { totalBudget, totalLead, totalClosing, totalOmset, avgCR, avgCAQ, roas, evaluasiDominant };
}
