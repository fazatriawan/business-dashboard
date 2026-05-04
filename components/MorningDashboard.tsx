'use client';

import { useState, useEffect } from 'react';
import {
  Wallet,
  Megaphone,
  Target,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  ArrowRight,
  BarChart3,
  Zap,
  Bot,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { KPISummary, ADVSpendRow, DashboardCSRow, GrowthRow } from '../lib/types';

interface MorningDashboardProps {
  kpi: KPISummary;
  advSpend: ADVSpendRow[];
  dashboardCS: DashboardCSRow[];
  growth: GrowthRow[];
  bulan: string;
  onNavigate?: (tab: 'tren' | 'cs' | 'adv' | 'laporan') => void;
}

interface BriefingItem {
  type: 'alert' | 'success' | 'warning' | 'tip';
  title: string;
  description: string;
  action?: string;
}

function fmtRp(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n.toFixed(0)}`;
}

export default function MorningDashboard({
  kpi,
  advSpend,
  dashboardCS,
  growth,
  bulan,
  onNavigate,
}: MorningDashboardProps) {
  const [briefing, setBriefing] = useState<BriefingItem[]>([]);
  const [aiBriefing, setAiBriefing] = useState<string | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefingProvider, setBriefingProvider] = useState('');
  const [briefingError, setBriefingError] = useState('');
  const [briefingExpanded, setBriefingExpanded] = useState(true);

  // Generate automated briefing from data
  useEffect(() => {
    const items: BriefingItem[] = [];

    // ROAS check
    if (kpi.roas < 2) {
      items.push({
        type: 'alert',
        title: 'ROAS Rendah',
        description: `ROAS saat ini ${kpi.roas.toFixed(2)}x. Evaluasi campaign yang tidak efisien.`,
        action: 'Cek tab ADV',
      });
    } else if (kpi.roas >= 4) {
      items.push({
        type: 'success',
        title: 'ROAS Optimal',
        description: `ROAS ${kpi.roas.toFixed(2)}x — pertimbangkan scale up budget.`,
        action: 'Cek tab ADV',
      });
    }

    // CAQ check
    if (kpi.avgCAQ > 200_000) {
      items.push({
        type: 'warning',
        title: 'Biaya Akuisisi Tinggi',
        description: `Avg CAQ ${fmtRp(kpi.avgCAQ)} — perlu optimasi targeting.`,
        action: 'Review targeting',
      });
    }

    // CS low CR
    const lowCRCS = dashboardCS.filter(c => c.crCS < 20 && c.avgLeadHarian > 5);
    if (lowCRCS.length > 0) {
      const names = lowCRCS.slice(0, 3).map(c => c.cs).join(', ');
      items.push({
        type: 'alert',
        title: 'CS Perlu Perhatian',
        description: `${names} memiliki CR rendah meski lead tinggi.`,
        action: 'Cek tab CS',
      });
    }

    // Growth trend
    if (growth.length >= 2) {
      const first = growth[0].omset;
      const last = growth[growth.length - 1].omset;
      const rate = first > 0 ? ((last - first) / first) * 100 : 0;
      if (rate < -10) {
        items.push({
          type: 'alert',
          title: 'Omset Menurun',
          description: `Penurunan ${Math.abs(rate).toFixed(1)}% dari awal periode.`,
          action: 'Analisis tren',
        });
      } else if (rate > 10) {
        items.push({
          type: 'success',
          title: 'Pertumbuhan Positif',
          description: `Kenaikan omset ${rate.toFixed(1)}% dari awal periode.`,
        });
      }
    }

    // ADV spend status
    const offAdv = advSpend.filter(a => a.status.toUpperCase() === 'OFF');
    if (offAdv.length > 0) {
      items.push({
        type: 'warning',
        title: 'Campaign OFF',
        description: `${offAdv.length} advertiser dalam status OFF.`,
        action: 'Review status',
      });
    }

    // Daily tip
    items.push({
      type: 'tip',
      title: 'Tips Hari Ini',
      description: 'Cek retur rate per produk untuk identifikasi quality issue.',
    });

    setBriefing(items);
  }, [kpi, dashboardCS, growth, advSpend]);

  async function generateAIBriefing() {
    setBriefingLoading(true);
    setBriefingError('');
    setAiBriefing(null);
    try {
      const offAdv = advSpend.filter(a => a.status.toUpperCase() === 'OFF').length;
      const lowCRCS = dashboardCS.filter(c => c.crCS < 20 && c.avgLeadHarian > 5).map(c => c.cs);
      const topAlerts = [
        kpi.roas < 2 ? `ROAS rendah: ${kpi.roas.toFixed(2)}x` : '',
        kpi.avgCAQ > 200_000 ? `CAQ tinggi: Rp${(kpi.avgCAQ / 1000).toFixed(0)}rb` : '',
        lowCRCS.length > 0 ? `CS CR rendah: ${lowCRCS.slice(0, 3).join(', ')}` : '',
        offAdv > 0 ? `${offAdv} campaign OFF` : '',
      ].filter(Boolean);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'briefing',
          messages: [{
            role: 'user',
            content: `Buat briefing harian singkat untuk eksekutif bisnis digital marketing. Berikan prioritas utama hari ini, risiko yang perlu diwaspadai, dan 2-3 rekomendasi tindakan spesifik berdasarkan data berikut.`,
          }],
          context: {
            bulan,
            kpi: {
              totalOmset: kpi.totalOmset,
              totalBudget: kpi.totalBudget,
              totalLead: kpi.totalLead,
              totalClosing: kpi.totalClosing,
              avgCR: kpi.avgCR,
              avgCAQ: kpi.avgCAQ,
              roas: kpi.roas,
              evaluasiDominant: kpi.evaluasiDominant,
            },
            topAlerts,
          },
        }),
      });

      const data = await res.json() as { message?: string; provider?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error || 'Gagal');
      setAiBriefing(data.message || '');
      setBriefingProvider(data.provider || '');
      setBriefingExpanded(true);
    } catch (err) {
      setBriefingError(err instanceof Error ? err.message : 'Gagal menghubungi AI');
    } finally {
      setBriefingLoading(false);
    }
  }

  const PROVIDER_COLORS: Record<string, string> = {
    kimi:   'bg-purple-100 text-purple-700',
    claude: 'bg-orange-100 text-orange-700',
    gemini: 'bg-blue-100 text-blue-700',
  };
  const PROVIDER_LABELS: Record<string, string> = {
    kimi: 'Kimi', claude: 'Claude', gemini: 'Gemini',
  };

  const getBriefingIcon = (type: BriefingItem['type']) => {
    switch (type) {
      case 'alert': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'tip': return <Lightbulb className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBriefingBorder = (type: BriefingItem['type']) => {
    switch (type) {
      case 'alert': return 'border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-950/20';
      case 'success': return 'border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20';
      case 'warning': return 'border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20';
      case 'tip': return 'border-blue-200 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-950/20';
    }
  };

  const growthRate = growth.length >= 2
    ? ((growth[growth.length - 1].omset - growth[0].omset) / Math.max(growth[0].omset, 1)) * 100
    : 0;

  const isPositiveGrowth = growthRate >= 0;

  return (
    <div className="space-y-6">
      {/* Hero greeting */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-medium text-indigo-200">Morning Briefing</span>
        </div>
        <h1 className="text-2xl font-bold mb-1">Selamat Pagi, Leader 👋</h1>
        <p className="text-indigo-200 text-sm">Ringkasan eksekutif untuk <span className="font-semibold text-white">{bulan}</span></p>
      </div>

      {/* Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Omset</span>
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{fmtRp(kpi.totalOmset)}</div>
          <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${isPositiveGrowth ? 'text-emerald-600' : 'text-red-500'}`}>
            {isPositiveGrowth ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(growthRate).toFixed(1)}% vs awal periode
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Budget Iklan</span>
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{fmtRp(kpi.totalBudget)}</div>
          <div className="text-xs text-slate-400 mt-1">{kpi.totalLead.toLocaleString('id-ID')} leads generated</div>
        </div>

        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Avg CAQ</span>
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{fmtRp(kpi.avgCAQ)}</div>
          <div className={`text-xs mt-1 font-medium ${kpi.avgCAQ > 200_000 ? 'text-red-500' : 'text-emerald-600'}`}>
            {kpi.avgCAQ > 200_000 ? 'Di atas target' : 'Dalam target'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">ROAS</span>
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{kpi.roas.toFixed(2)}x</div>
          <div className={`text-xs mt-1 font-medium ${kpi.roas >= 3 ? 'text-emerald-600' : kpi.roas >= 2 ? 'text-amber-600' : 'text-red-500'}`}>
            {kpi.roas >= 3 ? 'Sangat baik' : kpi.roas >= 2 ? 'Cukup' : 'Perlu perhatian'}
          </div>
        </div>
      </div>

      {/* "What should I do today?" */}
      <div>
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Apa yang Harus Saya Lakukan Hari Ini?
        </h2>
        <div className="space-y-3">
          {briefing.map((item, i) => (
            <div
              key={i}
              className={`flex items-start gap-4 p-4 rounded-2xl border ${getBriefingBorder(item.type)} transition-all hover:shadow-sm`}
            >
              <div className="shrink-0 mt-0.5">{getBriefingIcon(item.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{item.title}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{item.description}</div>
                {item.action && (
                  <button
                    onClick={() => {
                      if (item.action?.includes('ADV')) onNavigate?.('adv');
                      else if (item.action?.includes('CS')) onNavigate?.('cs');
                      else if (item.action?.includes('tren') || item.action?.includes('Tren')) onNavigate?.('tren');
                    }}
                    className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    {item.action}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Briefing (Kimi) */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-200 dark:border-purple-800/40 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">AI Briefing</span>
            {briefingProvider && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PROVIDER_COLORS[briefingProvider] || 'bg-gray-100 text-gray-600'}`}>
                {PROVIDER_LABELS[briefingProvider] || briefingProvider}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {aiBriefing && (
              <button onClick={() => setBriefingExpanded(v => !v)} className="text-slate-400 hover:text-slate-600 transition-colors">
                {briefingExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={generateAIBriefing}
              disabled={briefingLoading}
              className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 disabled:opacity-50 transition-colors bg-white dark:bg-purple-950/40 border border-purple-200 dark:border-purple-700 rounded-lg px-3 py-1.5"
            >
              {briefingLoading ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Membuat...</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5" /> {aiBriefing ? 'Refresh' : 'Generate'}</>
              )}
            </button>
          </div>
        </div>

        {briefingError && (
          <div className="px-5 pb-4 text-xs text-red-500">{briefingError}</div>
        )}

        {aiBriefing && briefingExpanded && (
          <div
            className="px-5 pb-5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap border-t border-purple-100 dark:border-purple-800/30 pt-4"
            dangerouslySetInnerHTML={{
              __html: aiBriefing
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/^- (.+)$/gm, '• $1')
                .replace(/\n/g, '<br/>'),
            }}
          />
        )}

        {!aiBriefing && !briefingLoading && !briefingError && (
          <div className="px-5 pb-4 text-xs text-slate-400 dark:text-slate-500 border-t border-purple-100 dark:border-purple-800/30 pt-3">
            Klik Generate untuk mendapatkan analisis AI personal berdasarkan data bisnis bulan ini.
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => onNavigate?.('tren')}
          className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Lihat Tren</div>
            <div className="text-xs text-slate-400 dark:text-slate-500">Analisis pertumbuhan harian</div>
          </div>
        </button>
        <button
          onClick={() => onNavigate?.('cs')}
          className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Evaluasi CS</div>
            <div className="text-xs text-slate-400 dark:text-slate-500">Performa tim customer service</div>
          </div>
        </button>
        <button
          onClick={() => onNavigate?.('adv')}
          className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Review ADV</div>
            <div className="text-xs text-slate-400 dark:text-slate-500">Efisiensi campaign iklan</div>
          </div>
        </button>
      </div>
    </div>
  );
}

function Users({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
