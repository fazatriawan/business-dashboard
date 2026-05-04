const STORAGE_KEY = 'dashboard_excluded_sheets';
const INIT_KEY = 'dashboard_excluded_initialized';

const DEFAULT_EXCLUDED = [
  'Zona Ekspedisi',
  'INFORMASI TAMBAHAN CS',
  'INFORMASI TAMBAHAN ADV',
  'NOTE',
  'REWARD CS',
  'DASHBOARD CS',
  'INKUBASI CS',
  'Average Lead Konversi',
  'Average Lead Interaksi',
  '!Info Terbaru!!',
  'REWARD ALL ADV',
  'INKUBASI ALL ADV',
  'KPI IKLAN',
  'Total Meta',
  'Total Tiktok',
  'Total Google',
  'Total Closing ADV Adsy Web',
  'Total Closing ADV Adsy CTWA',
  'SUB LEADER (DINAR)',
  'SUB LEADER (VADIA)',
  'INKUBASI CS INTERAKSI',
  'INKUBASI CS KONVERSI',
  'Grafik Growth',
];

function initializeDefaults(): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(INIT_KEY)) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EXCLUDED));
  localStorage.setItem(INIT_KEY, 'true');
}

export function getExcludedSheets(): string[] {
  if (typeof window === 'undefined') return DEFAULT_EXCLUDED;
  initializeDefaults();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return DEFAULT_EXCLUDED;
  }
}

export function setExcludedSheets(sheets: string[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
  localStorage.setItem(INIT_KEY, 'true');
}

export function addExcludedSheet(name: string): void {
  const current = getExcludedSheets();
  const normalized = name.trim();
  if (normalized && !current.includes(normalized)) {
    setExcludedSheets([...current, normalized]);
  }
}

export function removeExcludedSheet(name: string): void {
  const current = getExcludedSheets();
  setExcludedSheets(current.filter(n => n !== name));
}

export function isExcluded(name: string): boolean {
  return getExcludedSheets().includes(name.trim());
}

export function resetToDefaults(): void {
  setExcludedSheets([...DEFAULT_EXCLUDED]);
}
