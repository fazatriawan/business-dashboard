'use client';

import { useState } from 'react';
import {
  KPISummary, CSRow, ADVRow,
  ADVSpendRow, KPIBenchmark, CSDailyRow, DashboardCSRow, GrowthRow,
} from '../lib/types';
import { buildErrorSummary, formatErrorForPrompt, ErrorSummary } from '../lib/detectErrors';
import ErrorFixPanel from './ErrorFixPanel';

interface AIAnalysisProps {
  kpi: KPISummary;
  rawAds: Record<string, string>[];
  rawCS: Record<string, string>[];
  rawADV: Record<string, string>[];
  csData: CSRow[];
  advData: ADVRow[];
  advSpend: ADVSpendRow[];
  kpiBenchmarks: KPIBenchmark[];
  csDaily: CSDailyRow[];
  dashboardCS: DashboardCSRow[];
  growth: GrowthRow[];
  bulan: string;
}

interface TindakanItem {
  prioritas: number;
  judul: string;
  detail: string;
  target_pelaksana: string;
  deadline: string;
  dampak_estimasi: string;
}

interface KendalaItem {
  rank: number;
  kendala: string;
  dampak: string;
  solusi: string;
}

interface BreakdownItem {
  nama: string;
  target: number;
  rencana: string;
}

interface FormulaErr {
  sheet: string;
  kolom: string;
  baris_contoh: string;
  jenis_error: string;
  kemungkinan_penyebab: string;
  saran_perbaikan: string;
}

