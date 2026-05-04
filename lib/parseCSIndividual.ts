import { CSRow } from './types';

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

// Extract CS name from sheet name like "1. CS Nabila" or "2. CS Vadia"
function extractCSName(sheetName: string): string {
  const match = sheetName.match(/cs\s+(.+)$/i);
  return match ? match[1].trim() : sheetName;
}

// Try to find product name from header rows
function extractProductName(raw: Record<string, string>[]): string {
  for (let i = 0; i < Math.min(3, raw.length); i++) {
    const text = Object.values(raw[i]).join(' ');
    const match = text.match(/\b([A-Z][A-Z\s]+(?:\([^)]+\))?)\b/);
    if (match) return match[1].trim();
  }
  return '';
}

// Find the actual header row
function findHeaderRow(raw: Record<string, string>[]): number {
  let bestIdx = 0;
  let bestScore = 0;
  for (let i = 0; i < Math.min(6, raw.length); i++) {
    const vals = Object.values(raw[i]).join(' ').toLowerCase();
    let score = 0;
    if (vals.includes('date') || vals.includes('tanggal')) score += 3;
    if (vals.includes('closing')) score += 2;
    if (vals.includes('lead') || vals.includes('whatsapp') || vals.includes('email')) score += 1;
    if (vals.includes('omset')) score += 1;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export function parseCSIndividual(raw: Record<string, string>[], sheetName: string): CSRow {
  const csName = extractCSName(sheetName);

  if (raw.length === 0) {
    return {
      no: 0, cs: csName, adv: '', produk: '', platform: '', realtimeLead: 0,
      closing: 0, botol: 0, cr: 0, ratio: 0, totalLead: 0, totalClosing: 0,
      totalBotol: 0, avgCR: 0, totalRatio: 0, jumlahRetur: 0, returRate: 0, crossSell: '',
    };
  }

  const produk = extractProductName(raw);
  const headerIdx = findHeaderRow(raw);
  const headers = Object.keys(raw[headerIdx]);

  const findCol = (terms: string[]): string | undefined =>
    headers.find(h => terms.some(t => h.toLowerCase().includes(t)));

  const dateCol = findCol(['date', 'tanggal']);
  // Prefer "Total" columns if they exist
  const totalLeadCol = findCol(['total lead', 'total.lead']);
  const totalClosingCol = findCol(['total closing', 'total.closing']);
  const totalBotolCol = findCol(['total botol', 'total.botol']);
  // Fallback to generic columns
  const leadCol = totalLeadCol || findCol(['lead']);
  const closingCol = totalClosingCol || findCol(['closing']);
  const botolCol = totalBotolCol || findCol(['botol']);
  const crCol = findCol(['closing rate', 'cr']);

  let totalLead = 0;
  let totalClosing = 0;
  let totalBotol = 0;
  let crSum = 0, crCount = 0;

  for (let i = headerIdx + 1; i < raw.length; i++) {
    const row = raw[i];
    const dateVal = dateCol ? row[dateCol] : '';
    if (!dateVal || /date|tanggal|total|grand/i.test(dateVal)) continue;

    const lead = leadCol ? num(row[leadCol]) : 0;
    const closing = closingCol ? num(row[closingCol]) : 0;
    const botol = botolCol ? num(row[botolCol]) : 0;
    const cr = crCol ? pct(row[crCol]) : 0;

    totalLead += lead;
    totalClosing += closing;
    totalBotol += botol;
    if (cr > 0) { crSum += cr; crCount++; }
  }

  return {
    no: 0,
    cs: csName,
    adv: '',
    produk,
    platform: '',
    realtimeLead: totalLead,
    closing: totalClosing,
    botol: totalBotol,
    cr: crCount > 0 ? crSum / crCount : 0,
    ratio: 0,
    totalLead,
    totalClosing,
    totalBotol,
    avgCR: crCount > 0 ? crSum / crCount : 0,
    totalRatio: 0,
    jumlahRetur: 0,
    returRate: 0,
    crossSell: '',
  };
}
