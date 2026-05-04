'use client';

import {
  Wallet,
  Megaphone,
  TrendingUp,
  Users,
  CheckCircle2,
  Target,
  Banknote,
  Tag,
} from 'lucide-react';
import { KPISummary } from '../lib/types';

interface KPICardsProps {
  kpi: KPISummary;
  bulan: string;
}

function fmtRp(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000)         return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n.toFixed(0)}`;
}

function fmtNum(n: number) {
  return n.toLocaleString('id-ID');
}

function evalColor(ev: string) {
  const e = ev.toUpperCase();
  if (e === 'SCALE')     return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', glow: 'shadow-emerald-500/20' };
  if (e === 'HOLD')      return { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500', glow: 'shadow-amber-500/20' };
  if (e === 'OFF')       return { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500', glow: 'shadow-red-500/20' };
  if (e === 'DOWNSCALE') return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500', glow: 'shadow-orange-500/20' };
  return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400', glow: 'shadow-slate-500/20' };
}

const cards = [
  { key: 'totalOmset'        as keyof KPISummary, label: 'Total Omset',           format: 'rp',   icon: Wallet,       gradient: 'from-emerald-400 via-teal-500 to-cyan-500',  bg: 'bg-emerald-50/80',  accent: 'text-emerald-600' },
  { key: 'totalBudget'       as keyof KPISummary, label: 'Total Budget Iklan',    format: 'rp',   icon: Megaphone,    gradient: 'from-blue-400 via-indigo-500 to-violet-500', bg: 'bg-blue-50/80',     accent: 'text-blue-600' },
  { key: 'roas'              as keyof KPISummary, label: 'ROAS',                  format: 'roas', icon: TrendingUp,   gradient: 'from-violet-400 via-purple-500 to-fuchsia-500', bg: 'bg-violet-50/80', accent: 'text-violet-600' },
  { key: 'totalLead'         as keyof KPISummary, label: 'Total Lead',            format: 'num',  icon: Users,        gradient: 'from-orange-400 via-amber-500 to-yellow-500', bg: 'bg-orange-50/80',  accent: 'text-orange-600' },
  { key: 'totalClosing'      as keyof KPISummary, label: 'Total Closing',         format: 'num',  icon: CheckCircle2, gradient: 'from-teal-400 via-cyan-500 to-sky-500',    bg: 'bg-teal-50/80',     accent: 'text-teal-600' },
  { key: 'avgCR'             as keyof KPISummary, label: 'Avg Closing Rate',      format: 'pct',  icon: Target,       gradient: 'from-cyan-400 via-sky-500 to-blue-500',    bg: 'bg-cyan-50/80',     accent: 'text-cyan-600' },
  { key: 'avgCAQ'            as keyof KPISummary, label: 'Avg Biaya Akuisisi',    format: 'rp',   icon: Banknote,     gradient: 'from-rose-400 via-pink-500 to-red-500',    bg: 'bg-rose-50/80',     accent: 'text-rose-600' },
  { key: 'evaluasiDominant'  as keyof KPISummary, label: 'Evaluasi Dominan',      format: 'eval', icon: Tag,          gradient: 'from-indigo-400 via-blue-500 to-cyan-500', bg: 'bg-indigo-50/80',   accent: 'text-indigo-600' },
];

export default function KPICards({ kpi, bulan }: KPICardsProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-sm">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">KPI Ringkasan</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{bulan}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger-children">
        {cards.map(c => {
          const val = kpi[c.key];
          let display = '';
          if      (c.format === 'rp')   display = fmtRp(val as number);
          else if (c.format === 'roas') display = `${(val as number).toFixed(2)}x`;
          else if (c.format === 'pct')  display = `${(val as number).toFixed(1)}%`;
          else if (c.format === 'num')  display = fmtNum(val as number);
          else display = String(val);

          const Icon = c.icon;

          return (
            <div
              key={c.key}
              className="relative bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/40 rounded-2xl p-5 card-hover overflow-hidden group"
            >
              {/* Decorative gradient blob */}
              <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${c.gradient} opacity-[0.07] group-hover:opacity-[0.12] group-hover:scale-110 transition-all duration-500`} />

              <div className="relative">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-lg mb-4 group-hover:scale-105 transition-transform duration-300`}>
                  <Icon className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">{c.label}</div>
                {c.format === 'eval' ? (
                  <div className="inline-flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${evalColor(String(val)).dot}`} />
                    <span className={`text-sm font-bold px-3 py-1.5 rounded-xl border ${evalColor(String(val)).bg} ${evalColor(String(val)).text} ${evalColor(String(val)).border}`}>
                      {String(val)}
                    </span>
                  </div>
                ) : (
                  <div className="text-2xl font-extrabold text-slate-900 tracking-tight animate-count-up">
                    {display}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
