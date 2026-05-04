'use client';

import { useState } from 'react';
import {
  KPISummary, AdsRow, ADVSpendRow, CSDailyRow,
  DashboardCSRow, GrowthRow, KPIBenchmark,
} from '../lib/types';

interface ExportPPTProps {
  kpi: KPISummary;
  ads: AdsRow[];
  advSpend: ADVSpendRow[];
  csDaily: CSDailyRow[];
  dashboardCS: DashboardCSRow[];
  growth: GrowthRow[];
  kpiBenchmarks: KPIBenchmark[];
  bulan: string;
}

function fmtRp(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`;
  if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)} jt`;
  if (n >= 1_000)         return `Rp ${(n / 1_000).toFixed(0)} rb`;
  return `Rp ${n.toFixed(0)}`;
}

function fmtNum(n: number) {
  return n.toLocaleString('id-ID');
}

export default function ExportPPT({
  kpi, ads, advSpend, csDaily, dashboardCS, growth, kpiBenchmarks, bulan,
}: ExportPPTProps) {
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);

    try {
      // Lazy load pptxgenjs only on client
      const PptxGenJS = (await import('pptxgenjs')).default;
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_16x9';

      // ── THEME ───────────────────────────────────────────────────────────────
      pptx.defineSlideMaster({
        title: 'MASTER_SLIDE',
        background: { color: 'F8FAFC' },
        objects: [
          {
            rect: { x: 0, y: 0, w: '100%', h: 0.6, fill: { color: '1E40AF' } },
          },
          {
            text: {
              text: 'Business Dashboard Report',
              options: { x: 0.5, y: 0.15, w: '90%', fontSize: 14, color: 'FFFFFF', bold: true },
            },
          },
        ],
      });

      // ── SLIDE 1: COVER ──────────────────────────────────────────────────────
      const slide1 = pptx.addSlide();
      slide1.background = { color: '1E40AF' };
      slide1.addText('Business Dashboard', {
        x: 1, y: 2, w: '80%', fontSize: 44, color: 'FFFFFF', bold: true, align: 'center',
      });
      slide1.addText(`Laporan Bulan ${bulan}`, {
        x: 1, y: 3, w: '80%', fontSize: 24, color: 'BFDBFE', align: 'center',
      });
      slide1.addText(`Generated: ${new Date().toLocaleDateString('id-ID')}`, {
        x: 1, y: 4, w: '80%', fontSize: 14, color: '93C5FD', align: 'center',
      });

      // ── SLIDE 2: EXECUTIVE SUMMARY ──────────────────────────────────────────
      const slide2 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
      slide2.addText('📈 Executive Summary', { x: 0.5, y: 0.8, fontSize: 24, bold: true, color: '1E40AF' });

      const kpiTable = [
        [{ text: 'Metric', options: { bold: true, color: 'FFFFFF' } }, { text: 'Value', options: { bold: true, color: 'FFFFFF' } }],
        ['Total Omset', fmtRp(kpi.totalOmset)],
        ['Total Budget Iklan', fmtRp(kpi.totalBudget)],
        ['ROAS', `${kpi.roas.toFixed(2)}x`],
        ['Total Lead', fmtNum(kpi.totalLead)],
        ['Total Closing', fmtNum(kpi.totalClosing)],
        ['Avg Closing Rate', `${kpi.avgCR.toFixed(1)}%`],
        ['Avg CAQ', fmtRp(kpi.avgCAQ)],
        ['Evaluasi Dominan', kpi.evaluasiDominant],
      ];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      slide2.addTable(kpiTable as any, {
        x: 0.5, y: 1.5, w: 5,
        colW: [2.5, 2.5],
        fontSize: 14,
        border: { pt: 1, color: 'E2E8F0' },
        color: '1E293B',
      });

      // Growth mini chart
      if (growth.length > 0) {
        const chartData = growth.map(g => ({
          name: g.date,
          labels: [g.date],
          values: [g.omset / 1_000_000],
        }));
        slide2.addChart(PptxGenJS.ChartType.line, chartData.slice(-14), {
          x: 6, y: 1.5, w: 6.5, h: 4,
          chartColors: ['0EA5E9'],
          showValue: false,
          lineDataSymbol: 'none',
          title: 'Tren Omset (Juta Rp)',
          titleFontSize: 12,
          titleColor: '1E293B',
        });
      }

      // ── SLIDE 3: MARKETING EFFICIENCY ───────────────────────────────────────
      if (advSpend.length > 0) {
        const slide3 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
        slide3.addText('📣 Marketing Efficiency', { x: 0.5, y: 0.8, fontSize: 24, bold: true, color: '1E40AF' });

        const advMap: Record<string, { spend: number; omset: number; count: number; status: string }> = {};
        for (const a of advSpend) {
          if (!advMap[a.adv]) advMap[a.adv] = { spend: 0, omset: 0, count: 0, status: a.status };
          advMap[a.adv].spend += a.budgetAktual;
          advMap[a.adv].omset += a.omset;
          advMap[a.adv].count += 1;
        }
        const advRows = Object.entries(advMap).map(([name, d]) => [
          name, fmtRp(d.spend), fmtRp(d.omset), `${d.spend > 0 ? (d.omset / d.spend).toFixed(2) : '0.00'}x`, d.status,
        ]);

        const advTable = [
          ['Advertiser', 'Budget', 'Omset', 'ROAS', 'Status'],
          ...advRows,
        ];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        slide3.addTable(advTable as any, {
          x: 0.5, y: 1.5, w: 9,
          colW: [2, 2.5, 2.5, 1.5, 1.5],
          fontSize: 12,
          border: { pt: 1, color: 'E2E8F0' },
          color: '1E293B',
        });

        // CAQ Benchmark
        if (kpiBenchmarks.length > 0) {
          const caqData = kpiBenchmarks.filter(b => b.metric === 'CAQ').map(b => ({
            name: `${b.produk} ${b.channel}`,
            labels: ['Aktual', 'Maksimal'],
            values: [b.value / 1000, b.maksimal / 1000],
          }));
          if (caqData.length > 0) {
            slide3.addChart(PptxGenJS.ChartType.bar, caqData, {
              x: 0.5, y: 4.5, w: 9, h: 2.5,
              chartColors: ['F59E0B', '10B981'],
              showValue: true,
              title: 'CAQ Aktual vs Target (Ribu Rp)',
              titleFontSize: 11,
              titleColor: '1E293B',
            });
          }
        }
      }

      // ── SLIDE 4: PRODUCT PORTFOLIO ──────────────────────────────────────────
      if (ads.length > 0 && ads[0].products.length > 0) {
        const slide4 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
        slide4.addText('📦 Product Portfolio', { x: 0.5, y: 0.8, fontSize: 24, bold: true, color: '1E40AF' });

        const prodMap: Record<string, { budget: number; omset: number; closing: number; lead: number }> = {};
        for (const row of ads) {
          for (const p of row.products) {
            if (!p.name) continue;
            if (!prodMap[p.name]) prodMap[p.name] = { budget: 0, omset: 0, closing: 0, lead: 0 };
            prodMap[p.name].budget += p.budgetIklan;
            prodMap[p.name].omset += p.omset;
            prodMap[p.name].closing += p.closing;
            prodMap[p.name].lead += p.jumlahLead;
          }
        }
        const prodRows = Object.entries(prodMap)
          .sort((a, b) => b[1].omset - a[1].omset)
          .map(([name, d]) => [
            name, fmtRp(d.budget), fmtRp(d.omset), `${d.budget > 0 ? (d.omset / d.budget).toFixed(2) : '0.00'}x`, fmtNum(d.closing),
          ]);

        const prodTable = [
          ['Produk', 'Budget', 'Omset', 'ROAS', 'Closing'],
          ...prodRows,
        ];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        slide4.addTable(prodTable as any, {
          x: 0.5, y: 1.5, w: 9,
          colW: [2.5, 2.5, 2.5, 1.5, 1.5],
          fontSize: 12,
          border: { pt: 1, color: 'E2E8F0' },
          color: '1E293B',
        });
      }

      // ── SLIDE 5: CS PERFORMANCE ─────────────────────────────────────────────
      if (csDaily.length > 0) {
        const slide5 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
        slide5.addText('👤 CS Performance', { x: 0.5, y: 0.8, fontSize: 24, bold: true, color: '1E40AF' });

        const csMap: Record<string, { wa: number; closing: number; omset: number }> = {};
        for (const c of csDaily) {
          if (!csMap[c.cs]) csMap[c.cs] = { wa: 0, closing: 0, omset: 0 };
          csMap[c.cs].wa += c.whatsapp;
          csMap[c.cs].closing += c.closing;
          csMap[c.cs].omset += c.omset;
        }
        const csRows = Object.entries(csMap)
          .sort((a, b) => b[1].closing - a[1].closing)
          .map(([name, d]) => [
            name, fmtNum(d.wa), fmtNum(d.closing), fmtRp(d.omset), `${d.wa > 0 ? ((d.closing / d.wa) * 100).toFixed(1) : '0.0'}%`,
          ]);

        const csTable = [
          ['CS', 'WA Masuk', 'Closing', 'Omset', 'CR'],
          ...csRows.slice(0, 15),
        ];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        slide5.addTable(csTable as any, {
          x: 0.5, y: 1.5, w: 9,
          colW: [2.5, 2, 2, 2.5, 1.5],
          fontSize: 12,
          border: { pt: 1, color: 'E2E8F0' },
          color: '1E293B',
        });
      }

      // ── SLIDE 6: DASHBOARD CS SUMMARY ───────────────────────────────────────
      if (dashboardCS.length > 0) {
        const slide6 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
        slide6.addText('📊 CS Target vs Actual', { x: 0.5, y: 0.8, fontSize: 24, bold: true, color: '1E40AF' });

        const dashRows = dashboardCS
          .filter(d => d.cs && d.cs.trim())
          .map(d => [
            d.cs, d.produk, fmtNum(d.closing),
            `${d.targetCRCS > 0 ? d.targetCRCS.toFixed(0) : '-'}%`,
            `${d.crCS > 0 ? d.crCS.toFixed(1) : '-'}%`,
            d.crCS >= d.targetCRCS ? '✅ Tercapai' : d.crCS >= d.targetCRCS * 0.7 ? '⚠️ Mendekati' : '🔴 Jauh',
          ]);

        const dashTable = [
          ['CS', 'Produk', 'Closing', 'Target CR', 'Actual CR', 'Status'],
          ...dashRows.slice(0, 20),
        ];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        slide6.addTable(dashTable as any, {
          x: 0.5, y: 1.5, w: 9,
          colW: [2, 2, 1.5, 1.5, 1.5, 2],
          fontSize: 11,
          border: { pt: 1, color: 'E2E8F0' },
          color: '1E293B',
        });
      }

      // ── SLIDE 7: KEY INSIGHTS ───────────────────────────────────────────────
      const slide7 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
      slide7.addText('🎯 Key Insights & Actions', { x: 0.5, y: 0.8, fontSize: 24, bold: true, color: '1E40AF' });

      // Top performer
      const topADV = (() => {
        const map: Record<string, number> = {};
        for (const a of advSpend) { map[a.adv] = (map[a.adv] || 0) + a.omset; }
        return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
      })();

      const topProduct = (() => {
        const map: Record<string, number> = {};
        for (const row of ads) {
          for (const p of row.products) { if (p.name) map[p.name] = (map[p.name] || 0) + p.omset; }
        }
        return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
      })();

      const insights = [
        `• Total Omset: ${fmtRp(kpi.totalOmset)} dengan ROAS ${kpi.roas.toFixed(2)}x`,
        `• Total Budget Iklan: ${fmtRp(kpi.totalBudget)} | Avg CAQ: ${fmtRp(kpi.avgCAQ)}`,
        `• Total Closing: ${fmtNum(kpi.totalClosing)} dari ${fmtNum(kpi.totalLead)} lead (${kpi.avgCR.toFixed(1)}% CR)`,
        `• Advertiser Terbaik: ${topADV}`,
        `• Produk Terlaris: ${topProduct}`,
        `• Evaluasi Dominan: ${kpi.evaluasiDominant}`,
      ];

      slide7.addText(insights.join('\n\n'), {
        x: 0.5, y: 1.5, w: 9, fontSize: 14, color: '1E293B', lineSpacing: 24,
      });

      // ── SAVE ────────────────────────────────────────────────────────────────
      await pptx.writeFile({ fileName: `Business-Report-${bulan.replace(/\s+/g, '-')}.pptx` });
    } catch (err) {
      console.error('PPT generation error:', err);
      alert('Gagal membuat PPT. Pastikan browser mendukung download file.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={generate}
      disabled={generating}
      className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.97]"
    >
      {generating ? (
        <>
          <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
          Membuat PPT...
        </>
      ) : (
        <>
          <span className="text-sm">📊</span>
          Export PPT
        </>
      )}
    </button>
  );
}
