'use client';

import { useState } from 'react';
import { Table2, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { AdsRow } from '../lib/types';

interface DataTableProps {
  ads: AdsRow[];
}

function fmtRp(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n.toFixed(0)}`;
}

function evalBadge(ev: string) {
  const e = ev.toUpperCase();
  if (e === 'SCALE') return <span className="px-2.5 py-1 text-xs rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800/40">SCALE</span>;
  if (e === 'HOLD') return <span className="px-2.5 py-1 text-xs rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-semibold border border-amber-200 dark:border-amber-800/40">HOLD</span>;
  if (e === 'OFF') return <span className="px-2.5 py-1 text-xs rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 font-semibold border border-red-200 dark:border-red-800/40">OFF</span>;
  if (e) return <span className="px-2.5 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">{ev}</span>;
  return null;
}

const PAGE_SIZE = 15;

export default function DataTable({ ads }: DataTableProps) {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(ads.length / PAGE_SIZE);
  const rows = ads.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
        <Table2 className="w-5 h-5 text-indigo-500" />
        Data Harian Ads
      </h2>
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900 text-slate-300 text-xs uppercase tracking-wider">
                <th className="px-3 sm:px-4 py-2.5 sm:py-3.5 text-left font-semibold">Tanggal</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3.5 text-right font-semibold">Budget</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3.5 text-right font-semibold">Lead</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3.5 text-right font-semibold">Close</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3.5 text-right font-semibold">Botol</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3.5 text-right font-semibold">CR</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3.5 text-right font-semibold">Omset</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3.5 text-right font-semibold">ROAS</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3.5 text-center font-semibold">Eval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r, i) => {
                const roas = r.total.totalBudget > 0 ? r.total.omset / r.total.totalBudget : 0;
                return (
                  <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3.5 font-semibold text-slate-800 dark:text-slate-100">{r.date}</td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3.5 text-right text-slate-600 dark:text-slate-300">{fmtRp(r.total.totalBudget)}</td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3.5 text-right text-slate-700 dark:text-slate-300">{r.total.totalLead}</td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3.5 text-right text-slate-700 dark:text-slate-300 font-medium">{r.total.totalClosing}</td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3.5 text-right text-slate-700 dark:text-slate-300">{r.total.totalBotol}</td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3.5 text-right text-slate-700 dark:text-slate-300">{r.total.cr.toFixed(1)}%</td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">{fmtRp(r.total.omset)}</td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3.5 text-right text-slate-700 dark:text-slate-300">{roas.toFixed(2)}x</td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3.5 text-center">{evalBadge(r.total.evaluasiIklan)}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-400 dark:text-slate-500">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    Tidak ada data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 text-sm">
            <span className="text-slate-500 font-medium">Halaman {page + 1} dari {totalPages} ({ads.length} baris)</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="inline-flex items-center gap-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.97]"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="inline-flex items-center gap-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.97]"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
