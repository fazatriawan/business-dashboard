import Papa from 'papaparse';

export interface DetectedSheet {
  name: string;
  matchedType: SheetType | null;
  firstRow: string;
  rowCount: number;
  preview: string[][];
}

export type SheetType =
  | 'ads'
  | 'totalBiayaIklan'
  | 'totalAllCS'
  | 'infoCS'
  | 'infoADV'
  | 'unknown';

const SHEET_NAME_MAP: Record<string, SheetType> = {
  'Laporan Harian': 'ads',
  'Total Closing All Produk': 'ads',
  'Total Biaya iklan': 'totalBiayaIklan',
  'TOTAL ALL CS': 'totalAllCS',
  'Total All CS': 'totalAllCS',
  'Total CS Web': 'totalAllCS',
  'Total CS CTWA': 'totalAllCS',
};

const KNOWN_SHEET_NAMES = Object.keys(SHEET_NAME_MAP);

function matchTypeByName(name: string): SheetType | null {
  const normalized = name.trim();
  const exact = SHEET_NAME_MAP[normalized];
  if (exact) return exact;
  // case-insensitive fallback
  const lower = normalized.toLowerCase();
  for (const [key, type] of Object.entries(SHEET_NAME_MAP)) {
    if (key.toLowerCase() === lower) return type;
  }
  return null;
}

function matchTypeByHeader(header: string[]): SheetType | null {
  const h = header.join(' ').toLowerCase();
  if (h.includes('closing') && h.includes('produk') && h.includes('date')) return 'ads';
  if (h.includes('biaya iklan') || h.includes('budget iklan') || h.includes('top up')) return 'totalBiayaIklan';
  if (h.includes('total all cs') || (h.includes('cs') && h.includes('botol') && h.includes('target'))) return 'totalAllCS';
  return null;
}

async function trySheet(
  spreadsheetId: string,
  name: string,
): Promise<DetectedSheet | null> {
  const url = buildSheetUrl(spreadsheetId, name);
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const text = await res.text();
    const parsed = Papa.parse<string[]>(text, { skipEmptyLines: false });
    const rows = parsed.data;
    if (rows.length === 0) return null;

    const header = rows[0] || [];
    const matchedType = matchTypeByName(name) || matchTypeByHeader(header);

    return {
      name,
      matchedType,
      firstRow: header.join(', ').slice(0, 200),
      rowCount: rows.length,
      preview: rows.slice(0, 3),
    };
  } catch {
    return null;
  }
}

// ── Google Sheets Feed API: list all worksheets without API key ──────────────
// Only works if the spreadsheet is publicly viewable.
export async function listSheetNames(spreadsheetId: string): Promise<string[]> {
  try {
    const url = `https://spreadsheets.google.com/feeds/worksheets/${spreadsheetId}/public/basic?alt=json`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const entries = data?.feed?.entry || [];
    return entries.map((e: { title?: { $t?: string } }) => e.title?.$t || '').filter(Boolean);
  } catch {
    return [];
  }
}

export async function detectSheets(spreadsheetId: string): Promise<DetectedSheet[]> {
  const results: DetectedSheet[] = [];
  const foundNames = new Set<string>();

  // 1. Discover all sheet names via Feed API
  const allNames = await listSheetNames(spreadsheetId);

  // 2. Try fetching every discovered sheet
  const promises = allNames.map(async (name) => {
    const result = await trySheet(spreadsheetId, name);
    if (result) {
      foundNames.add(result.name);
      // Auto-type by name patterns
      if (!result.matchedType || result.matchedType === 'unknown') {
        const lower = name.toLowerCase();
        if (/^\d+\.\s*cs\b/.test(lower)) result.matchedType = 'infoCS';
        else if (/^\d+\.\s*adv\b/.test(lower)) result.matchedType = 'infoADV';
        else if (lower.includes('total all cs')) result.matchedType = 'totalAllCS';
        else if (lower.includes('total cs web')) result.matchedType = 'totalAllCS';
        else if (lower.includes('total cs ctwa')) result.matchedType = 'totalAllCS';
        else if (lower.includes('total biaya iklan') || lower.includes('biaya iklan')) result.matchedType = 'totalBiayaIklan';
        else if (lower.includes('closing') && lower.includes('produk')) result.matchedType = 'ads';
        else if (lower.includes('laporan harian')) result.matchedType = 'ads';
      }
    }
    return result;
  });

  const settled = await Promise.all(promises);
  for (const r of settled) {
    if (r) results.push(r);
  }

  // 3. Fallback: try known names that weren't discovered (different casing / not public)
  for (const name of KNOWN_SHEET_NAMES) {
    if (foundNames.has(name)) continue;
    const result = await trySheet(spreadsheetId, name);
    if (result) {
      foundNames.add(result.name);
      results.push(result);
    }
  }

  return results;
}

export function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9\-_]+)/);
  return match ? match[1] : null;
}

export function buildSheetUrl(spreadsheetId: string, sheetName: string): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
}

// --- Bookmark / History ---

export interface Bookmark {
  id: string;
  label: string;
  spreadsheetId: string;
  sheetMap: Record<SheetType, string>;
  createdAt: string;
}

const STORAGE_KEY = 'dashboard_bookmarks';

export function loadBookmarks(): Bookmark[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBookmarks(bookmarks: Bookmark[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

export function addBookmark(bookmark: Bookmark): void {
  const all = loadBookmarks();
  const filtered = all.filter((b) => b.id !== bookmark.id);
  filtered.unshift(bookmark);
  saveBookmarks(filtered.slice(0, 20)); // keep last 20
}

export function deleteBookmark(id: string): void {
  const all = loadBookmarks();
  saveBookmarks(all.filter((b) => b.id !== id));
}
