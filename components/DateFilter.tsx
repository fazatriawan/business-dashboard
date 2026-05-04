'use client';

import { useState, useMemo } from 'react';
import { ChevronRight, Filter, X } from 'lucide-react';

export type DateRange = { start: string; end: string } | null;

type PresetKey = 'all' | 'week1' | 'week2' | 'week3' | 'week4' | 'last7' | 'today' | 'custom';

interface DateFilterProps {
  dates: string[];
  onChange: (range: DateRange) => void;
}

function parseDateIndo(d: string): Date | null {
  const m1 = d.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (m1) return new Date(`${m1[3]}-${m1[2]}-${m1[1]}`);
  const m2 = d.match(/(\d{1,2}),?\s+(\w+),?\s+(\d{4})/);
  if (m2) {
    const monthNames = ['januari','februari','maret','april','mei','juni','juli','agustus','september','oktober','november','desember'];
    const month = monthNames.findIndex(m => m2[2].toLowerCase().startsWith(m));
    if (month >= 0) return new Date(`${m2[3]}-${String(month + 1).padStart(2, '0')}-${String(m2[1]).padStart(2, '0')}`);
  }
  const iso = Date.parse(d);
  if (!isNaN(iso)) return new Date(iso);
  return null;
}

function fmtIso(d: Date): string {
  return d.toISOString().split('T')[0];
}

const PRESETS: { key: PresetKey; label: string; icon?: string }[] = [
  { key: 'all',    label: 'Semua',   icon: '📅' },
  { key: 'today',  label: 'Hari Ini', icon: '📌' },
  { key: 'last7',  label: '7 Hari',  icon: '📆' },
  { key: 'week1',  label: 'Pekan 1', icon: '①' },
  { key: 'week2',  label: 'Pekan 2', icon: '②' },
  { key: 'week3',  label: 'Pekan 3', icon: '③' },
  { key: 'week4',  label: 'Pekan 4', icon: '④' },
  { key: 'custom', label: 'Custom',  icon: '⚙️' },
];

export default function DateFilter({ dates, onChange }: DateFilterProps) {
  const [active, setActive] = useState<PresetKey>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const parsedDates = useMemo(() => {
    return dates.map(d => parseDateIndo(d)).filter((d): d is Date => d !== null).sort((a, b) => a.getTime() - b.getTime());
  }, [dates]);

  const minDate = useMemo(() => parsedDates[0] ? fmtIso(parsedDates[0]) : '', [parsedDates]);
  const maxDate = useMemo(() => parsedDates[parsedDates.length - 1] ? fmtIso(parsedDates[parsedDates.length - 1]) : '', [parsedDates]);

  const apply = (key: PresetKey) => {
    setActive(key);
    if (parsedDates.length === 0) {
      onChange(null);
      return;
    }

    const first = parsedDates[0];
    const last = parsedDates[parsedDates.length - 1];
    let start = first;
    let end = last;

    switch (key) {
      case 'all':
        start = first; end = last;
        break;
      case 'today':
        start = last; end = last;
        break;
      case 'last7': {
        const idx = Math.max(0, parsedDates.length - 7);
        start = parsedDates[idx];
        end = last;
        break;
      }
      case 'week1':
        start = first;
        end = new Date(first.getTime() + 6 * 24 * 60 * 60 * 1000);
        break;
      case 'week2': {
        const w2 = new Date(first.getTime() + 7 * 24 * 60 * 60 * 1000);
        start = w2;
        end = new Date(w2.getTime() + 6 * 24 * 60 * 60 * 1000);
        break;
      }
      case 'week3': {
        const w3 = new Date(first.getTime() + 14 * 24 * 60 * 60 * 1000);
        start = w3;
        end = new Date(w3.getTime() + 6 * 24 * 60 * 60 * 1000);
        break;
      }
      case 'week4': {
        const w4 = new Date(first.getTime() + 21 * 24 * 60 * 60 * 1000);
        start = w4;
        end = new Date(Math.min(w4.getTime() + 6 * 24 * 60 * 60 * 1000, last.getTime()));
        break;
      }
      case 'custom':
        if (customStart && customEnd) {
          start = new Date(customStart);
          end = new Date(customEnd);
        }
        break;
    }

    if (start < first) start = first;
    if (end > last) end = last;

    onChange({ start: fmtIso(start), end: fmtIso(end) });
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl px-5 py-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 mr-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
            <Filter className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Filter</span>
        </div>
        {PRESETS.map(p => (
          <button
            key={p.key}
            onClick={() => apply(p.key)}
            className={`relative px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 active:scale-[0.97] ${
              active === p.key
                ? 'bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60 hover:border-slate-300/60'
            }`}
          >
            <span className="flex items-center gap-1.5">
              {p.icon && <span className="text-[10px]">{p.icon}</span>}
              {p.label}
            </span>
          </button>
        ))}

        {active !== 'all' && (
          <button
            onClick={() => apply('all')}
            className="ml-auto inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          >
            <X className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {active === 'custom' && (
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100/80 animate-fade-in">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Dari</label>
            <input
              type="date"
              value={customStart}
              min={minDate}
              max={maxDate}
              onChange={e => { setCustomStart(e.target.value); if (customEnd) apply('custom'); }}
              className="bg-white border border-slate-200/60 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
            />
          </div>
          <ChevronRight className="text-slate-300 mt-5 w-4 h-4" />
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Sampai</label>
            <input
              type="date"
              value={customEnd}
              min={minDate}
              max={maxDate}
              onChange={e => { setCustomEnd(e.target.value); if (customStart) apply('custom'); }}
              className="bg-white border border-slate-200/60 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
            />
          </div>
        </div>
      )}

      {active !== 'all' && active !== 'custom' && (
        <div className="mt-3 pt-3 border-t border-slate-100/60 flex items-center gap-2 animate-fade-in">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span className="text-xs text-slate-500 font-medium">
            Menampilkan data dari <span className="text-indigo-600 font-bold">
              {active === 'today' ? 'hari ini' :
               active === 'last7' ? '7 hari terakhir' :
               active === 'week1' ? 'pekan 1' :
               active === 'week2' ? 'pekan 2' :
               active === 'week3' ? 'pekan 3' :
               active === 'week4' ? 'pekan 4' : 'semua'}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
