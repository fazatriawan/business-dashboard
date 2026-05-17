'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Link2, Calendar, Search, Save, Trash2, ChevronDown, ChevronUp,
  Loader2, BarChart3, ArrowRight, Database, CheckSquare, Square,
} from 'lucide-react';
import { detectSheets, extractSpreadsheetId, type DetectedSheet, type SheetType } from '../lib/detectSheets';

export type SheetCategory = 'main' | 'cs' | 'adv' | 'skip';

export interface SelectedSheet {
  name: string;
  displayName: string;
  category: SheetCategory;
  previewHeaders: string[];
}

export interface LoadConfig {
  spreadsheetId: string;
  selectedSheets: SelectedSheet[];
  // backward-compat fields (derived from selectedSheets)
  sheetMap: Record<string, string>;
  extraSheets?: Record<string, string[]>;
  bulan: string;
  label: string;
}

interface SmartInputProps {
  onLoad: (config: LoadConfig) => void;
  loading: boolean;
}

interface DBBookmark {
  id: string;
  label: string;
  spreadsheetId: string;
  sheetMap: string;
  createdAt: string;
  updatedAt: string;
}

const MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];

function defaultCategory(type: SheetType | null): SheetCategory {
  if (type === 'ads') return 'main';
  if (type === 'totalAllCS') return 'cs';
  if (type === 'infoCS') return 'cs';
  if (type === 'infoADV') return 'adv';
  if (type === 'totalBiayaIklan') return 'adv';
  if (type === 'rosterCS') return 'skip';
  return 'skip'; // unknown sheets default to skip
}

function getDisplayName(sheet: DetectedSheet): string {
  // For synthetic GID format, use preview first row as hint or GID number
  const gidMatch = sheet.name.match(/^gid:[^:]+:(\d+)$/);
  if (!gidMatch) return sheet.name;
  // Use firstRow (which contains real tab name or preview headers if set)
  if (sheet.firstRow && sheet.firstRow.length > 2) {
    return sheet.firstRow.slice(0, 50);
  }
  return `Tab #${gidMatch[1]}`;
}

function categoryLabel(cat: SheetCategory): { text: string; cls: string } {
  if (cat === 'main') return { text: 'Main', cls: 'bg-indigo-100 text-indigo-700' };
  if (cat === 'cs')   return { text: 'CS',   cls: 'bg-emerald-100 text-emerald-700' };
  if (cat === 'adv')  return { text: 'ADV',  cls: 'bg-amber-100 text-amber-700' };
  return { text: 'Skip', cls: 'bg-slate-100 text-slate-400' };
}

/** Build backward-compat sheetMap from selectedSheets */
function buildSheetMap(selected: SelectedSheet[]): { sheetMap: Record<string, string>; extraSheets: Record<string, string[]> } {
  const sheetMap: Record<string, string> = {};
  const extraSheets: Record<string, string[]> = {};

  // Find the main (ads) sheet — prefer one containing "total closing"
  const mainSheets = selected.filter(s => s.category === 'main');
  const preferred = mainSheets.find(s => s.displayName.toLowerCase().includes('total closing')) || mainSheets[0];
  if (preferred) sheetMap['ads'] = preferred.name;

  // CS sheets
  const csSheets = selected.filter(s => s.category === 'cs');
  csSheets.forEach((s, i) => {
    if (i === 0) sheetMap['infoCS'] = s.name;
    else {
      if (!extraSheets['infoCS']) extraSheets['infoCS'] = [];
      extraSheets['infoCS'].push(s.name);
    }
  });

  // ADV sheets
  const advSheets = selected.filter(s => s.category === 'adv');
  // totalBiayaIklan detection by name
  const biayaSheet = advSheets.find(s =>
    s.displayName.toLowerCase().includes('biaya iklan') || s.name.includes('totalBiayaIklan')
  );
  if (biayaSheet) {
    sheetMap['totalBiayaIklan'] = biayaSheet.name;
  }
  const advDataSheets = advSheets.filter(s => s !== biayaSheet);
  advDataSheets.forEach((s, i) => {
    if (i === 0) sheetMap['infoADV'] = s.name;
    else {
      if (!extraSheets['infoADV']) extraSheets['infoADV'] = [];
      extraSheets['infoADV'].push(s.name);
    }
  });

  // totalAllCS
  const totalAllCS = selected.find(s => s.name.includes('totalAllCS') || s.displayName.toLowerCase().includes('total all cs'));
  if (totalAllCS) sheetMap['totalAllCS'] = totalAllCS.name;

  return { sheetMap, extraSheets };
}

