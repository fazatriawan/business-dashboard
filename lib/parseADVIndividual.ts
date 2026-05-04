import { ADVRow } from './types';

function num(v: string | undefined): number {
  if (!v || v === '-' || v === '#REF!' || v === '#DIV/0!' || v.trim() === '') return 0;
  const cleaned = v.toString()
    .replace(/Rp/gi, '')
    .replace(/\./g, '')
    .replace(/,(\d{2})(?:\s|$)/, '.$1')
    .replace(/,/g, '')
    .replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

function pct(v: string | undefined): number {
  if (!v) return 0;
  return parseFloat(v.toString().replace(',', '.').replace('%', '')) || 0;
}

// Extract ADV name from sheet name like "1. Adv Faza"
function extractADVName(sheetName: string): string {
  const match = sheetName.match(/adv\s+(.+)$/i);
  return match ? match[1].trim() : sheetName;
}

// Try to find product name from header rows (e.g. "YOUZHI FB (NOL PAJAK)")
function extractProductName(raw: Record<string, string>[]): string {
  for (let i = 0; i < Math.min(3, raw.length); i++) {
    const text = Object.values(raw[i]).join(' ');
    // Look for text in ALL CAPS or with parentheses
    const match = text.match(/\b([A-Z][A-Z\s]+(?:\([^)]+\))?)\b/);
    if (match) return match[1].trim();
  }
  return '';
}

// Find the actual header row index by scanning for expected keywords
function findHeaderRow(raw: Record<string, string>[]): number {
  let bestIdx = 0;
  let bestScore = 0;
  for (let i = 0; i < Math.min(6, raw.length); i++) {
    const vals = Object.values(raw[i]).join(' ').toLowerCase();
    let score = 0;
    if (vals.includes('date') || vals.includes('tanggal')) score += 3;
    if (vals.includes('budget') || vals.includes('biaya')) score += 2;
    if (vals.includes('lead') || vals.includes('customer')) score += 2;
    if (vals.includes('closing')) score += 2;
    if (vals.includes('omset')) score += 1;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export function parseADVIndividual(raw: Record<string, string>[], sheetName: string): ADVRow {
  const advName = extractADVName(sheetName);

  if (raw.length === 0) {
    return {
      no: 0, adv: advName, produk: '', cs: '', realtimeLead: 0, closing: 0,
      botol: 0, totalBotolByProduct: 0, cr: 0, caq: 0, ratio: 0, avgRatio: 0,
      totalLead: 0, totalClosing: 0, totalBotol: 0, avgCR: 0, totalRatio: 0,
      jumlahRetur: 0, returRate: 0,
    };
  }

  const produk = extractProductName(raw);
  const headerIdx = findHeaderRow(raw);
  const headers = Object.keys(raw[headerIdx]);

  const findCol = (terms: string[]): string | undefined =>
    headers.find(h => terms.some(t => h.toLowerCase().includes(t)));

  const dateCol = findCol(['date', 'tanggal']);
  const leadCol = findCol(['jumlah lead', 'lead']);
  const customerCol = findCol(['new customer', 'customer']);
  const closingBotolCol = findCol(['closing botol', 'botol']);
  const crCol = findCol(['closing rate', 'cr']);
  const bacCol = findCol(['biaya akuisisi customer', 'akuisisi customer', 'caq']);

  let totalLead = 0;
  let totalClosing = 0;
  let totalBotol = 0;
  let crSum = 0, crCount = 0;
  let caqSum = 0, caqCount = 0;

  for (let i = headerIdx + 1; i < raw.length; i++) {
    const row = raw[i];
    const dateVal = dateCol ? row[dateCol] : '';
    if (!dateVal || /date|tanggal|total|grand/i.test(dateVal)) continue;

    const lead = leadCol ? num(row[leadCol]) : 0;
    const customer = customerCol ? num(row[customerCol]) : 0;
    const botol = closingBotolCol ? num(row[closingBotolCol]) : 0;
    const cr = crCol ? pct(row[crCol]) : 0;
    const caq = bacCol ? num(row[bacCol]) : 0;

    totalLead += lead;
    totalClosing += customer;
    totalBotol += botol;
    if (cr > 0) { crSum += cr; crCount++; }
    if (caq > 0) { caqSum += caq; caqCount++; }
  }

  return {
    no: 0,
    adv: advName,
    produk,
    cs: '',
    realtimeLead: totalLead,
    closing: totalClosing,
    botol: totalBotol,
    totalBotolByProduct: totalBotol,
    cr: crCount > 0 ? crSum / crCount : 0,
    caq: caqCount > 0 ? caqSum / caqCount : 0,
    ratio: 0,
    avgRatio: 0,
    totalLead,
    totalClosing,
    totalBotol,
    avgCR: crCount > 0 ? crSum / crCount : 0,
    totalRatio: 0,
    jumlahRetur: 0,
    returRate: 0,
  };
}