interface AnalisisResult {
  ringkasan_eksekutif: string;
  skor_kesehatan: number;
  highlight_positif: string[];
  highlight_negatif: string[];
  analisis: { target: string; cs: string; ads: string; produk: string };
  tindakan_prioritas: TindakanItem[];
  peringatan: string[];
  pertanyaan_untuk_tim: string[];
  formula_errors: FormulaErr[];
  target_omzet?: { target: number; aktual: number; persen: number; analisis: string };
  budget_dan_caq?: { total_budget: number; caq_rata2: number; efisiensi: string };
  produk_kontribusi_terbesar?: string[];
  target_per_produk?: { nama: string; target: number; aktual: number; persen: number; analisis: string }[];
  kendala_adv?: KendalaItem[];
  kendala_cs?: KendalaItem[];
  temuan_tim?: string[];
  pemanfaatan_lead_bef?: string;
  evaluasi_promo?: string;
  rencana_strategi_bulan_depan?: string;
  breakdown_target?: { per_adv: BreakdownItem[]; per_cs: BreakdownItem[] };
  rab_iklan_pekan_pertama?: string;
  kebijakan_tim_dan_dampak?: string;
  evaluasi_sdm?: string;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function skorColor(n: number) {
  if (n >= 75) return { ring: 'text-green-600',  bg: 'bg-green-50',  label: 'SEHAT' };
  if (n >= 50) return { ring: 'text-yellow-600', bg: 'bg-yellow-50', label: 'PERLU PERHATIAN' };
  return         { ring: 'text-red-600',    bg: 'bg-red-50',    label: 'KRITIS' };
}

const DEADLINE_COLOR: Record<string, string> = {
  'hari ini':    'bg-red-100    text-red-800    border border-red-200',
  'minggu ini':  'bg-orange-100 text-orange-800 border border-orange-200',
  'bulan depan': 'bg-blue-100   text-blue-800   border border-blue-200',
};
function deadlineColor(d: string) {
  const key = Object.keys(DEADLINE_COLOR).find(k => d.toLowerCase().includes(k));
  return key ? DEADLINE_COLOR[key] : 'bg-gray-100 text-gray-700 border border-gray-200';
}

function fmtRp(n: number) {
  if (!n) return 'Rp 0';
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000)         return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n.toFixed(0)}`;
}

// ── sub-components ────────────────────────────────────────────────────────────

function SkorKesehatan({ skor }: { skor: number }) {
  const c = skorColor(skor);
  return (
    <div className={`${c.bg} rounded-xl px-5 py-4 flex items-center gap-4`}>
      <div className={`text-5xl font-black ${c.ring}`}>{skor}</div>
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wide">Skor Kesehatan Bisnis</div>
        <div className={`text-sm font-bold ${c.ring}`}>{c.label}</div>
        <div className="text-xs text-gray-400 mt-0.5">dari 100 poin</div>
      </div>
      <div className="flex-1 ml-4 hidden sm:block">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${skor >= 75 ? 'bg-green-500' : skor >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min(skor, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function TindakanCard({ t }: { t: TindakanItem }) {
  const [open, setOpen] = useState(false);
  const urgency = t.prioritas === 1 ? 'border-l-red-500' : t.prioritas === 2 ? 'border-l-orange-400' : 'border-l-blue-400';
  return (
    <div className={`border-l-4 ${urgency} bg-white border border-gray-100 rounded-r-xl shadow-sm overflow-hidden`}>
      <button className="w-full text-left px-4 py-3 hover:bg-gray-50" onClick={() => setOpen(v => !v)}>
        <div className="flex items-start gap-3">
          <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold
            ${t.prioritas === 1 ? 'bg-red-500' : t.prioritas === 2 ? 'bg-orange-400' : 'bg-blue-500'}`}>
            {t.prioritas}
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-800 text-sm">{t.judul}</div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${deadlineColor(t.deadline)}`}>
                {t.deadline}
              </span>
              <span className="text-xs text-gray-500">→ {t.target_pelaksana}</span>
            </div>
          </div>
          <span className="text-gray-400 text-xs shrink-0">{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-3 border-t border-gray-50 space-y-2">
          <p className="text-sm text-gray-700 pt-2">{t.detail}</p>
          {t.dampak_estimasi && (
            <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-1.5 text-sm text-green-800">
              💡 <strong>Dampak estimasi:</strong> {t.dampak_estimasi}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function KendalaCard({ k, type }: { k: KendalaItem; type: 'adv' | 'cs' }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
          type === 'adv' ? 'bg-purple-500' : 'bg-blue-500'
        }`}>
          {k.rank}
        </span>
        <span className="font-semibold text-gray-800 text-sm">{k.kendala}</span>
      </div>
      <div className="space-y-1 text-sm">
        <p className="text-gray-600"><span className="text-gray-400">Dampak:</span> {k.dampak}</p>
        <p className="text-green-700"><span className="text-green-500">Solusi:</span> {k.solusi}</p>
      </div>
    </div>
  );
}

function FormulaErrorPanel({ items }: { items: FormulaErr[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  if (!items || !items.length) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">
        🔧 Saran Perbaikan Formula ({items.length})
      </h3>
      <div className="space-y-2">
        {items.map((fe, i) => (
          <div key={i} className="bg-white border border-orange-200 rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-orange-50 transition-colors"
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="font-mono text-red-600 font-bold text-xs bg-red-50 px-1.5 py-0.5 rounded">{fe.jenis_error}</span>
                <span className="text-gray-600 text-xs">Sheet: <strong>{fe.sheet}</strong></span>
                <span className="text-gray-400 text-xs">›</span>
                <span className="text-gray-600 text-xs">Kolom: <strong>{fe.kolom}</strong></span>
              </div>
              <span className="text-gray-400 text-xs shrink-0 ml-2">{expanded === i ? '▲' : '▼'}</span>
            </button>
            {expanded === i && (
              <div className="px-4 pb-3 border-t border-orange-100 space-y-2 text-sm">
                <div className="pt-2 text-xs text-gray-500">
                  Contoh baris: <strong className="text-gray-700">{fe.baris_contoh}</strong>
                </div>
                <p className="text-gray-700">{fe.kemungkinan_penyebab}</p>
                <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                  <span className="text-xs font-semibold text-green-700">✅ Saran perbaikan:</span>
                  <p className="text-green-800 mt-0.5">{fe.saran_perbaikan}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RawErrorBanner({ errorSummary }: { errorSummary: ErrorSummary }) {
  if (!errorSummary.adaError) return null;
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm">
      <div className="flex items-center gap-2 mb-1">
        <span>⚠️</span>
        <span className="font-semibold text-orange-800">
          {errorSummary.totalSemuaError} error formula terdeteksi di spreadsheet
        </span>
      </div>
      <div className="flex flex-wrap gap-2 mb-1">
        {Object.entries(errorSummary.byType).map(([t, c]) => (
          <span key={t} className="font-mono text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">{t}: {c}x</span>
        ))}
      </div>
      {errorSummary.perSheet.map(s => (
        <div key={s.namaSheet} className="text-xs text-orange-700">
          <strong>{s.namaSheet}</strong>: {s.kolomTerpengaruh.join(', ')}
        </div>
      ))}
      <p className="text-xs text-orange-600 mt-1">Analisis AI akan memberikan saran perbaikan spesifik.</p>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function AIAnalysis({
  kpi, rawAds, rawCS, rawADV,
  csData, advData,
  advSpend, kpiBenchmarks, csDaily, dashboardCS, growth,
  bulan,
}: AIAnalysisProps) {
  const [result, setResult]   = useState<AnalisisResult | null>(null);
  const [fallback, setFallback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);
  const [showAnalisis, setShowAnalisis] = useState(false);
  const [providerName, setProviderName] = useState<string>('');

  const errorSummary = buildErrorSummary(rawAds, rawCS, rawADV);

  const run = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    setFallback('');
    setDone(false);
    setShowAnalisis(false);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary:     kpi,
          rawData:     rawAds.slice(0, 30),
          bulan,
          csData:      csData.slice(0, 40),
          advData:     advData.slice(0, 30),
          advSpend:    advSpend.slice(0, 40),
          kpiBenchmarks: kpiBenchmarks.slice(0, 30),
          csDaily:     csDaily.slice(0, 40),
          dashboardCS: dashboardCS.slice(0, 30),
          growth:      growth.slice(0, 30),
          errorReport: formatErrorForPrompt(errorSummary),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menganalisis');
      if (data.quick) setResult(data.quick as AnalisisResult);
      if (data.analysis) setFallback(data.analysis);
      setProviderName(data.provider || 'unknown');
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-gray-700">Analisis AI (Gemini)</h2>
        <button
          onClick={run}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading
            ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Menganalisis...</>
            : <>✨ {done ? 'Analisis Ulang' : 'Analisis dengan AI'}</>
          }
        </button>
      </div>

      {/* Error scanner */}
      <RawErrorBanner errorSummary={errorSummary} />

      {/* Error Fix Proposal */}
      <ErrorFixPanel errorSummary={errorSummary} />

      {/* API error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-gray-500">
          <div className="flex justify-center mb-3">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
          </div>
          <p>Menganalisis data {bulan} dengan Gemini...</p>
          <p className="text-xs mt-1 text-gray-400">Biasanya 10–25 detik</p>
        </div>
      )}

      {/* Empty state */}
      {!done && !loading && !error && (
        <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400">
          <div className="text-4xl mb-2">✨</div>
          <p className="text-sm">Klik &quot;Analisis dengan AI&quot; untuk laporan komprehensif:</p>
          <p className="text-sm">target omzet, kendala ADV/CS, rencana strategi, evaluasi tim, dan saran formula.</p>
        </div>
      )}

      {/* Structured result */}
      {done && result && (
        <div className="space-y-5">
          {/* Provider badge */}
          {providerName && (
            <div className="flex justify-end">
              <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium border border-indigo-100">
                🤖 Analisis oleh {providerName.charAt(0).toUpperCase() + providerName.slice(1)}
              </span>
            </div>
          )}

          {/* Skor */}
          <SkorKesehatan skor={result.skor_kesehatan ?? 0} />

          {/* Ringkasan */}
          {result.ringkasan_eksekutif && (
            <div className="bg-white border border-gray-100 rounded-xl px-5 py-4 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Ringkasan Eksekutif</div>
              <p className="text-gray-800 text-sm leading-relaxed">{result.ringkasan_eksekutif}</p>
            </div>
          )}

          {/* Target Omzet */}
          {result.target_omzet && (
            <div className="bg-white border border-gray-100 rounded-xl px-5 py-4 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">🎯 Target Omzet</div>
              <div className="flex items-center gap-4 mb-2">
                <div>
                  <div className="text-xs text-gray-400">Target</div>
                  <div className="font-bold text-gray-800">{fmtRp(result.target_omzet.target)}</div>
                </div>
                <div className="text-gray-300">→</div>
                <div>
                  <div className="text-xs text-gray-400">Aktual</div>
                  <div className="font-bold text-gray-800">{fmtRp(result.target_omzet.aktual)}</div>
                </div>
                <div className="text-gray-300">→</div>
                <div>
                  <div className="text-xs text-gray-400">Tercapai</div>
                  <div className={`font-bold ${result.target_omzet.persen >= 100 ? 'text-green-600' : result.target_omzet.persen >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {result.target_omzet.persen}%
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-700">{result.target_omzet.analisis}</p>
            </div>
          )}

          {/* Highlight positif / negatif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {result.highlight_positif?.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <div className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">✅ Highlight Positif</div>
                <ul className="space-y-1">
                  {result.highlight_positif.map((h, i) => (
                    <li key={i} className="text-sm text-green-800 flex gap-2"><span className="shrink-0">•</span><span>{h}</span></li>
                  ))}
                </ul>
              </div>
            )}
            {result.highlight_negatif?.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <div className="text-xs font-semibold text-red-700 mb-2 uppercase tracking-wide">❌ Highlight Negatif</div>
                <ul className="space-y-1">
                  {result.highlight_negatif.map((h, i) => (
                    <li key={i} className="text-sm text-red-800 flex gap-2"><span className="shrink-0">•</span><span>{h}</span></li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Budget & CAQ */}
          {result.budget_dan_caq && (
            <div className="bg-white border border-gray-100 rounded-xl px-5 py-4 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">💰 Budget & CAQ</div>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <div className="text-xs text-gray-400">Total Budget</div>
                  <div className="font-bold text-gray-800">{fmtRp(result.budget_dan_caq.total_budget)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">CAQ Rata-rata</div>
                  <div className="font-bold text-gray-800">{fmtRp(result.budget_dan_caq.caq_rata2)}</div>
                </div>
              </div>
              <p className="text-sm text-gray-700">{result.budget_dan_caq.efisiensi}</p>
            </div>
          )}

          {/* Produk kontribusi */}
          {result.produk_kontribusi_terbesar && result.produk_kontribusi_terbesar.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl px-5 py-4 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📦 Produk Kontribusi Terbesar</div>
              <div className="flex flex-wrap gap-2">
                {result.produk_kontribusi_terbesar.map((p, i) => (
                  <span key={i} className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
                    {i + 1}. {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Target per produk */}
          {result.target_per_produk && result.target_per_produk.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl px-5 py-4 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">🎯 Target per Produk</div>
              <div className="space-y-2">
                {result.target_per_produk.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-24 font-medium text-gray-700">{p.nama}</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${p.persen >= 100 ? 'bg-green-500' : p.persen >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(p.persen, 100)}%` }}
                      />
                    </div>
                    <span className="w-20 text-right text-xs text-gray-500">{p.persen}%</span>
                    <span className="text-xs text-gray-400 hidden sm:inline">{p.analisis}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Kendala ADV */}
          {result.kendala_adv && result.kendala_adv.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">🔴 3 Kendala Terbesar ADV</div>
              <div className="space-y-2">
                {result.kendala_adv.map((k, i) => <KendalaCard key={i} k={k} type="adv" />)}
              </div>
            </div>
          )}

          {/* Kendala CS */}
          {result.kendala_cs && result.kendala_cs.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">🔴 3 Kendala Terbesar CS</div>
              <div className="space-y-2">
                {result.kendala_cs.map((k, i) => <KendalaCard key={i} k={k} type="cs" />)}
              </div>
            </div>
          )}

          {/* Tindakan Prioritas */}
          {result.tindakan_prioritas?.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-3">🎯 Tindakan Prioritas</div>
              <div className="space-y-2">
                {result.tindakan_prioritas.map((t, i) => <TindakanCard key={i} t={t} />)}
              </div>
            </div>
          )}

          {/* Temuan Tim */}
          {result.temuan_tim && result.temuan_tim.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
              <div className="text-xs font-semibold text-orange-800 mb-2 uppercase tracking-wide">⚠️ Temuan Tim yang Perlu Diatasi</div>
              <ul className="space-y-1">
                {result.temuan_tim.map((t, i) => (
                  <li key={i} className="text-sm text-orange-900 flex gap-2"><span className="shrink-0">•</span><span>{t}</span></li>
                ))}
              </ul>
            </div>
          )}

          {/* Lead BEF, Promo, Strategi, RAB, Kebijakan, SDM */}
          {(result.pemanfaatan_lead_bef || result.evaluasi_promo || result.rencana_strategi_bulan_depan || result.rab_iklan_pekan_pertama || result.kebijakan_tim_dan_dampak || result.evaluasi_sdm) && (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100">
              {result.pemanfaatan_lead_bef && (
                <div className="px-5 py-3">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">📊 Pemanfaatan Data Lead BEF</div>
                  <p className="text-sm text-gray-700">{result.pemanfaatan_lead_bef}</p>
                </div>
              )}
              {result.evaluasi_promo && (
                <div className="px-5 py-3">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">🎁 Evaluasi Promo</div>
                  <p className="text-sm text-gray-700">{result.evaluasi_promo}</p>
                </div>
              )}
              {result.rencana_strategi_bulan_depan && (
                <div className="px-5 py-3">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">🚀 Rencana Strategi Bulan Depan</div>
                  <p className="text-sm text-gray-700">{result.rencana_strategi_bulan_depan}</p>
                </div>
              )}
              {result.rab_iklan_pekan_pertama && (
                <div className="px-5 py-3">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">📋 RAB Iklan Pekan Pertama</div>
                  <p className="text-sm text-gray-700">{result.rab_iklan_pekan_pertama}</p>
                </div>
              )}
              {result.kebijakan_tim_dan_dampak && (
                <div className="px-5 py-3">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">📜 Kebijakan Tim & Dampak</div>
                  <p className="text-sm text-gray-700">{result.kebijakan_tim_dan_dampak}</p>
                </div>
              )}
              {result.evaluasi_sdm && (
                <div className="px-5 py-3">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">👥 Evaluasi SDM</div>
                  <p className="text-sm text-gray-700">{result.evaluasi_sdm}</p>
                </div>
              )}
            </div>
          )}

          {/* Breakdown Target */}
          {result.breakdown_target && (result.breakdown_target.per_adv?.length > 0 || result.breakdown_target.per_cs?.length > 0) && (
            <div className="bg-white border border-gray-100 rounded-xl px-5 py-4 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">🎯 Breakdown Target</div>
              {result.breakdown_target.per_adv?.length > 0 && (
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-700 mb-1">Per ADV</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.breakdown_target.per_adv.map((a, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
                        <span className="font-medium text-gray-800">{a.nama}</span>
                        <span className="text-gray-500 mx-2">•</span>
                        <span className="text-gray-600">Target: {fmtRp(a.target)}</span>
                        <p className="text-xs text-gray-500 mt-0.5">{a.rencana}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {result.breakdown_target.per_cs?.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Per CS</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.breakdown_target.per_cs.map((c, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
                        <span className="font-medium text-gray-800">{c.nama}</span>
                        <span className="text-gray-500 mx-2">•</span>
                        <span className="text-gray-600">Target: {c.target} closing</span>
                        <p className="text-xs text-gray-500 mt-0.5">{c.rencana}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Formula Errors */}
          <FormulaErrorPanel items={result.formula_errors ?? []} />

          {/* Peringatan */}
          {result.peringatan?.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
              <div className="text-xs font-semibold text-yellow-800 mb-2 uppercase tracking-wide">⚠️ Peringatan Bulan Depan</div>
              <ul className="space-y-1">
                {result.peringatan.map((p, i) => (
                  <li key={i} className="text-sm text-yellow-900 flex gap-2"><span className="shrink-0">•</span><span>{p}</span></li>
                ))}
              </ul>
            </div>
          )}

          {/* Pertanyaan untuk tim */}
          {result.pertanyaan_untuk_tim?.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <div className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">💬 Pertanyaan untuk Tim</div>
              <ul className="space-y-1">
                {result.pertanyaan_untuk_tim.map((q, i) => (
                  <li key={i} className="text-sm text-blue-900 flex gap-2">
                    <span className="shrink-0 font-bold">{i + 1}.</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Analisis detail (collapsible) */}
          {result.analisis && (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setShowAnalisis(v => !v)}
              >
                <span className="text-sm font-semibold text-gray-700">📄 Analisis Detail per Bidang</span>
                <span className="text-gray-400 text-sm">{showAnalisis ? '▲ Sembunyikan' : '▼ Tampilkan'}</span>
              </button>
              {showAnalisis && (
                <div className="px-5 pb-5 border-t border-gray-100 divide-y divide-gray-100">
                  {Object.entries(result.analisis).map(([key, val]) => (
                    <div key={key} className="py-3">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{key}</div>
                      <p className="text-sm text-gray-700 leading-relaxed">{val as string}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Fallback if JSON parse failed */}
      {done && !result && fallback && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap">{fallback}</pre>
        </div>
      )}
    </div>
  );
}
