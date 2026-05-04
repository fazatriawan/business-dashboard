'use client';

import { useState, useMemo } from 'react';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  Megaphone,
  Package,
  Monitor,
  RotateCcw,
} from 'lucide-react';
import { CSRow } from '../lib/types';

interface CSTableProps {
  rows: CSRow[];
  bulan: string;
}

const PAGE_SIZE = 20;

function crBadge(cr: number) {
  if (cr >= 50) return <span className="px-2.5 py-1 text-xs rounded-lg bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">{cr.toFixed(1)}%</span>;
  if (cr >= 30) return <span className="px-2.5 py-1 text-xs rounded-lg bg-amber-50 text-amber-700 font-semibold border border-amber-200">{cr.toFixed(1)}%</span>;
  if (cr > 0)   return <span className="px-2.5 py-1 text-xs rounded-lg bg-red-50 text-red-700 font-semibold border border-red-200">{cr.toFixed(1)}%</span>;
  return <span className="text-slate-400 text-xs">—</span>;
}

export default function CSTable({ rows, bulan }: CSTableProps) {
  const [page, setPage] = useState(0);
  const [filterCS, setFilterCS] = useState('');
  const [filterADV, setFilterADV] = useState('');
  const [filterProduk, setFilterProduk] = useState('');

  const advOptions = useMemo(() => Array.from(new Set(rows.map(r => r.adv).filter(Boolean))).sort(), [rows]);
  const produkOptions = useMemo(() => Array.from(new Set(rows.map(r => r.produk).filter(Boolean))).sort(), [rows]);

  const filtered = useMemo(() => rows.filter(r => {
    if (filterCS     && !r.cs.toLowerCase().includes(filterCS.toLowerCase()))         return false;
    if (filterADV    && r.adv !== filterADV)     return false;
    if (filterProduk && r.produk !== filterProduk) return false;
    return true;
  }), [rows, filterCS, filterADV, filterProduk]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRows   = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Summary stats
  const totalLead    = filtered.reduce((s, r) => s + (r.totalLead || r.realtimeLead), 0);
  const totalClosing = filtered.reduce((s, r) => s + (r.totalClosing || r.closing), 0);
  const totalBotol   = filtered.reduce((s, r) => s + (r.totalBotol  || r.botol), 0);

  const resetPage = () => setPage(0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" />
          Performa CS — <span className="text-indigo-600">{bulan}</span>
        </h2>
        <div className="flex gap-2 flex-wrap text-sm">
          <span className="bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl font-medium border border-slate-200 flex items-center gap-1.5">
            <UserCircle className="w-3.5 h-3.5 text-slate-400" />
            Lead: <strong>{totalLead}</strong>
          </span>
          <span className="bg-emerald-50 text-emerald-700 px-3.5 py-2 rounded-xl font-medium border border-emerald-200 flex items-center gap-1.5">
            <CheckIcon className="w-3.5 h-3.5" />
            Closing: <strong>{totalClosing}</strong>
          </span>
          <span className="bg-blue-50 text-blue-700 px-3.5 py-2 rounded-xl font-medium border border-blue-200 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-blue-400" />
            Botol: <strong>{totalBotol}</strong>
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Cari nama CS..."
            value={filterCS}
            onChange={e => { setFilterCS(e.target.value); resetPage(); }}
            className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all w-48"
          />
        </div>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Megaphone className="w-4 h-4" />
          </div>
          <select
            value={filterADV}
            onChange={e => { setFilterADV(e.target.value); resetPage(); }}
            className="pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all appearance-none"
          >
            <option value="">Semua ADV</option>
            {advOptions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Package className="w-4 h-4" />
          </div>
          <select
            value={filterProduk}
            onChange={e => { setFilterProduk(e.target.value); resetPage(); }}
            className="pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all appearance-none"
          >
            <option value="">Semua Produk</option>
            {produkOptions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        {(filterCS || filterADV || filterProduk) && (
          <button
            onClick={() => { setFilterCS(''); setFilterADV(''); setFilterProduk(''); resetPage(); }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900 text-slate-300 text-xs uppercase tracking-wider">
                <th className="px-4 py-3.5 text-left font-semibold">CS</th>
                <th className="px-4 py-3.5 text-left font-semibold">ADV</th>
                <th className="px-4 py-3.5 text-left font-semibold">Produk</th>
                <th className="px-4 py-3.5 text-left font-semibold">Platform</th>
                <th className="px-4 py-3.5 text-right font-semibold">Lead</th>
                <th className="px-4 py-3.5 text-right font-semibold">Closing</th>
                <th className="px-4 py-3.5 text-right font-semibold">Botol</th>
                <th className="px-4 py-3.5 text-center font-semibold">CR</th>
                <th className="px-4 py-3.5 text-right font-semibold">Retur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-slate-800">{r.cs || '—'}</td>
                  <td className="px-4 py-3.5 text-slate-600">{r.adv || '—'}</td>
                  <td className="px-4 py-3.5 text-slate-600">{r.produk || '—'}</td>
                  <td className="px-4 py-3.5">
                    {r.platform ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-blue-50 text-blue-700 font-medium border border-blue-100">
                        <Monitor className="w-3 h-3" />
                        {r.platform}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-right text-slate-700">{(r.totalLead || r.realtimeLead) || '—'}</td>
                  <td className="px-4 py-3.5 text-right text-slate-700 font-medium">{(r.totalClosing || r.closing) || '—'}</td>
                  <td className="px-4 py-3.5 text-right text-slate-700">{(r.totalBotol  || r.botol) || '—'}</td>
                  <td className="px-4 py-3.5 text-center">{crBadge(r.avgCR || r.cr)}</td>
                  <td className="px-4 py-3.5 text-right text-slate-500">{r.jumlahRetur || '—'}</td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    Tidak ada data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 text-sm">
            <span className="text-slate-500 font-medium">Halaman {page + 1} dari {totalPages} ({filtered.length} baris)</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="inline-flex items-center gap-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.97]">
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="inline-flex items-center gap-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.97]">
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
