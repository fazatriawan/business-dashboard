import { AdsRow, ProductAdsData, TotalAdsData, KPISummary, ProductSummary } from './types';

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

// Normalize whitespace + newlines, lowercase
function norm(s: string): string {
  return s.replace(/[\n\r\s]+/g, ' ').trim().toLowerCase();
}

// ── Product Group Detection ───────────────────────────────────────────────────

interface ProductGroup { name: string; start: number; end: number }

function detectProductGroups(headers: string[]): ProductGroup[] {
  const starts: { name: string; start: number }[] = [];

  for (let i = 0; i < headers.length; i++) {
    const h = norm(headers[i]);
    // Group separator: "[PRODUCT NAME] Budget Iklan[+PAJAK | + pajak | ...]"
    const m = h.match(/^(.+?)\s+budget\s+iklan/);
    if (m) starts.push({ name: m[1].trim(), start: i });
  }

  // Find where TOTAL section starts (column with "TOTAL … BIAYA … IKLAN")
  const totalStart = headers.findIndex(h => {
    const c = norm(h);
    return c.includes('total') && c.includes('biaya') && c.includes('iklan');
  });

  return starts.map((g, i) => ({
    name: g.name,
    start: g.start,
    end: i + 1 < starts.length
      ? starts[i + 1].start
      : (totalStart >= 0 ? totalStart : headers.length),
  }));
}

// Find column in [start, end) by priority: first matching term wins
function findInGroup(
  headers: string[],
  start: number,
  end: number,
  terms: string[],
): string | undefined {
  for (const term of terms) {
    for (let i = start; i < end; i++) {
      if (norm(headers[i]).includes(term)) return headers[i];
    }
  }
}

// findLast with whitespace normalization — targets TOTAL section at end of sheet
function lastKey(keys: string[], terms: string[]): string | undefined {
  return keys.findLast(k => terms.some(t => norm(k).includes(t)));
}

// ── Per-Product Row Parsing ───────────────────────────────────────────────────

export function parseProductsFromRow(
  row: Record<string, string>,
  headers: string[],
): ProductAdsData[] {
  const groups = detectProductGroups(headers);
  if (groups.length === 0) return [];

  return groups.map(({ name, start, end }) => {
    const get = (terms: string[]) => {
      const col = findInGroup(headers, start, end, terms);
      return col ? row[col] : undefined;
    };

    return {
      name,
      budgetIklan:            parseRp(get(['budget iklan', 'biaya iklan'])),
      jumlahLead:             parseNum(get(['jumlah lead', 'total lead', 'lead'])),
      closing:                parseNum(get(['total closing', 'closing new', 'new customer  closing', 'new customer closing', 'new costumer', 'closing'])),
      closingBotol:           parseNum(get(['total botol', 'closing botol', 'botol'])),
      closingRate:            parsePct(get(['closing rate', 'cr'])),
      biayaAcquisisiLead:     parseRp(get(['biaya akuisisi lead', 'akuisisi lead'])),
      biayaAcquisisiCustomer: parseRp(get(['biaya akuisisi customer', 'akuisisi customer'])),
      biayaAcquisisiBottle:   parseRp(get(['biaya akuisisi botol', 'akuisisi botol'])),
      evaluasi:               (get(['evaluasi perfomance', 'evaluasi performance', 'evaluasi adv', 'evaluasi']) || '').trim(),
      omset:                  parseRp(get(['omset'])),
    };
  }).filter(p => p.budgetIklan > 0 || p.jumlahLead > 0 || p.closing > 0 || p.omset > 0);
}

// ── Total Section Parsing ─────────────────────────────────────────────────────

export function parseTotalFromRow(row: Record<string, string>): TotalAdsData {
  const keys = Object.keys(row);

  // Use lastKey so we always hit the TOTAL section columns at the end of the sheet,
  // not the first product's individual columns.
  const budgetKey  = lastKey(keys, ['total biaya iklan', 'total total biaya', 'budget iklan']);
  const leadKey    = lastKey(keys, ['total lead', 'jumlah lead']);
  const closingKey = lastKey(keys, ['total closing', 'closing new']);
  const botolKey   = lastKey(keys, ['total botol', 'closing botol', 'botol']);
  const crKey      = lastKey(keys, ['closing rate', 'cr']);
  const omsetKey   = lastKey(keys, ['omset']);
  const bacKey     = lastKey(keys, ['biaya akuisisi customer', 'caq']);
  const evalKey    = lastKey(keys, ['evaluasi perfomance', 'evaluasi performance', 'evaluasi iklan']);

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
      return date && date.trim() &&
        !date.toLowerCase().includes('date') &&
        !date.toLowerCase().includes('tanggal');
    })
    .map(row => ({
      date: (Object.values(row)[0] ?? '').trim(),
      products: parseProductsFromRow(row, headers),
      total: parseTotalFromRow(row),
    }));
}

export function calcKPI(rows: AdsRow[]): KPISummary {
  // Include all rows that have any meaningful data
  const valid = rows.filter(r =>
    r.total.totalLead > 0 || r.total.totalClosing > 0 || r.total.omset > 0
  );

  const totalBudget  = valid.reduce((s, r) => s + r.total.totalBudget,  0);
  const totalLead    = valid.reduce((s, r) => s + r.total.totalLead,    0);
  const totalClosing = valid.reduce((s, r) => s + r.total.totalClosing, 0);
  const totalOmset   = valid.reduce((s, r) => s + r.total.omset,        0);

  // Average only rows that have actual CR data
  const crRows = valid.filter(r => r.total.cr > 0);
  const avgCR  = crRows.length ? crRows.reduce((s, r) => s + r.total.cr,  0) / crRows.length : 0;
  const caqRows = valid.filter(r => r.total.caq > 0);
  const avgCAQ = caqRows.length ? caqRows.reduce((s, r) => s + r.total.caq, 0) / caqRows.length : 0;
  const roas   = totalBudget > 0 ? totalOmset / totalBudget : 0;

  const counts: Record<string, number> = {};
  for (const r of valid) {
    const e = r.total.evaluasiIklan;
    if (e) counts[e] = (counts[e] || 0) + 1;
  }
  const evaluasiDominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

  return { totalBudget, totalLead, totalClosing, totalOmset, avgCR, avgCAQ, roas, evaluasiDominant };
}

// ── Product Summary (aggregate per-product across all days) ──────────────────

export function calcProductSummary(rows: AdsRow[]): ProductSummary[] {
  const byName = new Map<string, ProductSummary>();

  for (const row of rows) {
    for (const p of row.products) {
      const e = byName.get(p.name) ?? {
        name: p.name, totalBudget: 0, totalLead: 0,
        totalClosing: 0, totalBotol: 0, totalOmset: 0, cr: 0,
      };
      e.totalBudget  += p.budgetIklan;
      e.totalLead    += p.jumlahLead;
      e.totalClosing += p.closing;
      e.totalBotol   += p.closingBotol;
      e.totalOmset   += p.omset;
      byName.set(p.name, e);
    }
  }

  return Array.from(byName.values())
    .map(s => ({
      ...s,
      cr: s.totalLead > 0 ? (s.totalClosing / s.totalLead) * 100 : 0,
    }))
    .filter(s => s.totalLead > 0 || s.totalClosing > 0 || s.totalOmset > 0)
    .sort((a, b) => b.totalOmset - a.totalOmset);
}
