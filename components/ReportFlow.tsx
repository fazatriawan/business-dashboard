'use client';

import { useMemo } from 'react';
import {
  KPISummary, AdsRow, ADVSpendRow, CSDailyRow,
  DashboardCSRow, GrowthRow, KPIBenchmark,
} from '../lib/types';

interface ReportFlowProps {
  kpi: KPISummary;
  ads: AdsRow[];
  advSpend: ADVSpendRow[];
  csDaily: CSDailyRow[];
  dashboardCS: DashboardCSRow[];
  growth: GrowthRow[];
  kpiBenchmarks: KPIBenchmark[];
  bulan: string;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtRp(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000)         return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n.toFixed(0)}`;
}

function fmtNum(n: number) {
  return n.toLocaleString('id-ID');
}

function pct(n: number) {
  return `${n.toFixed(1)}%`;
}

const STATUS_COLOR: Record<string, string> = {
  'scale up': 'bg-green-100 text-green-800',
  'scale':    'bg-green-100 text-green-800',
  'hold':     'bg-yellow-100 text-yellow-800',
  'do':       'bg-orange-100 text-orange-800',
  'off':      'bg-red-100 text-red-800',
  'downscale':'bg-orange-100 text-orange-800',
};

function statusBadge(status: string) {
  const s = status.toLowerCase().trim();
  const cls = STATUS_COLOR[s] || 'bg-gray-100 text-gray-700';
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>{status}</span>;
}

// ── Tahap 1: Executive Summary ────────────────────────────────────────────────

function ExecutiveSummary({ kpi, growth, bulan }: { kpi: KPISummary; growth: GrowthRow[]; bulan: string }) {
  const growthRate = useMemo(() => {
    if (growth.length < 2) return 0;
    const first = growth[0].omset;
    const last = growth[growth.length - 1].omset;
    return first > 0 ? ((last - first) / first) * 100 : 0;
  }, [growth]);

  const avgDailyOmset = useMemo(() => {
    return growth.length ? growth.reduce((s, g) => s + g.omset, 0) / growth.length : 0;
  }, [growth]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800">📈 Executive Summary — {bulan}</h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm border-l-4 border-l-green-500">
          <div className="text-xs text-gray-500 mb-1">Total Omset</div>
          <div className="text-xl font-bold text-gray-800">{fmtRp(kpi.totalOmset)}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm border-l-4 border-l-blue-500">
          <div className="text-xs text-gray-500 mb-1">Total Budget Iklan</div>
          <div className="text-xl font-bold text-gray-800">{fmtRp(kpi.totalBudget)}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm border-l-4 border-l-purple-500">
          <div className="text-xs text-gray-500 mb-1">Total Closing</div>
          <div className="text-xl font-bold text-gray-800">{fmtNum(kpi.totalClosing)}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm border-l-4 border-l-teal-500">
          <div className="text-xs text-gray-500 mb-1">ROAS</div>
          <div className="text-xl font-bold text-gray-800">{kpi.roas.toFixed(2)}x</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Pertumbuhan Omset (First → Last)</div>
          <div className={`text-xl font-bold ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Rata-rata Omset Harian</div>
          <div className="text-xl font-bold text-gray-800">{fmtRp(avgDailyOmset)}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Avg Closing Rate</div>
          <div className="text-xl font-bold text-gray-800">{pct(kpi.avgCR)}</div>
        </div>
      </div>

      {/* Growth mini chart */}
      {growth.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="text-sm font-semibold text-gray-700 mb-3">Tren Omset Harian</div>
          <div className="h-32 flex items-end gap-1">
            {growth.map((g, i) => {
              const max = Math.max(...growth.map(x => x.omset));
              const h = max > 0 ? (g.omset / max) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className="w-full bg-teal-500 rounded-t hover:bg-teal-600 transition-colors"
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[9px] text-gray-400 truncate w-full text-center">{g.date.split('/')[0]}</span>
                  <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    {g.date}: {fmtRp(g.omset)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tahap 2: Marketing Efficiency ─────────────────────────────────────────────

function MarketingEfficiency({ advSpend, kpiBenchmarks }: { advSpend: ADVSpendRow[]; kpiBenchmarks: KPIBenchmark[] }) {
  const byADV = useMemo(() => {
    const map: Record<string, { spend: number; omset: number; avgCAQ: number; count: number; status: string }> = {};
    for (const r of advSpend) {
      const key = r.adv;
      if (!map[key]) map[key] = { spend: 0, omset: 0, avgCAQ: 0, count: 0, status: r.status };
      map[key].spend += r.budgetAktual;
      map[key].omset += r.omset;
      map[key].avgCAQ += r.persentaseCAQ;
      map[key].count += 1;
    }
    return Object.entries(map).map(([adv, d]) => ({
      adv,
      spend: d.spend,
      omset: d.omset,
      avgCAQ: d.count ? d.avgCAQ / d.count : 0,
      status: d.status,
      roas: d.spend > 0 ? d.omset / d.spend : 0,
    })).sort((a, b) => b.omset - a.omset);
  }, [advSpend]);

  const caqTargets = useMemo(() => {
    return kpiBenchmarks.filter(b => b.metric === 'CAQ');
  }, [kpiBenchmarks]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800">📣 Analisis Efisiensi Marketing</h3>

      {/* CAQ vs Target */}
      {caqTargets.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="text-sm font-semibold text-gray-700 mb-3">CAQ Aktual vs Target (Benchmark)</div>
          <div className="space-y-2">
            {caqTargets.map((b, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="w-32 font-medium text-gray-700">{b.produk} {b.channel}</span>
                <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full ${b.persentase > 100 ? 'bg-red-500' : b.persentase > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(b.persentase, 100)}%` }}
                  />
                </div>
                <span className="w-24 text-right text-xs text-gray-500">
                  {fmtRp(b.value)} / {fmtRp(b.maksimal)} ({b.persentase.toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADV Status */}
      {byADV.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="text-sm font-semibold text-gray-700 mb-3">Performa per Advertiser</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                  <th className="px-3 py-2 text-left">Advertiser</th>
                  <th className="px-3 py-2 text-right">Budget Aktual</th>
                  <th className="px-3 py-2 text-right">Omset</th>
                  <th className="px-3 py-2 text-right">ROAS</th>
                  <th className="px-3 py-2 text-right">Avg CAQ%</th>
                  <th className="px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {byADV.map((a, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-800">{a.adv}</td>
                    <td className="px-3 py-2 text-right">{fmtRp(a.spend)}</td>
                    <td className="px-3 py-2 text-right">{fmtRp(a.omset)}</td>
                    <td className="px-3 py-2 text-right font-medium">{a.roas.toFixed(2)}x</td>
                    <td className="px-3 py-2 text-right">{a.avgCAQ.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-center">{statusBadge(a.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tahap 3: Product Portfolio ────────────────────────────────────────────────

function ProductPortfolio({ ads }: { ads: AdsRow[] }) {
  const byProduct = useMemo(() => {
    const map: Record<string, { budget: number; lead: number; closing: number; omset: number; evalCounts: Record<string, number> }> = {};
    for (const row of ads) {
      for (const p of row.products) {
        if (!p.name) continue;
        if (!map[p.name]) map[p.name] = { budget: 0, lead: 0, closing: 0, omset: 0, evalCounts: {} };
        map[p.name].budget += p.budgetIklan;
        map[p.name].lead += p.jumlahLead;
        map[p.name].closing += p.closing;
        map[p.name].omset += p.omset;
        if (p.evaluasi) {
          map[p.name].evalCounts[p.evaluasi] = (map[p.name].evalCounts[p.evaluasi] || 0) + 1;
        }
      }
    }
    return Object.entries(map).map(([name, d]) => {
      const dominantEval = Object.entries(d.evalCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
      return {
        name,
        budget: d.budget,
        lead: d.lead,
        closing: d.closing,
        omset: d.omset,
        roas: d.budget > 0 ? d.omset / d.budget : 0,
        cr: d.lead > 0 ? (d.closing / d.lead) * 100 : 0,
        evaluasi: dominantEval,
      };
    }).sort((a, b) => b.omset - a.omset);
  }, [ads]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800">📦 Analisis Portofolio Produk</h3>

      {byProduct.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
          Data produk per baris belum tersedia. Parser saat ini hanya membaca kolom TOTAL.
        </div>
      )}

      {byProduct.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {byProduct.map((p, i) => (
            <div key={i} className={`bg-white border rounded-xl p-4 shadow-sm ${
              i === 0 ? 'border-l-4 border-l-green-500' :
              i === 1 ? 'border-l-4 border-l-blue-500' :
              i === 2 ? 'border-l-4 border-l-purple-500' :
              'border-gray-100'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-800">{p.name}</span>
                {statusBadge(p.evaluasi)}
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between"><span>Budget:</span><span className="font-medium">{fmtRp(p.budget)}</span></div>
                <div className="flex justify-between"><span>Omset:</span><span className="font-medium text-green-700">{fmtRp(p.omset)}</span></div>
                <div className="flex justify-between"><span>ROAS:</span><span className="font-medium">{p.roas.toFixed(2)}x</span></div>
                <div className="flex justify-between"><span>Closing:</span><span className="font-medium">{fmtNum(p.closing)}</span></div>
                <div className="flex justify-between"><span>CR:</span><span className="font-medium">{pct(p.cr)}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tahap 4: CS Productivity ──────────────────────────────────────────────────

function CSProductivity({ csDaily, dashboardCS }: { csDaily: CSDailyRow[]; dashboardCS: DashboardCSRow[] }) {
  const csSummary = useMemo(() => {
    const map: Record<string, { wa: number; closing: number; botol: number; omset: number; count: number }> = {};
    for (const r of csDaily) {
      if (!map[r.cs]) map[r.cs] = { wa: 0, closing: 0, botol: 0, omset: 0, count: 0 };
      map[r.cs].wa += r.whatsapp;
      map[r.cs].closing += r.closing;
      map[r.cs].botol += r.botol;
      map[r.cs].omset += r.omset;
      map[r.cs].count += 1;
    }
    return Object.entries(map).map(([cs, d]) => ({
      cs,
      wa: d.wa,
      closing: d.closing,
      botol: d.botol,
      omset: d.omset,
      cr: d.wa > 0 ? (d.closing / d.wa) * 100 : 0,
      avgLead: d.count > 0 ? d.wa / d.count : 0,
    })).sort((a, b) => b.closing - a.closing);
  }, [csDaily]);

  const dashboardMap = useMemo(() => {
    const map: Record<string, DashboardCSRow> = {};
    for (const d of dashboardCS) {
      if (d.cs) map[d.cs] = d;
    }
    return map;
  }, [dashboardCS]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800">👤 Analisis Produktivitas CS</h3>

      {csSummary.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-xs uppercase">
                  <th className="px-4 py-3 text-left">CS</th>
                  <th className="px-4 py-3 text-right">WA Masuk</th>
                  <th className="px-4 py-3 text-right">Closing</th>
                  <th className="px-4 py-3 text-right">Botol</th>
                  <th className="px-4 py-3 text-right">Omset</th>
                  <th className="px-4 py-3 text-center">CR</th>
                  <th className="px-4 py-3 text-center">Target CR</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {csSummary.map((c, i) => {
                  const dash = dashboardMap[c.cs];
                  const targetCR = dash?.targetCRCS || 0;
                  const achieved = targetCR > 0 ? (c.cr / targetCR) * 100 : 0;
                  return (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{c.cs}</td>
                      <td className="px-4 py-3 text-right">{fmtNum(c.wa)}</td>
                      <td className="px-4 py-3 text-right font-medium">{fmtNum(c.closing)}</td>
                      <td className="px-4 py-3 text-right">{fmtNum(c.botol)}</td>
                      <td className="px-4 py-3 text-right">{fmtRp(c.omset)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          c.cr >= 50 ? 'bg-green-100 text-green-800' :
                          c.cr >= 30 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {pct(c.cr)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500">{targetCR > 0 ? pct(targetCR) : '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          achieved >= 100 ? 'bg-green-100 text-green-800' :
                          achieved >= 70 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {achieved >= 100 ? '✅' : achieved >= 70 ? '⚠️' : '🔴'} {achieved.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {csSummary.length === 0 && dashboardCS.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="text-sm font-semibold text-gray-700 mb-3">Ringkasan dari DASHBOARD CS</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                  <th className="px-3 py-2 text-left">CS</th>
                  <th className="px-3 py-2 text-left">Produk</th>
                  <th className="px-3 py-2 text-right">Closing</th>
                  <th className="px-3 py-2 text-right">Target CR</th>
                  <th className="px-3 py-2 text-right">CR Aktual</th>
                  <th className="px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dashboardCS.map((d, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-800">{d.cs}</td>
                    <td className="px-3 py-2 text-gray-600">{d.produk}</td>
                    <td className="px-3 py-2 text-right">{fmtNum(d.closing)}</td>
                    <td className="px-3 py-2 text-right">{d.targetCRCS > 0 ? pct(d.targetCRCS) : '—'}</td>
                    <td className="px-3 py-2 text-right">{d.crCS > 0 ? pct(d.crCS) : '—'}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        d.crCS >= d.targetCRCS ? 'bg-green-100 text-green-800' :
                        d.crCS >= d.targetCRCS * 0.7 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {d.crCS >= d.targetCRCS ? '✅ Tercapai' : d.crCS >= d.targetCRCS * 0.7 ? '⚠️ Mendekati' : '🔴 Jauh'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tahap 5: Kesimpulan & Rekomendasi ────────────────────────────────────────

function Recommendations({ kpi, byProduct, csSummary, byADV }: {
  kpi: KPISummary;
  byProduct: { name: string; budget: number; lead: number; closing: number; omset: number; roas: number; cr: number; evaluasi: string }[];
  csSummary: { cs: string; wa: number; closing: number; botol: number; omset: number; cr: number }[];
  byADV: { adv: string; spend: number; omset: number; avgCAQ: number; status: string; roas: number }[];
}) {
  const topProduct = byProduct[0];
  const bottomProduct = byProduct[byProduct.length - 1];
  const topCS = csSummary[0];
  const bottomCS = csSummary[csSummary.length - 1];
  const topADV = byADV[0];
  const bottomADV = byADV[byADV.length - 1];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800">🎯 Kesimpulan & Rekomendasi</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Quick Wins */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-green-800 mb-2">✅ Quick Wins</div>
          <ul className="space-y-1.5 text-sm text-green-900">
            {topProduct && <li>• Produk <strong>{topProduct.name}</strong> performa terbaik — pertahankan/push lebih</li>}
            {topCS && <li>• CS <strong>{topCS.cs}</strong> closing tertinggi — contoh untuk tim</li>}
            {topADV && <li>• ADV <strong>{topADV.adv}</strong> ROAS {topADV.roas.toFixed(2)}x — alokasikan budget lebih</li>}
            {kpi.roas >= 2 && <li>• ROAS keseluruhan {kpi.roas.toFixed(2)}x — di atas break-even</li>}
          </ul>
        </div>

        {/* Problem Areas */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-red-800 mb-2">🔴 Perlu Perhatian</div>
          <ul className="space-y-1.5 text-sm text-red-900">
            {bottomProduct && bottomProduct.roas < 1 && <li>• Produk <strong>{bottomProduct.name}</strong> ROAS di bawah 1x — evaluasi iklan</li>}
            {bottomCS && bottomCS.cr < 20 && <li>• CS <strong>{bottomCS.cs}</strong> CR hanya {bottomCS.cr.toFixed(1)}% — butuh coaching</li>}
            {bottomADV && bottomADV.roas < 1 && <li>• ADV <strong>{bottomADV.adv}</strong> tidak profitable — pertimbangkan stop/hold</li>}
            {kpi.avgCAQ > 500000 && <li>• CAQ rata-rata tinggi ({fmtRp(kpi.avgCAQ)}) — perlu efisiensi</li>}
          </ul>
        </div>
      </div>

      {/* Action items */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        <div className="text-sm font-semibold text-gray-700 mb-3">📋 Arahan Strategis Hari Ini / Minggu Ini</div>
        <div className="space-y-2">
          {bottomProduct && bottomProduct.roas < 1 && (
            <div className="flex gap-3 border-l-4 border-l-red-500 bg-red-50 rounded-r-lg px-4 py-2 text-sm">
              <span className="font-bold text-red-700 w-6 shrink-0">1</span>
              <div>
                <span className="font-medium text-gray-800">Review iklan produk {bottomProduct.name}</span>
                <p className="text-gray-500 text-xs mt-0.5">ROAS {bottomProduct.roas.toFixed(2)}x tidak menguntungkan. Cek targeting dan creative.</p>
              </div>
            </div>
          )}
          {bottomCS && bottomCS.cr < 20 && (
            <div className="flex gap-3 border-l-4 border-l-orange-400 bg-orange-50 rounded-r-lg px-4 py-2 text-sm">
              <span className="font-bold text-orange-700 w-6 shrink-0">2</span>
              <div>
                <span className="font-medium text-gray-800">Coaching 1-on-1 dengan {bottomCS.cs}</span>
                <p className="text-gray-500 text-xs mt-0.5">CR {bottomCS.cr.toFixed(1)}% jauh di bawah rata-rata. Analisis chat history dan berikan script baru.</p>
              </div>
            </div>
          )}
          {kpi.roas < 2 && (
            <div className="flex gap-3 border-l-4 border-l-yellow-400 bg-yellow-50 rounded-r-lg px-4 py-2 text-sm">
              <span className="font-bold text-yellow-700 w-6 shrink-0">3</span>
              <div>
                <span className="font-medium text-gray-800">Optimasi budget allocation</span>
                <p className="text-gray-500 text-xs mt-0.5">ROAS keseluruhan {kpi.roas.toFixed(2)}x. Alihkan budget dari underperform ke produk/adv dengan ROAS tinggi.</p>
              </div>
            </div>
          )}
          {topProduct && (
            <div className="flex gap-3 border-l-4 border-l-green-500 bg-green-50 rounded-r-lg px-4 py-2 text-sm">
              <span className="font-bold text-green-700 w-6 shrink-0">4</span>
              <div>
                <span className="font-medium text-gray-800">Scale up produk {topProduct.name}</span>
                <p className="text-gray-500 text-xs mt-0.5">ROAS {topProduct.roas.toFixed(2)}x — naikkan budget iklan 20-30% dan berikan ke ADV terbaik.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ReportFlow ───────────────────────────────────────────────────────────

export default function ReportFlow({ kpi, ads, advSpend, csDaily, dashboardCS, growth, kpiBenchmarks, bulan }: ReportFlowProps) {
  const byProduct = useMemo(() => {
    const map: Record<string, { budget: number; lead: number; closing: number; omset: number; evalCounts: Record<string, number> }> = {};
    for (const row of ads) {
      for (const p of row.products) {
        if (!p.name) continue;
        if (!map[p.name]) map[p.name] = { budget: 0, lead: 0, closing: 0, omset: 0, evalCounts: {} };
        map[p.name].budget += p.budgetIklan;
        map[p.name].lead += p.jumlahLead;
        map[p.name].closing += p.closing;
        map[p.name].omset += p.omset;
        if (p.evaluasi) {
          map[p.name].evalCounts[p.evaluasi] = (map[p.name].evalCounts[p.evaluasi] || 0) + 1;
        }
      }
    }
    return Object.entries(map).map(([name, d]) => {
      const dominantEval = Object.entries(d.evalCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
      return {
        name,
        budget: d.budget,
        lead: d.lead,
        closing: d.closing,
        omset: d.omset,
        roas: d.budget > 0 ? d.omset / d.budget : 0,
        cr: d.lead > 0 ? (d.closing / d.lead) * 100 : 0,
        evaluasi: dominantEval,
      };
    }).sort((a, b) => b.omset - a.omset);
  }, [ads]);

  const csSummary = useMemo(() => {
    const map: Record<string, { wa: number; closing: number; botol: number; omset: number }> = {};
    for (const r of csDaily) {
      if (!map[r.cs]) map[r.cs] = { wa: 0, closing: 0, botol: 0, omset: 0 };
      map[r.cs].wa += r.whatsapp;
      map[r.cs].closing += r.closing;
      map[r.cs].botol += r.botol;
      map[r.cs].omset += r.omset;
    }
    return Object.entries(map).map(([cs, d]) => ({
      cs,
      wa: d.wa,
      closing: d.closing,
      botol: d.botol,
      omset: d.omset,
      cr: d.wa > 0 ? (d.closing / d.wa) * 100 : 0,
    })).sort((a, b) => b.closing - a.closing);
  }, [csDaily]);

  const byADV = useMemo(() => {
    const map: Record<string, { spend: number; omset: number; avgCAQ: number; count: number; status: string }> = {};
    for (const r of advSpend) {
      const key = r.adv;
      if (!map[key]) map[key] = { spend: 0, omset: 0, avgCAQ: 0, count: 0, status: r.status };
      map[key].spend += r.budgetAktual;
      map[key].omset += r.omset;
      map[key].avgCAQ += r.persentaseCAQ;
      map[key].count += 1;
    }
    return Object.entries(map).map(([adv, d]) => ({
      adv,
      spend: d.spend,
      omset: d.omset,
      avgCAQ: d.count ? d.avgCAQ / d.count : 0,
      status: d.status,
      roas: d.spend > 0 ? d.omset / d.spend : 0,
    })).sort((a, b) => b.omset - a.omset);
  }, [advSpend]);

  return (
    <div className="space-y-8">
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
        <h2 className="text-lg font-bold text-blue-900">📋 Laporan Komprehensif — {bulan}</h2>
        <p className="text-sm text-blue-700 mt-1">
          Alur &quot;Investment to Revenue&quot; — dari executive summary sampai rekomendasi operasional.
        </p>
      </div>

      <section>
        <ExecutiveSummary kpi={kpi} growth={growth} bulan={bulan} />
      </section>

      <hr className="border-gray-200" />

      <section>
        <MarketingEfficiency advSpend={advSpend} kpiBenchmarks={kpiBenchmarks} />
      </section>

      <hr className="border-gray-200" />

      <section>
        <ProductPortfolio ads={ads} />
      </section>

      <hr className="border-gray-200" />

      <section>
        <CSProductivity csDaily={csDaily} dashboardCS={dashboardCS} />
      </section>

      <hr className="border-gray-200" />

      <section>
        <Recommendations kpi={kpi} byProduct={byProduct} csSummary={csSummary} byADV={byADV} />
      </section>
    </div>
  );
}
