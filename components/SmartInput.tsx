'use client';

import { useState, useEffect } from 'react';
import {
  Link2,
  Calendar,
  Search,
  Save,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Loader2,
  BarChart3,
  Zap,
  Users,
  UserCircle,
  Megaphone,
  ArrowRight,
  Database,
  EyeOff,
} from 'lucide-react';
import {
  detectSheets,
  extractSpreadsheetId,
  type DetectedSheet,
  type SheetType,
} from '../lib/detectSheets';
import {
  getExcludedSheets,
  addExcludedSheet,
  removeExcludedSheet,
} from '../lib/excludedSheets';

export interface LoadConfig {
  spreadsheetId: string;
  sheetMap: Record<SheetType, string>;
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
  sheetMap: string; // JSON string
  createdAt: string;
  updatedAt: string;
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const TYPE_META: Record<Exclude<SheetType, 'unknown'>, { label: string; icon: React.ReactNode }> = {
  ads: { label: 'Laporan Harian', icon: <BarChart3 className="w-4 h-4" /> },
  totalBiayaIklan: { label: 'Total Biaya Iklan', icon: <Zap className="w-4 h-4" /> },
  totalAllCS: { label: 'TOTAL ALL CS', icon: <Users className="w-4 h-4" /> },
  infoCS: { label: 'Informasi CS', icon: <UserCircle className="w-4 h-4" /> },
  infoADV: { label: 'Informasi ADV', icon: <Megaphone className="w-4 h-4" /> },
};

const TYPE_ORDER: Exclude<SheetType, 'unknown'>[] = [
  'ads',
  'totalBiayaIklan',
  'totalAllCS',
  'infoCS',
  'infoADV',
];

export default function SmartInput({ onLoad, loading }: SmartInputProps) {
  const [open, setOpen] = useState(true);
  const [urlInput, setUrlInput] = useState('');
  const [bulan, setBulan] = useState(() => {
    const d = new Date();
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  });
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState<DetectedSheet[]>([]);
  const [bookmarks, setBookmarks] = useState<DBBookmark[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [detectError, setDetectError] = useState('');
  const [excludedSheets, setExcludedSheets] = useState<string[]>([]);

  useEffect(() => {
    setExcludedSheets(getExcludedSheets());
  }, []);

  // Load bookmarks from SQLite DB
  useEffect(() => {
    setBookmarksLoading(true);
    fetch('/api/db/bookmarks')
      .then(r => r.json())
      .then(data => setBookmarks(Array.isArray(data) ? data : []))
      .catch(() => setBookmarks([]))
      .finally(() => setBookmarksLoading(false));
  }, []);

  const handleDetect = async () => {
    const id = extractSpreadsheetId(urlInput);
    if (!id) {
      setDetectError('URL tidak valid. Pastikan link dari Google Sheets.');
      return;
    }
    setDetectError('');
    setDetecting(true);
    setDetected([]);
    try {
      const sheets = await detectSheets(id);
      setDetected(sheets);
      if (sheets.length === 0) {
        setDetectError('Tidak ada tab yang dikenali. Pastikan nama tab sesuai standar.');
      }
    } catch (e) {
      setDetectError(e instanceof Error ? e.message : 'Gagal scan tab');
    } finally {
      setDetecting(false);
    }
  };

  const handleLoad = () => {
    const id = extractSpreadsheetId(urlInput);
    if (!id) return;

    const activeDetected = detected.filter(d => !excludedSheets.includes(d.name));
    const sheetMap: Record<string, string> = {};
    const extraSheets: Record<string, string[]> = {};

    for (const d of activeDetected) {
      if (d.matchedType && d.matchedType !== 'unknown') {
        // For types that can have multiple sheets (infoCS, infoADV),
        // store extras separately
        if (d.matchedType === 'infoCS' || d.matchedType === 'infoADV') {
          if (!sheetMap[d.matchedType]) {
            sheetMap[d.matchedType] = d.name;
          } else {
            if (!extraSheets[d.matchedType]) extraSheets[d.matchedType] = [];
            extraSheets[d.matchedType].push(d.name);
          }
        } else {
          sheetMap[d.matchedType] = d.name;
        }
      }
    }

    if (!sheetMap['ads']) {
      setDetectError('Tab "Laporan Harian" wajib ditemukan.');
      return;
    }

    onLoad({
      spreadsheetId: id,
      sheetMap: sheetMap as Record<SheetType, string>,
      extraSheets: Object.keys(extraSheets).length > 0 ? extraSheets : undefined,
      bulan,
      label: bulan,
    });
    setOpen(false);
  };

  const handleSaveBookmark = async () => {
    const id = extractSpreadsheetId(urlInput);
    if (!id || detected.length === 0) return;
    const activeDetected = detected.filter(d => !excludedSheets.includes(d.name));
    const sheetMap: Record<string, string> = {};
    const extraSheets: Record<string, string[]> = {};
    for (const d of activeDetected) {
      if (d.matchedType && d.matchedType !== 'unknown') {
        if (d.matchedType === 'infoCS' || d.matchedType === 'infoADV') {
          if (!sheetMap[d.matchedType]) {
            sheetMap[d.matchedType] = d.name;
          } else {
            if (!extraSheets[d.matchedType]) extraSheets[d.matchedType] = [];
            extraSheets[d.matchedType].push(d.name);
          }
        } else {
          sheetMap[d.matchedType] = d.name;
        }
      }
    }

    try {
      await fetch('/api/db/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: bulan, spreadsheetId: id, sheetMap, extraSheets }),
      });
      // Refresh bookmarks
      const res = await fetch('/api/db/bookmarks');
      const data = await res.json();
      setBookmarks(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    }
  };

  const handleSelectBookmark = (bm: DBBookmark) => {
    setUrlInput(`https://docs.google.com/spreadsheets/d/${bm.spreadsheetId}/edit`);
    setBulan(bm.label);
    let parsedMap: Record<string, string> = {};
    try {
      parsedMap = JSON.parse(bm.sheetMap);
    } catch {
      parsedMap = {};
    }
    const reconstructed: DetectedSheet[] = [];
    for (const [type, name] of Object.entries(parsedMap)) {
      reconstructed.push({
        name,
        matchedType: type as SheetType,
        firstRow: '',
        rowCount: 0,
        preview: [],
      });
    }
    setDetected(reconstructed);
    setDetectError('');
  };

  const handleDeleteBookmark = async (id: string) => {
    try {
      await fetch(`/api/db/bookmarks?id=${id}`, { method: 'DELETE' });
      setBookmarks(prev => prev.filter(b => b.id !== id));
    } catch {
      // ignore
    }
  };

  const activeDetected = detected.filter(d => !excludedSheets.includes(d.name));
  const excludedDetected = detected.filter(d => excludedSheets.includes(d.name));

  const detectedMap = new Map<SheetType, DetectedSheet>();
  for (const d of activeDetected) {
    if (d.matchedType) detectedMap.set(d.matchedType, d);
  }

  const foundCount = activeDetected.filter(d => d.matchedType && d.matchedType !== 'unknown').length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50/80 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm">
            <Database className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <span className="font-semibold text-slate-800 text-sm">Sumber Data Google Sheets</span>
            {foundCount > 0 && (
              <span className="ml-2 text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium border border-emerald-100">
                {foundCount} tab
              </span>
            )}
          </div>
        </div>
        <span className="text-slate-400 transition-transform duration-200">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-5 border-t border-slate-100">
          {/* Bookmark dropdown */}
          <div className="pt-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Riwayat (Tersimpan di Database)</label>
              <button
                type="button"
                onClick={() => setShowBookmarks(v => !v)}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                {showBookmarks ? 'Sembunyikan' : `Tampilkan (${bookmarks.length})`}
              </button>
            </div>
            {bookmarksLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Memuat riwayat...
              </div>
            )}
            {showBookmarks && !bookmarksLoading && (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {bookmarks.length === 0 && (
                  <div className="text-xs text-slate-400 py-2">Belum ada riwayat. Bookmark akan tersimpan permanen di database.</div>
                )}
                {bookmarks.map(bm => (
                  <div
                    key={bm.id}
                    className="flex items-center justify-between px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 hover:border-slate-200 cursor-pointer transition-all group"
                    onClick={() => handleSelectBookmark(bm)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-700">{bm.label}</span>
                        <span className="text-xs text-slate-400 ml-2">
                          {Object.keys(JSON.parse(bm.sheetMap || '{}')).length} tab
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteBookmark(bm.id); }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* URL input */}
          <div className="pt-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Link Google Sheets
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Link2 className="w-4 h-4" />
              </div>
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1.5 ml-0.5">
              Paste link spreadsheet utama. Dashboard akan otomatis mencari semua tab.
            </p>
          </div>

          {/* Period */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Periode Bulan
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={bulan}
                onChange={e => setBulan(e.target.value)}
                placeholder="April 2026"
                className="w-full md:w-72 pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>
          </div>

          {/* Detect button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDetect}
              disabled={detecting || !urlInput}
              className="inline-flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-sm"
            >
              {detecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mendeteksi tab...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Deteksi Tab
                </>
              )}
            </button>
            {detected.length > 0 && (
              <button
                type="button"
                onClick={handleSaveBookmark}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors px-3 py-2 rounded-lg hover:bg-indigo-50"
              >
                <Save className="w-4 h-4" />
                Simpan ke Database
              </button>
            )}
          </div>

          {detectError && (
            <div className="flex items-start gap-2.5 text-sm text-red-700 bg-red-50/80 border border-red-100 rounded-xl px-4 py-3">
              <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
              <span>{detectError}</span>
            </div>
          )}

          {/* Loading skeleton */}
          {detecting && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl" />
              ))}
            </div>
          )}

          {/* Detected sheets */}
          {detected.length > 0 && !detecting && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tab Terdeteksi</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TYPE_ORDER.map(type => {
                  const d = detectedMap.get(type);
                  const meta = TYPE_META[type];
                  return (
                    <div
                      key={type}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border text-sm transition-all ${
                        d
                          ? 'bg-emerald-50/60 border-emerald-200/70 text-emerald-900'
                          : 'bg-slate-50 border-slate-100 text-slate-400'
                      }`}
                    >
                      <div className={`shrink-0 ${d ? 'text-emerald-600' : 'text-slate-300'}`}>
                        {meta.icon}
                      </div>
                      <span className="font-medium text-sm">{meta.label}</span>
                      {d ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addExcludedSheet(d.name);
                              setExcludedSheets(getExcludedSheets());
                            }}
                            className="ml-auto text-slate-400 hover:text-red-500 transition-colors shrink-0"
                            title="Sembunyikan sheet ini"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </button>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="text-xs text-emerald-600/80 font-medium shrink-0">
                            {d.rowCount} baris
                          </span>
                        </>
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300 ml-auto shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Excluded sheets */}
              {excludedDetected.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Sheet Disembunyikan ({excludedDetected.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {excludedDetected.map(d => (
                      <div
                        key={d.name}
                        className="flex items-center gap-3 px-3.5 py-3 rounded-xl border bg-slate-50 border-slate-100 text-slate-400 text-sm"
                      >
                        <EyeOff className="w-4 h-4 text-slate-300 shrink-0" />
                        <span className="font-medium text-sm">{d.name}</span>
                        <button
                          onClick={() => {
                            removeExcludedSheet(d.name);
                            setExcludedSheets(getExcludedSheets());
                          }}
                          className="ml-auto text-xs text-indigo-600 hover:text-indigo-700 font-medium shrink-0"
                        >
                          Tampilkan
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Load button */}
          {detected.length > 0 && !detecting && (
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleLoad}
                disabled={loading || !detectedMap.has('ads')}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-md shadow-indigo-500/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memuat data...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4" />
                    Muat Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Tutup
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