export default function SmartInput({ onLoad, loading }: SmartInputProps) {
  const [open, setOpen] = useState(true);
  const [urlInput, setUrlInput] = useState('');
  const [bulan, setBulan] = useState(() => {
    const d = new Date();
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  });
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState<DetectedSheet[]>([]);
  const [categories, setCategories] = useState<Record<string, SheetCategory>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [bookmarks, setBookmarks] = useState<DBBookmark[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [detectError, setDetectError] = useState('');
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    fetch('/api/db/bookmarks')
      .then(r => r.json())
      .then(data => setBookmarks(Array.isArray(data) ? data : []))
      .catch(() => setBookmarks([]));
  }, []);

  const handleDetect = async () => {
    const id = extractSpreadsheetId(urlInput);
    if (!id) { setDetectError('URL tidak valid.'); return; }
    setDetectError('');
    setDetecting(true);
    setDetected([]);
    setCategories({});
    setChecked({});
    try {
      const sheets = await detectSheets(id);
      setDetected(sheets);
      // Auto-assign defaults
      const cats: Record<string, SheetCategory> = {};
      const chk: Record<string, boolean> = {};
      for (const s of sheets) {
        const cat = defaultCategory(s.matchedType as SheetType);
        cats[s.name] = cat;
        chk[s.name] = cat !== 'skip'; // auto-check non-skip sheets
      }
      setCategories(cats);
      setChecked(chk);
      if (sheets.length === 0) setDetectError('Tidak ada tab yang ditemukan.');
    } catch (e) {
      setDetectError(e instanceof Error ? e.message : 'Gagal scan tab');
    } finally {
      setDetecting(false);
    }
  };

  const handleLoad = () => {
    const id = extractSpreadsheetId(urlInput);
    if (!id) return;

    const selectedSheets: SelectedSheet[] = detected
      .filter(d => checked[d.name] && categories[d.name] !== 'skip')
      .map(d => ({
        name: d.name,
        displayName: getDisplayName(d),
        category: categories[d.name] || 'skip',
        previewHeaders: d.preview[0] || [],
      }));

    if (!selectedSheets.some(s => s.category === 'main')) {
      setDetectError('Pilih minimal 1 sheet sebagai "Main" (sumber data utama).');
      return;
    }

    const { sheetMap, extraSheets } = buildSheetMap(selectedSheets);

    onLoad({
      spreadsheetId: id,
      selectedSheets,
      sheetMap: sheetMap as Record<SheetType, string>,
      extraSheets: Object.keys(extraSheets).length > 0 ? extraSheets : undefined,
      bulan,
      label: bulan,
    });
    setOpen(false);
  };

  const setAllCategory = (cat: SheetCategory) => {
    const next = { ...categories };
    const nextChk = { ...checked };
    for (const s of detected) {
      if (s.matchedType !== 'rosterCS') {
        next[s.name] = cat;
        nextChk[s.name] = cat !== 'skip';
      }
    }
    setCategories(next);
    setChecked(nextChk);
  };

  const filteredSheets = useMemo(() =>
    detected.filter(s => {
      if (!filterText) return true;
      const display = getDisplayName(s).toLowerCase();
      const preview = (s.preview[0] || []).join(' ').toLowerCase();
      return display.includes(filterText.toLowerCase()) || preview.includes(filterText.toLowerCase());
    }),
    [detected, filterText]
  );

  // Group by category for display
  const grouped = useMemo(() => {
    const groups: Record<string, DetectedSheet[]> = { main: [], cs: [], adv: [], skip: [], unknown: [] };
    for (const s of filteredSheets) {
      const cat = categories[s.name];
      if (!cat || cat === 'skip') {
        if (s.matchedType === 'unknown' || !s.matchedType) groups.unknown.push(s);
        else groups.skip.push(s);
      } else {
        groups[cat]?.push(s);
      }
    }
    return groups;
  }, [filteredSheets, categories]);

  const checkedCount = Object.values(checked).filter(Boolean).length;

  const handleSelectBookmark = (bm: DBBookmark) => {
    setUrlInput(`https://docs.google.com/spreadsheets/d/${bm.spreadsheetId}/edit`);
    setBulan(bm.label);
    setDetected([]);
    setCategories({});
    setChecked({});
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50/80 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm">
            <Database className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-semibold text-slate-800 text-sm">Sumber Data Google Sheets</span>
            {checkedCount > 0 && (
              <span className="ml-2 text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium border border-emerald-100">
                {checkedCount} sheet dipilih
              </span>
            )}
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-4 border-t border-slate-100">
          {/* Bookmarks */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Riwayat</label>
              <button type="button" onClick={() => setShowBookmarks(v => !v)} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                {showBookmarks ? 'Sembunyikan' : `Tampilkan (${bookmarks.length})`}
              </button>
            </div>
            {showBookmarks && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {bookmarks.length === 0 && <div className="text-xs text-slate-400 py-2">Belum ada riwayat.</div>}
                {bookmarks.map(bm => (
                  <div key={bm.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 cursor-pointer group" onClick={() => handleSelectBookmark(bm)}>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">{bm.label}</span>
                    </div>
                    <button onClick={e => { e.stopPropagation(); fetch(`/api/db/bookmarks?id=${bm.id}`, { method: 'DELETE' }); setBookmarks(p => p.filter(b => b.id !== bm.id)); }} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Link Google Sheets</label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>
          </div>

          {/* Detect button */}
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleDetect} disabled={detecting || !urlInput}
              className="inline-flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">
              {detecting ? <><Loader2 className="w-4 h-4 animate-spin" />Mendeteksi...</> : <><Search className="w-4 h-4" />Deteksi Semua Tab</>}
            </button>
            {detected.length > 0 && (
              <button type="button" onClick={async () => {
                const id = extractSpreadsheetId(urlInput);
                if (!id || detected.length === 0) return;
                const { sheetMap, extraSheets } = buildSheetMap(
                  detected.filter(d => checked[d.name] && categories[d.name] !== 'skip').map(d => ({
                    name: d.name, displayName: getDisplayName(d), category: categories[d.name] || 'skip', previewHeaders: d.preview[0] || [],
                  }))
                );
                await fetch('/api/db/bookmarks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label: bulan, spreadsheetId: id, sheetMap, extraSheets }) });
                const res = await fetch('/api/db/bookmarks');
                setBookmarks(Array.isArray(await res.json()) ? await res.json() : []);
              }} className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-50">
                <Save className="w-4 h-4" />Simpan
              </button>
            )}
          </div>

          {detectError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{detectError}</div>
          )}

          {/* Sheet checklist */}
          {detected.length > 0 && !detecting && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{detected.length} Tab Ditemukan</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setAllCategory('cs')} className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium">Semua → CS</button>
                  <button onClick={() => setAllCategory('adv')} className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium">Semua → ADV</button>
                  <button onClick={() => setAllCategory('skip')} className="text-xs px-2 py-1 rounded bg-slate-50 text-slate-500 hover:bg-slate-100 font-medium">Reset</button>
                </div>
              </div>

              {/* Filter */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="text" value={filterText} onChange={e => setFilterText(e.target.value)} placeholder="Cari nama sheet atau kolom..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300" />
              </div>

              {/* Groups */}
              {(['main', 'cs', 'adv', 'skip', 'unknown'] as const).map(groupKey => {
                const groupSheets = grouped[groupKey];
                if (groupSheets.length === 0) return null;
                const groupMeta = {
                  main: { label: 'Main (Data Utama)', cls: 'text-indigo-700', bg: 'bg-indigo-50/50' },
                  cs:   { label: 'CS', cls: 'text-emerald-700', bg: 'bg-emerald-50/50' },
                  adv:  { label: 'ADV', cls: 'text-amber-700', bg: 'bg-amber-50/50' },
                  skip: { label: 'Skip (Tidak Dimuat)', cls: 'text-slate-500', bg: 'bg-slate-50/50' },
                  unknown: { label: 'Belum Dikategorikan', cls: 'text-slate-500', bg: 'bg-slate-50/30' },
                }[groupKey];
                return (
                  <div key={groupKey} className={`rounded-xl border border-slate-100 overflow-hidden ${groupMeta.bg}`}>
                    <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider ${groupMeta.cls}`}>
                      {groupMeta.label} ({groupSheets.length})
                    </div>
                    <div className="divide-y divide-slate-100">
                      {groupSheets.map(s => {
                        const display = getDisplayName(s);
                        const cat = categories[s.name] || 'skip';
                        const catStyle = categoryLabel(cat);
                        const previewCols = (s.preview[0] || []).filter(Boolean).slice(0, 6);
                        return (
                          <div key={s.name} className="flex items-start gap-3 px-3 py-2.5 hover:bg-white/60 transition-colors">
                            <button onClick={() => setChecked(p => ({ ...p, [s.name]: !p[s.name] }))} className="mt-0.5 shrink-0 text-slate-400 hover:text-indigo-600">
                              {checked[s.name] ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-slate-800 truncate max-w-xs" title={display}>{display}</span>
                                {s.rowCount > 0 && <span className="text-xs text-slate-400">{s.rowCount} baris</span>}
                              </div>
                              {previewCols.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {previewCols.map((col, i) => (
                                    <span key={i} className="text-xs px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-500">{col.slice(0, 30)}</span>
                                  ))}
                                  {(s.preview[0] || []).filter(Boolean).length > 6 && (
                                    <span className="text-xs text-slate-400">+{(s.preview[0] || []).filter(Boolean).length - 6} lagi</span>
                                  )}
                                </div>
                              )}
                            </div>
                            {/* Category selector */}
                            <select
                              value={cat}
                              onChange={e => {
                                const newCat = e.target.value as SheetCategory;
                                setCategories(p => ({ ...p, [s.name]: newCat }));
                                setChecked(p => ({ ...p, [s.name]: newCat !== 'skip' }));
                              }}
                              className={`shrink-0 text-xs font-medium px-2 py-1 rounded-lg border-0 outline-none cursor-pointer ${catStyle.cls} ${catStyle.cls.replace('text-', 'bg-').replace('-700', '-100').replace('-400', '-50')}`}
                            >
                              <option value="main">Main</option>
                              <option value="cs">CS</option>
                              <option value="adv">ADV</option>
                              <option value="skip">Skip</option>
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Load button */}
              <div className="flex items-center gap-3 pt-1">
                <button type="button" onClick={handleLoad} disabled={loading || checkedCount === 0}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-500/20">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Memuat data...</> : <><BarChart3 className="w-4 h-4" />Muat Dashboard<ArrowRight className="w-4 h-4" /></>}
                </button>
                <span className="text-xs text-slate-400">{checkedCount} sheet aktif</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
