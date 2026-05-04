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
import { TrendingUp } from 'lucide-react';
import { AdsRow } from '../lib/types';

Chart.register(LineElement, PointElement, LineController, CategoryScale, LinearScale, Title, Tooltip, Legend, Filler);

interface TrendChartProps {
  ads: AdsRow[];
}

function shortDate(d: string) {
  const parts = d.split(/[\/\-\s]/);
  if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
  return d.slice(-5);
}

export default function TrendChart({ ads }: TrendChartProps) {
  const budgetRef = useRef<HTMLCanvasElement>(null);
  const omsetRef = useRef<HTMLCanvasElement>(null);
  const leadClosingRef = useRef<HTMLCanvasElement>(null);
  const charts = useRef<Chart[]>([]);

  useEffect(() => {
    charts.current.forEach(c => c.destroy());
    charts.current = [];

    const labels = ads.map(r => shortDate(r.date));
    const budget = ads.map(r => r.total.totalBudget);
    const omset = ads.map(r => r.total.omset);
    const lead = ads.map(r => r.total.totalLead);
    const closing = ads.map(r => r.total.totalClosing);

    const baseOpts = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' as const, labels: { usePointStyle: true, boxWidth: 8 } }, tooltip: { mode: 'index' as const, intersect: false, backgroundColor: 'rgba(15,23,42,0.9)', padding: 12, cornerRadius: 8 } },
      scales: { x: { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 10 } } }, y: { grid: { color: 'rgba(148,163,184,0.1)' } } },
    };

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
            y: {
              ...baseOpts.scales.y,
              ticks: {
                callback: (v: number | string) => {
                  const n = Number(v);
                  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}jt`;
                  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`;
                  return String(n);
                },
              },
            },
          },
        },
      }));
    }

    if (omsetRef.current) {
      const roas = ads.map(r => r.total.totalBudget > 0 ? r.total.omset / r.total.totalBudget : 0);
      charts.current.push(new Chart(omsetRef.current, {
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

    if (leadClosingRef.current) {
      charts.current.push(new Chart(leadClosingRef.current, {
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

    return () => { charts.current.forEach(c => c.destroy()); };
  }, [ads]);

  return (
    <div>
      <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-indigo-500" />
        Tren Harian
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm" style={{ height: 300 }}>
          <canvas ref={budgetRef} />
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm" style={{ height: 300 }}>
          <canvas ref={omsetRef} />
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm lg:col-span-2" style={{ height: 300 }}>
          <canvas ref={leadClosingRef} />
        </div>
      </div>
    </div>
  );
}
