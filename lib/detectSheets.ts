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
  | 'rosterCS'
  | 'unknown';

const SHEET_NAME_MAP: Record<string, SheetType> = {
  'Total Closing All Produk': 'ads',
  'Laporan Harian': 'ads',
  'Total Biaya iklan': 'totalBiayaIklan',
  'TOTAL ALL CS': 'totalAllCS',
  'Total All CS': 'totalAllCS',
  'Total CS Web': 'totalAllCS',
  'Total CS CTWA': 'totalAllCS',
  'Informasi CS': 'rosterCS',
  'Info CS': 'rosterCS',
  'Informasi ADV': 'infoADV',
  'Info ADV': 'infoADV',
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
  if (h.includes('nama cs') || (h.includes('cs') && h.includes('lead') && h.includes('closing') && !h.includes('adv'))) return 'infoCS';
  if (h.includes('nama adv') || (h.includes('adv') && h.includes('lead') && h.includes('closing'))) return 'infoADV';
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

// ── Sheet name discovery via server-side proxy ───────────────────────────────
// Calls /api/sheet-names which scrapes the spreadsheet HTML page server-side,
// avoiding CORS and the deprecated Google Sheets Feed API v3.
export interface SheetNameResult {
  names: string[];
  previews: Record<string, { headers: string[]; rows: string[][] }>;
  gidNames: Record<string, string>;
}

export async function listSheetNames(spreadsheetId: string): Promise<SheetNameResult> {
  try {
    const res = await fetch(`/api/sheet-names?id=${encodeURIComponent(spreadsheetId)}`);
    if (!res.ok) return { names: [], previews: {}, gidNames: {} };
    const data = await res.json() as {
      names?: string[];
      previews?: Record<string, { headers: string[]; rows: string[][] }>;
      gidNames?: Record<string, string>;
      error?: string;
      debug?: { unclassifiedCount: number };
    };
    if (data.error) console.warn('[detectSheets] sheet-names API error:', data.error);
    if (data.debug) console.log(`[sheet-names] Unclassified GIDs: ${data.debug.unclassifiedCount}`);
    return {
      names: Array.isArray(data.names) ? data.names : [],
      previews: data.previews || {},
      gidNames: data.gidNames || {},
    };
  } catch (e) {
    console.warn('[detectSheets] listSheetNames error:', e);
    return { names: [], previews: {}, gidNames: {} };
  }
}

function classifyByName(name: string): SheetType | null {
  // Synthetic format from sheet-names API: gid:TYPE:GID
  const gidSynthetic = name.match(/^gid:([^:]+):\d+$/);
  if (gidSynthetic) return gidSynthetic[1] as SheetType;

  const lower = name.toLowerCase().trim();
  if (/^\d+\.\s*cs\b/.test(lower))  return 'infoCS';
  if (/^\d+\.\s*adv\b/.test(lower)) return 'infoADV';
  if (lower.includes('informasi cs') || lower === 'info cs') return 'rosterCS';
  if (lower.includes('informasi adv') || lower.includes('info adv')) return 'infoADV';
  if (lower.includes('total all cs') || lower.includes('total cs web') || lower.includes('total cs ctwa')) return 'totalAllCS';
  if (lower.includes('total biaya iklan') || lower === 'biaya iklan') return 'totalBiayaIklan';
  if (lower.includes('laporan harian') || (lower.includes('closing') && lower.includes('produk'))) return 'ads';
  return null;
}

// Primary sheets: fetch to verify data and get rowCount
const PRIMARY_TYPES = new Set<SheetType>(['ads', 'totalBiayaIklan', 'totalAllCS']);

export async function detectSheets(spreadsheetId: string): Promise<DetectedSheet[]> {
  const results: DetectedSheet[] = [];
  const foundNames = new Set<string>();

  // 1. Discover all sheet names via /api/sheet-names proxy
  const { names: allNames, previews, gidNames } = await listSheetNames(spreadsheetId);
  console.log(`[detectSheets] Total sheets discovered: ${allNames.length}`, allNames);

  // 2. Classify all discovered names — include ALL sheets even unknown ones
  const placeholders = new Map<string, DetectedSheet>();
  for (const name of allNames) {
    const type = classifyByName(name) ?? matchTypeByName(name);
    // Include ALL sheets: classified get their type, unknown get 'unknown'
    const finalType: SheetType = type ?? 'unknown';
    // Extract real display name for GID-format entries
    const gidMatch = name.match(/^gid:[^:]+:(\d+)$/);
    const realName = gidMatch ? (gidNames[gidMatch[1]] || null) : name;
    const previewData = gidMatch ? previews[gidMatch[1]] : undefined;

    placeholders.set(name, {
      name,
      matchedType: finalType,
      // Prefer real tab name from HTML, fallback to preview headers as hint
      firstRow: realName || previewData?.headers.filter(Boolean).slice(0, 8).join(', ').slice(0, 200) || '',
      rowCount: 0,
      preview: previewData ? [previewData.headers, ...previewData.rows] : [],
    });
    foundNames.add(name);
  }
  console.log(`[detectSheets] Classified sheets (${placeholders.size}):`, Array.from(placeholders.keys()));

  // 3. Fetch content only for primary sheets to get real rowCount
  const primaryNames = Array.from(placeholders.values())
    .filter(s => PRIMARY_TYPES.has(s.matchedType as SheetType))
    .map(s => s.name);

  const fetchResults = await Promise.all(
    primaryNames.map(async (name) => {
      const r = await trySheet(spreadsheetId, name);
      if (r) {
        if (!r.matchedType || r.matchedType === 'unknown') r.matchedType = classifyByName(name);
        return r;
      }
      return placeholders.get(name)!;
    }),
  );

  // Merge: fetched primary sheets first
  const fetchedByName = new Map(fetchResults.map(r => [r.name, r]));
  for (const [name, placeholder] of Array.from(placeholders.entries())) {
    results.push(fetchedByName.get(name) ?? placeholder);
  }

  // 4. Fallback: try KNOWN_SHEET_NAMES not yet found via Feed API
  for (const name of KNOWN_SHEET_NAMES) {
    if (foundNames.has(name)) continue;
    const result = await trySheet(spreadsheetId, name);
    if (result) {
      if (!result.matchedType || result.matchedType === 'unknown') {
        result.matchedType = classifyByName(name);
      }
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
  const gidMatch = sheetName.match(/^gid:[^:]+:(\d+)$/);
  if (gidMatch) {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gidMatch[1]}`;
  }
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
