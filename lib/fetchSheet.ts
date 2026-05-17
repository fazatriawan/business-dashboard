import Papa from 'papaparse';

// Convert any Google Sheets URL to CSV export URL
export function toCSVUrl(url: string, gid?: string): string {
  // Already a CSV export URL
  if (url.includes('export?format=csv') || url.includes('pub?output=csv')) return url;

  // Extract spreadsheet ID
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!idMatch) throw new Error('URL Google Sheets tidak valid');
  const id = idMatch[1];

  // Extract GID from URL if not provided
  const gidMatch = url.match(/[#&?]gid=(\d+)/);
  const sheetGid = gid || gidMatch?.[1] || '0';

  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${sheetGid}`;
}

export async function fetchSheetCSV(url: string): Promise<Record<string, string>[]> {
  const csvUrl = toCSVUrl(url);

  const response = await fetch(`/api/sheet?url=${encodeURIComponent(csvUrl)}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Gagal mengambil data: ${response.status}`);
  }

  const text = await response.text();

  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });

  return result.data;
}

// Fetch a specific sheet by name (or gid:type:gid) using the gviz API
export async function fetchSheetByName(
  spreadsheetId: string,
  sheetName: string,
): Promise<Record<string, string>[]> {
  // Handle synthetic gid:type:gid format from sheet-names API
  const gidMatch = sheetName.match(/^gid:[^:]+:(\d+)$/);
  const url = gidMatch
    ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gidMatch[1]}`
    : `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

  const response = await fetch(`/api/sheet?url=${encodeURIComponent(url)}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Gagal mengambil sheet "${sheetName}": ${response.status}`);
  }

  const text = await response.text();

  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });

  return result.data;
}

// Fetch raw CSV as string arrays (preserves multi-row headers)
export async function fetchSheetByNameRaw(
  spreadsheetId: string,
  sheetName: string,
): Promise<string[][]> {
  const gidMatch = sheetName.match(/^gid:[^:]+:(\d+)$/);
  const url = gidMatch
    ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gidMatch[1]}`
    : `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

  const response = await fetch(`/api/sheet?url=${encodeURIComponent(url)}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Gagal mengambil sheet "${sheetName}": ${response.status}`);
  }

  const text = await response.text();

  const result = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: false,
  });

  return result.data;
}
