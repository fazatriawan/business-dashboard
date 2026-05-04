// ── Drill-Down Engine ────────────────────────────────────────────────────────
// Cross-sheet relationship discovery via AI inference

import { smartRoute } from './ai-router';

export interface DrillDownRequest {
  entityType: 'adv' | 'cs' | 'product';
  entityName: string;
  availableSheets: {
    name: string;
    type: string;
    headers: string[];
    sampleRows: Record<string, string>[];
  }[];
}

export interface DrillDownResult {
  entityType: string;
  entityName: string;
  summary: string;
  relatedSheets: {
    sheetName: string;
    relationType: string;
    foundRows: Record<string, string>[];
    insights: string;
  }[];
  missingData: {
    sheetName: string;
    reason: string;
    suggestion: string;
  }[];
  recommendations: string[];
}

export async function performDrillDown(req: DrillDownRequest): Promise<DrillDownResult> {
  const { entityType, entityName, availableSheets } = req;

  // Find relevant sheets using rule-based matching
  const relatedSheets: DrillDownResult['relatedSheets'] = [];
  const missingData: DrillDownResult['missingData'] = [];

  for (const sheet of availableSheets) {
    const relevantRows = findRelevantRows(entityType, entityName, sheet);

    if (relevantRows.length > 0) {
      relatedSheets.push({
        sheetName: sheet.name,
        relationType: inferRelationType(entityType, sheet.type),
        foundRows: relevantRows.slice(0, 10),
        insights: '', // Will be filled by AI
      });
    } else {
      missingData.push({
        sheetName: sheet.name,
        reason: `Tidak ditemukan data ${entityType} "${entityName}" di sheet ini`,
        suggestion: `Pastikan nama ${entityType} konsisten di semua sheet, atau coba variasi penulisan`,
      });
    }
  }

  // Use AI to generate insights and recommendations
  try {
    const aiResult = await smartRoute({
      task: 'drilldown',
      payload: {
        entityType,
        entityName,
        relatedSheets,
        missingData,
      },
      timeoutMs: 20000,
    });

    const aiData = aiResult.result;
    if (aiData && typeof aiData === 'object') {
      return {
        entityType,
        entityName,
        summary: (aiData.summary as string) || generateSummary(entityType, entityName, relatedSheets),
        relatedSheets: (aiData.relatedSheets as DrillDownResult['relatedSheets']) || relatedSheets,
        missingData: (aiData.missingData as DrillDownResult['missingData']) || missingData,
        recommendations: (aiData.recommendations as string[]) || [],
      };
    }
  } catch {
    // Fallback to rule-based summary
  }

  return {
    entityType,
    entityName,
    summary: generateSummary(entityType, entityName, relatedSheets),
    relatedSheets,
    missingData,
    recommendations: generateRecommendations(entityType, entityName, relatedSheets),
  };
}

function findRelevantRows(
  entityType: string,
  entityName: string,
  sheet: { headers: string[]; sampleRows: Record<string, string>[] },
): Record<string, string>[] {
  const searchTerms = [entityName.toLowerCase()];
  // Add common variations
  if (entityType === 'adv') searchTerms.push(entityName.toLowerCase().replace('adv', '').trim());

  return sheet.sampleRows.filter(row => {
    return Object.values(row).some(val =>
      searchTerms.some(term => String(val).toLowerCase().includes(term))
    );
  });
}

function inferRelationType(entityType: string, sheetType: string): string {
  if (entityType === 'adv') {
    if (sheetType.includes('cs')) return 'CS yang ditangani oleh ADV ini';
    if (sheetType.includes('ads') || sheetType.includes('iklan')) return 'Data iklan ADV ini';
    if (sheetType.includes('product') || sheetType.includes('produk')) return 'Produk yang diiklankan';
  }
  if (entityType === 'cs') {
    if (sheetType.includes('adv')) return 'ADV yang menangani lead CS ini';
    if (sheetType.includes('product')) return 'Produk yang ditangani CS ini';
  }
  if (entityType === 'product') {
    if (sheetType.includes('ads')) return 'Data iklan untuk produk ini';
    if (sheetType.includes('cs')) return 'CS yang menangani produk ini';
  }
  return 'Data terkait';
}

function generateSummary(
  entityType: string,
  entityName: string,
  sheets: DrillDownResult['relatedSheets'],
): string {
  const totalRows = sheets.reduce((s, sh) => s + sh.foundRows.length, 0);
  return `Ditemukan ${totalRows} baris data terkait ${entityType} "${entityName}" di ${sheets.length} sheet.`;
}

function generateRecommendations(
  entityType: string,
  entityName: string,
  sheets: DrillDownResult['relatedSheets'],
): string[] {
  const recs: string[] = [];
  if (sheets.length === 0) {
    recs.push(`Data untuk ${entityType} "${entityName}" belum tersedia di sheet manapun.`);
  }
  if (entityType === 'adv') {
    recs.push(`Pantau performa iklan ${entityName} harian.`);
  }
  if (entityType === 'cs') {
    recs.push(`Evaluasi training needs untuk CS ${entityName}.`);
  }
  return recs;
}
