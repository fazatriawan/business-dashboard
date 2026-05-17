'use client';

import { useEffect, useRef } from 'react';
import {
  Chart,
  LineElement,
  PointElement,
  LineController,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { TrendingUp, Users } from 'lucide-react';
import { AdsRow, CSDailyRow } from '../lib/types';

Chart.register(LineElement, PointElement, LineController, CategoryScale, LinearScale, Title, Tooltip, Legend, Filler);

interface TrendChartProps {
  ads: AdsRow[];
  csDaily?: CSDailyRow[];
}

function shortDate(d: string) {
  const parts = d.split(/[\/\-\s]/);
  if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
  return d.slice(-5);
}

function rupiahShort(v: number | string) {
  const n = Number(v);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`;
  return String(n);
}

export default function TrendChart({ ads, csDaily = [] }: TrendChartProps) {
  const budgetRef     = useRef<HTMLCanvasElement>(null);
  const roasRef       = useRef<HTMLCanvasElement>(null);
  const leadRef       = useRef<HTMLCanvasElement>(null);
  const csRef         = useRef<HTMLCanvasElement>(null);
  const charts        = useRef<Chart[]>([]);

  useEffect(() => {
    charts.current.forEach(c => c.destroy());
    charts.current = [];

    const labels  = ads.map(r => shortDate(r.date));
    const budget  = ads.map(r => r.total.totalBudget);
    const omset   = ads.map(r => r.total.omset);
    const roas    = ads.map(r => r.total.totalBudget > 0 ? +(r.total.omset / r.total.totalBudget).toFixed(2) : null);
    const lead    = ads.map(r => r.total.totalLead);
    const closing = ads.map(r => r.total.totalClosing);

    const baseOpts = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' as const, labels: { usePointStyle: true, boxWidth: 8 } },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
          backgroundColor: 'rgba(15,23,42,0.9)',
          padding: 12,
          cornerRadius: 8,
          filter: (item: { formattedValue: string }) => item.formattedValue !== 'null',
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 10 } } },
        y: { grid: { color: 'rgba(148,163,184,0.1)' } },
      },
    };

    // ── Chart 1: Budget vs Omset ──────────────────────────────────────────────
    if (budgetRef.current) {
      charts.current.push(new Chart(budgetRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Budget Iklan (Rp)',
              data: budget,
              borderColor: '#6366f1',
              backgroundColor: 'rgba(99,102,241,0.08)',
              fill: true,
              tension: 0.4,
              pointRadius: 3,
              pointHoverRadius: 5,
            },
            {
              label: 'Omset (Rp)',
              data: omset,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16,185,129,0.08)',
              fill: true,
              tension: 0.4,
              pointRadius: 3,
              pointHoverRadius: 5,
            },
          ],
        },
        options: {
          ...baseOpts,
          plugins: {
            ...baseOpts.plugins,
            title: { display: true, text: 'Budget vs Omset Harian', font: { size: 13, weight: 'bold' }, color: '#334155', padding: { bottom: 16 } },
          },
          scales: {
            ...baseOpts.scales,
            y: { ...baseOpts.scales.y, ticks: { callback: (v: number | string) => rupiahShort(v) } },
          },
        },
      }));
    }

    // ── Chart 2: ROAS ─────────────────────────────────────────────────────────
    if (roasRef.current) {
      charts.current.push(new Chart(roasRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'ROAS',
              data: roas,
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139,92,246,0.08)',
              fill: true,
              tension: 0.4,
              pointRadius: 3,
              pointHoverRadius: 5,
              spanGaps: false,
            },
          ],
        },
        options: {
          ...baseOpts,
          plugins: {
            ...baseOpts.plugins,
            title: { display: true, text: 'ROAS Harian', font: { size: 13, weight: 'bold' }, color: '#334155', padding: { bottom: 16 } },
          },
          scales: {
            ...baseOpts.scales,
            y: { ...baseOpts.scales.y, ticks: { callback: (v: number | string) => `${Number(v).toFixed(1)}x` } },
          },
        },
      }));
    }

    // ── Chart 3: Lead & Closing (Ads) ─────────────────────────────────────────
    if (leadRef.current) {
      charts.current.push(new Chart(leadRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Lead',
              data: lead,
              borderColor: '#f59e0b',
              backgroundColor: 'rgba(245,158,11,0.04)',
              fill: false,
              tension: 0.4,
              pointRadius: 3,
              pointHoverRadius: 5,
            },
            {
              label: 'Closing',
              data: closing,
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239,68,68,0.04)',
              fill: false,
              tension: 0.4,
              pointRadius: 3,
              pointHoverRadius: 5,
            },
          ],
        },
        options: {
          ...baseOpts,
          plugins: {
            ...baseOpts.plugins,
            title: { display: true, text: 'Lead & Closing Harian', font: { size: 13, weight: 'bold' }, color: '#334155', padding: { bottom: 16 } },
          },
        },
      }));
    }

    // ── Chart 4: CS Lead & Closing (csDaily) ─────────────────────────────────
    if (csRef.current && csDaily.length > 0) {
      const csMap = new Map<string, { lead: number; closing: number }>();
      for (const row of csDaily) {
        const prev = csMap.get(row.date) ?? { lead: 0, closing: 0 };
        csMap.set(row.date, {
          lead: prev.lead + row.whatsapp,
          closing: prev.closing + row.closing,
        });
      }

      // Align with ads dates so x-axis matches other charts; null = gap
      const csDates  = ads.length > 0 ? ads.map(r => r.date) : Array.from(csMap.keys()).sort();
      const csLabels = csDates.map(d => shortDate(d));
      const csLeads  = csDates.map(d => csMap.has(d) ? (csMap.get(d)!.lead   || null) : null);
      const csClose  = csDates.map(d => csMap.has(d) ? (csMap.get(d)!.closing || null) : null);

      charts.current.push(new Chart(csRef.current, {
        type: 'line',
        data: {
          labels: csLabels,
          datasets: [
            {
              label: 'Lead CS',
              data: csLeads,
              borderColor: '#22d3ee',
              backgroundColor: 'rgba(34,211,238,0.06)',
              fill: false,
              tension: 0.4,
              pointRadius: 3,
              pointHoverRadius: 5,
              spanGaps: false,
            },
            {
              label: 'Closing CS',
              data: csClose,
              borderColor: '#a78bfa',
              backgroundColor: 'rgba(167,139,250,0.06)',
              fill: false,
              tension: 0.4,
              pointRadius: 3,
              pointHoverRadius: 5,
              spanGaps: false,
            },
          ],
        },
        options: {
          ...baseOpts,
          plugins: {
            ...baseOpts.plugins,
            title: { display: true, text: 'CS Lead & Closing Harian', font: { size: 13, weight: 'bold' }, color: '#334155', padding: { bottom: 16 } },
          },
        },
      }));
    }

    return () => { charts.current.forEach(c => c.destroy()); };
  }, [ads, csDaily]);

  const hasCS = csDaily.length > 0;

  return (
    <div>
      <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-indigo-500" />
        Tren Harian
        {hasCS && (
          <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium bg-cyan-50 text-cyan-700 border border-cyan-200/60 px-2 py-0.5 rounded-full">
            <Users className="w-3 h-3" />
            CS
          </span>
        )}
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm" style={{ height: 300 }}>
          <canvas ref={budgetRef} />
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm" style={{ height: 300 }}>
          <canvas ref={roasRef} />
        </div>
        <div
          className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm ${!hasCS ? 'lg:col-span-2' : ''}`}
          style={{ height: 300 }}
        >
          <canvas ref={leadRef} />
        </div>
        {hasCS && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm" style={{ height: 300 }}>
            <canvas ref={csRef} />
          </div>
        )}
      </div>
    </div>
  );
}
