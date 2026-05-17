'use client';

import { ProductSummary } from '../lib/types';
import { BarChart3, TrendingUp, ShoppingCart, Package, Target, DollarSign } from 'lucide-react';

interface Props {
  products: ProductSummary[];
  bulan: string;
}

export default function ProductTable({ products, bulan }: Props) {
  const fmtMoney = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const fmtNum = (n: number) => new Intl.NumberFormat('id-ID').format(n);

  const totalOmset = products.reduce((s, p) => s + p.totalOmset, 0);
  const totalBudget = products.reduce((s, p) => s + p.totalBudget, 0);
  const totalLead = products.reduce((s, p) => s + p.totalLead, 0);
  const totalClosing = products.reduce((s, p) => s + p.totalClosing, 0);
  const totalBotol = products.reduce((s, p) => s + p.totalBotol, 0);
  const overallROAS = totalBudget > 0 ? totalOmset / totalBudget : 0;

  if (products.length === 0) {
    return (
      <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm border border-dashed border-slate-300/60 dark:border-slate-600/40 rounded-3xl p-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-50 via-violet-50 to-cyan-50 dark:from-indigo-950/50 dark:via-violet-950/50 dark:to-cyan-950/50 border border-indigo-100/60 dark:border-indigo-800/30 flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-indigo-400" />
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tidak ada data produk</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Data produk akan muncul setelah data ads dimuat.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Performa Produk
          </h2>
          {bulan && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Periode: {bulan}</p>
          )}
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-700/40 px-3 py-1.5 rounded-xl">
          <Package className="w-3.5 h-3.5" />
          {products.length} Produk
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Omset', value: fmtMoney(totalOmset), icon: <DollarSign className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-300' },
          { label: 'Total Budget', value: fmtMoney(totalBudget), icon: <TrendingUp className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-700/40 text-amber-700 dark:text-amber-300' },
          { label: 'Total Lead', value: fmtNum(totalLead), icon: <Target className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-700/40 text-blue-700 dark:text-blue-300' },
          { label: 'Total Closing', value: fmtNum(totalClosing), icon: <ShoppingCart className="w-4 h-4 text-violet-600" />, bg: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200/60 dark:border-violet-700/40 text-violet-700 dark:text-violet-300' },
          { label: 'Overall ROAS', value: overallROAS.toFixed(2) + 'x', icon: <BarChart3 className="w-4 h-4 text-indigo-600" />, bg: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200/60 dark:border-indigo-700/40 text-indigo-700 dark:text-indigo-300' },
        ].map(card => (
          <div key={card.label} className={`rounded-2xl border px-4 py-3.5 ${card.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              {card.icon}
              <span className="text-xs font-semibold opacity-70">{card.label}</span>
            </div>
            <p className="text-base font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Produk</th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide">Budget</th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide">Lead</th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide">Closing</th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide">Botol</th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide">CR%</th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide">Omset</th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide">ROAS</th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide">Kontribusi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {products.map((p, i) => {
                const roas = p.totalBudget > 0 ? p.totalOmset / p.totalBudget : 0;
                const kontribusi = totalOmset > 0 ? (p.totalOmset / totalOmset) * 100 : 0;
                return (
                  <tr
                    key={p.name}
                    className={`hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors ${i % 2 === 0 ? 'bg-white/40 dark:bg-slate-800/20' : 'bg-slate-50/20 dark:bg-slate-800/40'}`}
                  >
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                        <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {i + 1}
                        </span>
                        {p.name.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-amber-700 dark:text-amber-400">
                      {fmtMoney(p.totalBudget)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-700 dark:text-blue-400">
                      {fmtNum(p.totalLead)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-violet-700 dark:text-violet-400">
                      {fmtNum(p.totalClosing)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">
                      {fmtNum(p.totalBotol)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${p.cr >= 20 ? 'text-emerald-600 dark:text-emerald-400' : p.cr >= 10 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                        {p.cr.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700 dark:text-emerald-400">
                      {fmtMoney(p.totalOmset)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${roas >= 3 ? 'text-emerald-600 dark:text-emerald-400' : roas >= 2 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                        {roas.toFixed(2)}x
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                            style={{ width: `${Math.min(100, kontribusi)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-10 text-right">
                          {kontribusi.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Totals row */}
            <tfoot>
              <tr className="bg-slate-100/80 dark:bg-slate-700/50 border-t-2 border-slate-200 dark:border-slate-600">
                <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wide">TOTAL</td>
                <td className="px-4 py-3 text-right font-bold text-amber-700 dark:text-amber-400">{fmtMoney(totalBudget)}</td>
                <td className="px-4 py-3 text-right font-bold text-blue-700 dark:text-blue-400">{fmtNum(totalLead)}</td>
                <td className="px-4 py-3 text-right font-bold text-violet-700 dark:text-violet-400">{fmtNum(totalClosing)}</td>
                <td className="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-300">{fmtNum(totalBotol)}</td>
                <td className="px-4 py-3 text-right font-bold text-slate-700 dark:text-slate-200">
                  {totalLead > 0 ? ((totalClosing / totalLead) * 100).toFixed(1) : '0.0'}%
                </td>
                <td className="px-4 py-3 text-right font-bold text-emerald-700 dark:text-emerald-400">{fmtMoney(totalOmset)}</td>
                <td className="px-4 py-3 text-right font-bold">
                  <span className={overallROAS >= 3 ? 'text-emerald-600 dark:text-emerald-400' : overallROAS >= 2 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}>
                    {overallROAS.toFixed(2)}x
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-300">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
