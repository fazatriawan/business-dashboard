// ── Semantic Column Mapper ───────────────────────────────────────────────────
// Uses AI to analyze sheet headers and map them to canonical field names

import { smartRoute } from './ai-router';

export interface ColumnMapping {
  canonical: string;
  sourceColumn: string;
  confidence: number;
  reasoning: string;
}

export interface SheetSchema {
  sheetName: string;
  detectedType: 'ads' | 'cs' | 'adv' | 'product' | 'kpi' | 'unknown';
  columns: ColumnMapping[];
  sampleRows: Record<string, string>[];
}

const CANONICAL_FIELDS: Record<string, string[]> = {
  date: ['tanggal', 'date', 'tgl', 'hari', 'waktu', 'timestamp'],
  cs_name: ['cs', 'nama cs', 'customer service', 'nama', 'pic cs', 'handler'],
  adv_name: ['adv', 'advertiser', 'nama adv', 'iklan', 'ads', 'marketer'],
  product: ['produk', 'product', 'nama produk', 'item', 'sku', 'barang'],
  platform: ['platform', 'channel', 'sumber', 'media', 'source'],
  lead: ['lead', 'jumlah lead', 'total lead', 'realtime lead', 'leads'],
  closing: ['closing', 'jumlah closing', 'total closing', 'deal'],
  botol: ['botol', 'jumlah botol', 'total botol', 'pcs', 'unit'],
  budget: ['budget', 'biaya iklan', 'total biaya', 'spend', 'ad spend', 'top up'],
  omset: ['omset', 'revenue', 'penjualan', 'sales', 'total omset', 'turnover'],
  cr: ['cr', 'closing rate', 'conversion rate', 'rate'],
  caq: ['caq', 'biaya akuisisi', 'cost per acquisition', 'cac'],
  retur: ['retur', 'return', 'jumlah retur', 'refund'],
};

export async function mapSheetSemantics(
  sheetName: string,
  headers: string[],
  sampleRows: Record<string, string>[],
): Promise<SheetSchema> {
  // Quick rule-based pre-mapping
  const ruleBased: ColumnMapping[] = headers.map(h => {
    const lower = h.toLowerCase().trim();
    for (const [canonical, synonyms] of Object.entries(CANONICAL_FIELDS)) {
      if (synonyms.some(s => lower.includes(s))) {
        return { canonical, sourceColumn: h, confidence: 0.7, reasoning: `Keyword match: ${synonyms.find(s => lower.includes(s))}` };
      }
    }
    return { canonical: lower, sourceColumn: h, confidence: 0.3, reasoning: 'No keyword match' };
  });

  // If we have AI available, refine with LLM
  try {
    const aiResult = await smartRoute({
      task: 'semantic_map',
      payload: {
        sheetName,
        headers,
        sampleRows: sampleRows.slice(0, 3),
        ruleBased,
      },
      timeoutMs: 15000,
    });

    const aiMappings = aiResult.result;
    if (aiMappings && typeof aiMappings === 'object' && 'columns' in aiMappings) {
      return {
        sheetName,
        detectedType: ((aiMappings.detectedType as string) || 'unknown') as SheetSchema['detectedType'],
        columns: (aiMappings.columns as ColumnMapping[]) || ruleBased,
        sampleRows,
      };
    }
  } catch {
    // Fallback to rule-based
  }

  // Detect sheet type from mapped columns
  const hasCs = ruleBased.some(c => c.canonical === 'cs_name');
  const hasAdv = ruleBased.some(c => c.canonical === 'adv_name');
  const hasBudget = ruleBased.some(c => c.canonical === 'budget');
  const hasDate = ruleBased.some(c => c.canonical === 'date');

  let detectedType: SheetSchema['detectedType'] = 'unknown';
  if (hasDate && hasBudget && hasOmset(ruleBased)) detectedType = 'ads';
  else if (hasCs && hasAdv) detectedType = 'cs';
  else if (hasAdv && hasBudget) detectedType = 'adv';
  else if (hasCs && !hasAdv) detectedType = 'cs';

  return {
    sheetName,
    detectedType,
    columns: ruleBased,
    sampleRows,
  };
}

function hasOmset(cols: ColumnMapping[]): boolean {
  return cols.some(c => c.canonical === 'omset' || c.canonical === 'closing');
}
