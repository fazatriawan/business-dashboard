'use client';

import { useState } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Database,
  Loader2,
  ArrowRight,
  FileText,
  UserCircle,
  Megaphone,
  Package,
  Lightbulb,
  XCircle,
} from 'lucide-react';

interface DrillDownPanelProps {
  rawData: {
    sheetName: string;
    type: string;
    headers: string[];
    sampleRows: Record<string, string>[];
  }[];
}

interface DrillResult {
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

export default function DrillDownPanel({ rawData }: DrillDownPanelProps) {
  const [entityType, setEntityType] = useState<'adv' | 'cs' | 'product'>('adv');
  const [entityName, setEntityName] = useState('');
  const [result, setResult] = useState<DrillResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedSheets, setExpandedSheets] = useState<Set<string>>(new Set());

  const handleDrillDown = async () => {
    if (!entityName.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/drill-down', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityName: entityName.trim(),
          availableSheets: rawData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Drill-down failed');
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal melakukan drill-down');
    } finally {
      setLoading(false);
    }
  };

  const toggleSheet = (name: string) => {
    setExpandedSheets(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const typeConfig = {
    adv: { label: 'Advertiser', icon: <Megaphone className="w-4 h-4" />, placeholder: 'Contoh: Fajar, Putra, dll' },
    cs: { label: 'Customer Service', icon: <UserCircle className="w-4 h-4" />, placeholder: 'Contoh: Andi, Budi, dll' },
    product: { label: 'Produk', icon: <Package className="w-4 h-4" />, placeholder: 'Contoh: PG, HRB, NMA, dll' },
  };

  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
        <Database className="w-5 h-5 text-indigo-500" />
        Drill-Down Explorer
      </h2>

      {/* Entity selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Tipe Entitas
          </label>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(typeConfig) as Array<keyof typeof typeConfig>).map(t => {
              const cfg = typeConfig[t];
              return (
                <button
                  key={t}
                  onClick={() => setEntityType(t)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] ${
                    entityType === t
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'
                  }`}
                >
                  {cfg.icon}
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Nama {typeConfig[entityType].label}
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={entityName}
                onChange={e => setEntityName(e.target.value)}
                placeholder={typeConfig[entityType].placeholder}
                onKeyDown={e => e.key === 'Enter' && handleDrillDown()}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>
            <button
              onClick={handleDrillDown}
              disabled={loading || !entityName.trim()}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-md shadow-indigo-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mencari...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Cari
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50/80 border border-red-100 rounded-2xl px-5 py-4">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-indigo-300" />
              <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">Hasil Drill-Down</span>
            </div>
            <div className="text-lg font-bold">{result.entityName}</div>
            <div className="text-sm text-indigo-200 mt-1">{result.summary}</div>
          </div>

          {/* Related sheets */}
          {result.relatedSheets.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                Data Terkait ({result.relatedSheets.length} sheet)
              </h3>
              {result.relatedSheets.map((sheet, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggleSheet(sheet.sheetName)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">{sheet.sheetName}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{sheet.relationType} • {sheet.foundRows.length} baris</div>
                    </div>
                    {expandedSheets.has(sheet.sheetName) ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  {expandedSheets.has(sheet.sheetName) && (
                    <div className="px-5 pb-4">
                      {sheet.foundRows.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-slate-500">
                                {Object.keys(sheet.foundRows[0]).map(h => (
                                  <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {sheet.foundRows.map((row, ri) => (
                                <tr key={ri} className="hover:bg-slate-50">
                                  {Object.values(row).map((val, vi) => (
                                    <td key={vi} className="px-3 py-2 text-slate-700">{val || '—'}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-400 py-3">Tidak ada data ditemukan</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Missing data */}
          {result.missingData.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Data Belum Tersedia ({result.missingData.length} sheet)
              </h3>
              {result.missingData.map((miss, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-amber-50/60 border border-amber-200/70 rounded-2xl">
                  <XCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-amber-900 text-sm">{miss.sheetName}</div>
                    <div className="text-sm text-amber-700/80 mt-0.5">{miss.reason}</div>
                    <div className="text-xs text-amber-600/70 mt-1">💡 {miss.suggestion}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-blue-500" />
                Rekomendasi
              </h3>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <ArrowRight className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
