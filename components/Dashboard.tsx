'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import SmartInput, { LoadConfig } from './SmartInput';
import DateFilter, { DateRange } from './DateFilter';
import KPICards from './KPICards';
import TrendChart from './TrendChart';
import DataTable from './DataTable';
import CSTable from './CSTable';
import ADVTable from './ADVTable';
import AIAnalysis from './AIAnalysis';
import ChatPanel from './ChatPanel';
import ReportFlow from './ReportFlow';
import ExportPPT from './ExportPPT';
import MorningDashboard from './MorningDashboard';
import DrillDownPanel from './DrillDownPanel';
import MonthlySalesManager from './MonthlySalesManager';
import ExportDB from './ExportDB';
import MeetingManager from './MeetingManager';
import ReturManager from './ReturManager';
import GoogleSheetsWriter from './GoogleSheetsWriter';
import AlertPanel from './AlertPanel';
import SyncSettings from './SyncSettings';
import { generateAlerts, ThresholdConfig } from '../lib/alerts';
import { fetchSheetByName } from '../lib/fetchSheet';
import { parseAdsData, calcKPI } from '../lib/parseAds';
import { parseCSIndividual } from '../lib/parseCSIndividual';
import { parseADVIndividual } from '../lib/parseADVIndividual';
import { parseTotalBiayaIklan } from '../lib/parseTotalBiayaIklan';
import { parseTotalAllCS } from '../lib/parseTotalAllCS';
import {
  AdsRow, KPISummary, CSRow, ADVRow,
  KPIBenchmark, ADVSpendRow, CSDailyRow, DashboardCSRow, GrowthRow,
} from '../lib/types';

import {
  BarChart3,
  TrendingUp,
  Users,
  Megaphone,
  Table2,
  FileText,
  Sparkles,
  Zap,
  Activity,
  Sunrise,
  Database,
  HardDrive,
  RotateCcw,
  CalendarDays,
  MessageSquare,
  ExternalLink,
  Bell,
  Settings,
  Sun,
  Moon,
  Bot,
} from 'lucide-react';

type TabKey = 'morning' | 'kpi' | 'tren' | 'cs' | 'adv' | 'tabel' | 'laporan' | 'ai' | 'chat' | 'drill' | 'rekap' | 'backup' | 'meeting' | 'retur' | 'gsheet' | 'settings';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'morning', label: 'Morning',   icon: <Sunrise className="w-4 h-4" /> },
  { key: 'kpi',     label: 'KPI',       icon: <Activity className="w-4 h-4" /> },
  { key: 'tren',    label: 'Tren',      icon: <TrendingUp className="w-4 h-4" /> },
  { key: 'cs',      label: 'CS',        icon: <Users className="w-4 h-4" /> },
  { key: 'adv',     label: 'ADV',       icon: <Megaphone className="w-4 h-4" /> },
  { key: 'tabel',   label: 'Harian',    icon: <Table2 className="w-4 h-4" /> },
  { key: 'laporan', label: 'Laporan',   icon: <FileText className="w-4 h-4" /> },
  { key: 'ai',      label: 'AI',        icon: <Sparkles className="w-4 h-4" /> },
  { key: 'chat',    label: 'Chat AI',   icon: <Bot className="w-4 h-4" /> },
  { key: 'drill',   label: 'Drill',     icon: <Database className="w-4 h-4" /> },
  { key: 'rekap',   label: 'Rekap',     icon: <CalendarDays className="w-4 h-4" /> },
  { key: 'backup',  label: 'Backup',    icon: <HardDrive className="w-4 h-4" /> },
  { key: 'meeting', label: 'Meeting',   icon: <MessageSquare className="w-4 h-4" /> },
  { key: 'retur',   label: 'Retur',     icon: <RotateCcw className="w-4 h-4" /> },
  { key: 'gsheet',  label: 'GSheet',    icon: <ExternalLink className="w-4 h-4" /> },
  { key: 'settings', label: 'Pengaturan', icon: <Settings className="w-4 h-4" /> },
];

// ── date helpers ──────────────────────────────────────────────────────────────

function parseDateIndo(d: string): Date | null {
  const m1 = d.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (m1) return new Date(`${m1[3]}-${m1[2]}-${m1[1]}T00:00:00`);
  const m2 = d.match(/(\d{1,2}),?\s+(\w+),?\s+(\d{4})/);
  if (m2) {
    const monthNames = ['januari','februari','maret','april','mei','juni','juli','agustus','september','oktober','november','desember'];
    const month = monthNames.findIndex(m => m2[2].toLowerCase().startsWith(m));
    if (month >= 0) return new Date(`${m2[3]}-${String(month + 1).padStart(2, '0')}-${String(m2[1]).padStart(2, '0')}T00:00:00`);
  }
  const iso = Date.parse(d);
  if (!isNaN(iso)) return new Date(iso);
  return null;
}

function fmtIso(d: Date): string {
  return d.toISOString().split('T')[0];
}

function inRange(dateStr: string, range: DateRange): boolean {
  if (!range) return true;
  const d = parseDateIndo(dateStr);
  if (!d) return true;
  const iso = fmtIso(d);
  return iso >= range.start && iso <= range.end;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [bulan, setBulan]       = useState('');
  const [dateRange, setDateRange] = useState<DateRange>(null);

  // Core data (raw / unfiltered)
  const [ads, setAds]           = useState<AdsRow[]>([]);
  const [kpi, setKpi]           = useState<KPISummary | null>(null);
  const [rawAds, setRawAds]     = useState<Record<string, string>[]>([]);
  const [rawCS, setRawCS]       = useState<Record<string, string>[]>([]);
  const [rawADV, setRawADV]     = useState<Record<string, string>[]>([]);
  const [csData, setCsData]     = useState<CSRow[]>([]);
  const [advData, setAdvData]   = useState<ADVRow[]>([]);

  // New data (raw / unfiltered)
  const [kpiBenchmarks]     = useState<KPIBenchmark[]>([]);
  const [advSpend, setAdvSpend]               = useState<ADVSpendRow[]>([]);
  const [csDaily, setCsDaily]                 = useState<CSDailyRow[]>([]);
  const [dashboardCS]         = useState<DashboardCSRow[]>([]);
  const [growth]                   = useState<GrowthRow[]>([]);
  const [, setRawTotalBiaya]     = useState<Record<string, string>[]>([]);
  const [, setRawTotalAllCS]     = useState<Record<string, string>[]>([]);

  const [tab, setTab]           = useState<TabKey>('morning');
  const [loaded, setLoaded]     = useState(false);
  const [bookmarks, setBookmarks] = useState<{id:string;label:string;spreadsheetId:string;sheetMap:string;createdAt:string}[]>([]);
  const [loadingCache, setLoadingCache] = useState(false);

  // Alert & sync state
  const [alertPanelOpen, setAlertPanelOpen] = useState(false);
  const [alertUnread, setAlertUnread] = useState(0);
  const [thresholds, setThresholds] = useState<ThresholdConfig>({
    alertRoasLow: 2.0,
    alertRoasHigh: 4.0,
    alertCaqHigh: 200000,
    alertCrLow: 10.0,
    alertReturRateHigh: 5.0,
  });
  const [autoSync, setAutoSync] = useState({ enabled: false, interval: 30 });
  const [lastConfig, setLastConfig] = useState<LoadConfig | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  // Auto-detect bookmarks on mount
  useEffect(() => {
    fetch('/api/db/bookmarks').then(r => r.json()).then(setBookmarks).catch(() => setBookmarks([]));
  }, []);

  // Init dark mode
  useEffect(() => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch {}
  };

  // Load settings (thresholds + auto-sync) on mount
  useEffect(() => {
    fetch('/api/db/settings')
      .then(r => r.json())
      .then(s => {
        setThresholds({
          alertRoasLow: s.alertRoasLow ?? 2.0,
          alertRoasHigh: s.alertRoasHigh ?? 4.0,
          alertCaqHigh: s.alertCaqHigh ?? 200000,
          alertCrLow: s.alertCrLow ?? 10.0,
          alertReturRateHigh: s.alertReturRateHigh ?? 5.0,
        });
        setAutoSync({
          enabled: s.autoSyncEnabled ?? false,
          interval: s.autoSyncInterval ?? 30,
        });
      })
      .catch(() => {});
  }, []);

  // Fetch unread alert count periodically
  useEffect(() => {
    const check = () => {
      fetch('/api/alerts?acknowledged=false&limit=100')
        .then(r => r.json())
        .then(data => setAlertUnread(Array.isArray(data) ? data.length : 0))
        .catch(() => {});
    };
    check();
    const iv = setInterval(check, 30000);
    return () => clearInterval(iv);
  }, []);

  // Generate alerts when KPI/data changes
  useEffect(() => {
    if (!kpi) return;
    const alerts = generateAlerts(
      { kpi, advSpend, dashboardCS, csData, advData },
      thresholds,
    );
    if (alerts.length === 0) return;
    // Deduplicate by type within last hour
    fetch('/api/alerts?limit=100')
      .then(r => r.json())
      .then((existing: { type: string; createdAt: string }[]) => {
        const hourAgo = Date.now() - 60 * 60 * 1000;
        const recentTypes = new Set(
          existing
            .filter(a => new Date(a.createdAt).getTime() > hourAgo)
            .map(a => a.type)
        );
        const newAlerts = alerts.filter(a => !recentTypes.has(a.type));
        if (newAlerts.length > 0) {
          fetch('/api/alerts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAlerts),
          });
          setAlertUnread(prev => prev + newAlerts.length);
        }
      })
      .catch(() => {});
  }, [kpi, advSpend, dashboardCS, csData, advData, thresholds]);

  const handleLoadFromCache = useCallback(async (bm: typeof bookmarks[0]) => {
    setLoadingCache(true);
    setError('');
    setBulan(bm.label);
    setDateRange(null);
    try {
      const cacheRes = await fetch(`/api/db/cache?bookmarkId=${bm.id}`);
      const cacheData = await cacheRes.json();
      if (!cacheData || cacheData.length === 0) {
        setError('Cache kosong, silakan muat ulang dari Google Sheets');
        setLoadingCache(false);
        return;
      }
      const byType = (type: string) => cacheData.find((c: Record<string, unknown>) => c.sheetType === type)?.data as Record<string, string>[] || [];

      const rawAdsLocal   = byType('ads');
      const rawSpendLocal = byType('spend');

      setRawAds(rawAdsLocal);
      const parsed = parseAdsData(rawAdsLocal);
      setAds(parsed);
      setKpi(calcKPI(parsed));

      setRawTotalBiaya(rawSpendLocal);
      setAdvSpend(parseTotalBiayaIklan(rawSpendLocal));

      setLoaded(true);
      setTab('morning');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal memuat cache');
    } finally {
      setLoadingCache(false);
    }
  }, []);

  // Filtered data based on dateRange
  const filteredAds = useMemo(() => {
    if (!dateRange) return ads;
    return ads.filter(a => inRange(a.date, dateRange));
  }, [ads, dateRange]);

  const filteredGrowth = useMemo(() => {
    if (!dateRange) return growth;
    return growth.filter(g => inRange(g.date, dateRange));
  }, [growth, dateRange]);

  const filteredCSDaily = useMemo(() => {
    if (!dateRange) return csDaily;
    return csDaily.filter(c => inRange(c.date, dateRange));
  }, [csDaily, dateRange]);

  const filteredADVSpend = useMemo(() => {
    if (!dateRange) return advSpend;
    return advSpend.filter(a => inRange(a.date, dateRange));
  }, [advSpend, dateRange]);

  const filteredKPI = useMemo(() => {
    return filteredAds.length > 0 ? calcKPI(filteredAds) : kpi;
  }, [filteredAds, kpi]);

  // Extract all dates for DateFilter
  const allDates = useMemo(() => ads.map(a => a.date), [ads]);

  const handleLoad = useCallback(async (config: LoadConfig) => {
    setLoading(true);
    setError('');
    setBulan(config.bulan);
    setDateRange(null);
    setLastConfig(config);

    try {
      const { spreadsheetId, sheetMap } = config;

      // Load ads (required)
      const raw = await fetchSheetByName(spreadsheetId, sheetMap.ads);
      setRawAds(raw);
      const parsed = parseAdsData(raw);
      setAds(parsed);
      setKpi(calcKPI(parsed));

      // Local vars to capture raw data for DB caching
      let rawSpendLocal: Record<string, string>[] = [];

      const loadOpt = async <T,>(
        type: keyof typeof sheetMap,
        parser: (r: Record<string, string>[]) => T,
        setRaw: (r: Record<string, string>[]) => void,
        setData: (d: T) => void,
        saveRaw?: (r: Record<string, string>[]) => void,
      ) => {
        const name = sheetMap[type];
        if (!name) { setRaw([]); setData([] as T); return; }
        try {
          const r = await fetchSheetByName(spreadsheetId, name);
          setRaw(r);
          if (saveRaw) saveRaw(r);
          setData(parser(r));
        } catch {
          setRaw([]);
          setData([] as T);
        }
      };

      await loadOpt('totalBiayaIklan', parseTotalBiayaIklan, setRawTotalBiaya, setAdvSpend, r => { rawSpendLocal = r; });
      await loadOpt('totalAllCS',    parseTotalAllCS,    setRawTotalAllCS, setCsDaily);

      // Load multiple CS sheets if discovered
      const extraCS = config.extraSheets?.infoCS || [];
      if (sheetMap.infoCS || extraCS.length > 0) {
        const csNames = [sheetMap.infoCS, ...extraCS].filter(Boolean) as string[];
        const allCSRows: CSRow[] = [];
        const allCSRaw: Record<string, string>[] = [];
        for (const name of csNames) {
          try {
            const r = await fetchSheetByName(spreadsheetId, name);
            allCSRaw.push(...r);
            const parsed = parseCSIndividual(r, name);
            if (parsed.cs && (parsed.closing > 0 || parsed.totalLead > 0 || parsed.botol > 0)) {
              allCSRows.push(parsed);
            }
          } catch { /* ignore */ }
        }
        setRawCS(allCSRaw);
        setCsData(allCSRows);
      } else {
        setRawCS([]);
        setCsData([]);
      }

      // Load multiple ADV sheets if discovered
      const extraADV = config.extraSheets?.infoADV || [];
      if (sheetMap.infoADV || extraADV.length > 0) {
        const advNames = [sheetMap.infoADV, ...extraADV].filter(Boolean) as string[];
        const allADVRows: ADVRow[] = [];
        const allADVRaw: Record<string, string>[] = [];
        for (const name of advNames) {
          try {
            const r = await fetchSheetByName(spreadsheetId, name);
            allADVRaw.push(...r);
            const parsed = parseADVIndividual(r, name);
            if (parsed.adv && (parsed.closing > 0 || parsed.totalLead > 0 || parsed.botol > 0)) {
              allADVRows.push(parsed);
            }
          } catch { /* ignore */ }
        }
        setRawADV(allADVRaw);
        setAdvData(allADVRows);
      } else {
        setRawADV([]);
        setAdvData([]);
      }

      // Save bookmark & cache to SQLite DB
      try {
        const bmRes = await fetch('/api/db/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: config.bulan,
            spreadsheetId,
            sheetMap: config.sheetMap,
            extraSheets: config.extraSheets,
          }),
        });
        const bm = await bmRes.json();

        // Cache fetched data
        if (bm.id) {
          const cacheData = [
            { type: 'ads', name: sheetMap.ads, data: raw },
            { type: 'spend', name: sheetMap.totalBiayaIklan, data: rawSpendLocal },
          ];
          for (const item of cacheData) {
            if (item.name && item.data && item.data.length > 0) {
              await fetch('/api/db/cache', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  bookmarkId: bm.id,
                  sheetName: item.name,
                  sheetType: item.type,
                  data: item.data,
                }),
              });
            }
          }
        }
      } catch {
        // Ignore DB errors, continue with UI
      }

      setLoaded(true);
      setTab('morning');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-sync interval (use ref to avoid dependency on handleLoad)
  const handleLoadRef = useRef(handleLoad);
  useEffect(() => { handleLoadRef.current = handleLoad; }, [handleLoad]);

  useEffect(() => {
    if (!autoSync.enabled || !lastConfig) return;
    const ms = autoSync.interval * 60 * 1000;
    const iv = setInterval(() => {
      handleLoadRef.current(lastConfig);
    }, ms);
    return () => clearInterval(iv);
  }, [autoSync.enabled, autoSync.interval, lastConfig]);

  const visibleTabs = TABS.filter(t => {
    if (t.key === 'morning') return true;
    if (t.key === 'cs')      return csDaily.length > 0;
    if (t.key === 'adv')     return advSpend.length > 0;
    if (t.key === 'laporan') return advSpend.length > 0;
    if (t.key === 'drill')   return rawAds.length > 0;
    return true;
  });

  return (
    <div className="min-h-screen">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header className="glass-strong sticky top-0 z-50 border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Brand */}
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 animate-gradient">
                  <BarChart3 className="w-5.5 h-5.5 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Business <span className="text-gradient-indigo">Dashboard</span>
                </h1>
                {bulan && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>{bulan}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-emerald-600">Live</span>
                  </p>
                )}
              </div>
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-500" />}
            </button>

            {/* Alert Bell */}
            <button
              onClick={() => setAlertPanelOpen(true)}
              className="relative p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              {alertUnread > 0 && (
                <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {alertUnread > 9 ? '9+' : alertUnread}
                </span>
              )}
            </button>

            {/* Actions & Badges */}
            {loaded && (
              <div className="flex items-center gap-3 flex-wrap">
                {filteredKPI && (
                  <ExportPPT
                    kpi={filteredKPI}
                    ads={filteredAds}
                    advSpend={filteredADVSpend}
                    csDaily={filteredCSDaily}
                    dashboardCS={dashboardCS}
                    growth={filteredGrowth}
                    kpiBenchmarks={kpiBenchmarks}
                    bulan={bulan}
                  />
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-3 py-1.5 rounded-xl">
                    <Activity className="w-3 h-3" />
                    Ads
                  </span>
                  {advSpend.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 px-3 py-1.5 rounded-xl">
                      <Zap className="w-3 h-3" />
                      {advSpend.length} Spend
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 dark:text-slate-200">
        <div className="animate-fade-in-up">
          <SmartInput onLoad={handleLoad} loading={loading} />
        </div>

        {/* ── Cache Cards ────────────────────────────────────────────────────── */}
        {!loaded && bookmarks.length > 0 && (
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-2 mb-3">
              <HardDrive className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Data Tersimpan ({bookmarks.length})</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {bookmarks.map(bm => (
                <button
                  key={bm.id}
                  onClick={() => handleLoadFromCache(bm)}
                  disabled={loadingCache}
                  className="group text-left bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-4 hover:bg-white hover:border-indigo-300/60 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{bm.label}</p>
                      <p className="text-xs text-slate-400 mt-1 font-mono">{bm.spreadsheetId.slice(0, 18)}…</p>
                    </div>
                    <div className="shrink-0 w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100/60 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                      <RotateCcw className="w-4 h-4 text-indigo-600" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {loadingCache && (
          <div className="flex items-center gap-3 text-sm text-indigo-600 font-medium animate-fade-in">
            <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            Memuat data dari cache…
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 bg-red-50/80 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/40 text-red-700 dark:text-red-400 px-5 py-4 rounded-2xl text-sm animate-scale-in backdrop-blur-sm">
            <span className="text-red-500 mt-0.5 text-lg">⚠</span>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {loaded && filteredKPI && (
          <>
            <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <DateFilter dates={allDates} onChange={setDateRange} />
            </div>

            {/* ── Tab Navigation ─────────────────────────────────────────────── */}
            <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="inline-flex items-center gap-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-1.5 shadow-sm overflow-x-auto max-w-full">
                {visibleTabs.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      tab === t.key
                        ? 'bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/80'
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Tab Content ────────────────────────────────────────────────── */}
            <div className="animate-fade-in" key={tab}>
              {tab === 'morning' && (
                <MorningDashboard
                  kpi={filteredKPI}
                  advSpend={filteredADVSpend}
                  dashboardCS={dashboardCS}
                  growth={filteredGrowth}
                  bulan={bulan}
                  onNavigate={(t) => setTab(t)}
                />
              )}
              {tab === 'kpi'     && <KPICards kpi={filteredKPI} bulan={bulan} />}
              {tab === 'tren'    && <TrendChart ads={filteredAds} />}
              {tab === 'cs'      && <CSTable rows={csData} bulan={bulan} />}
              {tab === 'adv'     && <ADVTable rows={advData} bulan={bulan} />}
              {tab === 'tabel'   && <DataTable ads={filteredAds} />}
              {tab === 'laporan' && (
                <ReportFlow
                  kpi={filteredKPI}
                  ads={filteredAds}
                  advSpend={filteredADVSpend}
                  csDaily={filteredCSDaily}
                  dashboardCS={dashboardCS}
                  growth={filteredGrowth}
                  kpiBenchmarks={kpiBenchmarks}
                  bulan={bulan}
                />
              )}
              {tab === 'ai'      && (
                <AIAnalysis
                  kpi={filteredKPI}
                  rawAds={rawAds}
                  rawCS={rawCS}
                  rawADV={rawADV}
                  csData={csData}
                  advData={advData}
                  advSpend={filteredADVSpend}
                  kpiBenchmarks={kpiBenchmarks}
                  csDaily={filteredCSDaily}
                  dashboardCS={dashboardCS}
                  growth={filteredGrowth}
                  bulan={bulan}
                />
              )}
              {tab === 'chat'    && (
                <ChatPanel kpi={filteredKPI} bulan={bulan} />
              )}
              {tab === 'drill'   && (
                <DrillDownPanel
                  rawData={[
                    { sheetName: 'Ads', type: 'ads', headers: Object.keys(rawAds[0] || {}), sampleRows: rawAds.slice(0, 5) },
                    { sheetName: 'CS', type: 'cs', headers: Object.keys(rawCS[0] || {}), sampleRows: rawCS.slice(0, 5) },
                    { sheetName: 'ADV', type: 'adv', headers: Object.keys(rawADV[0] || {}), sampleRows: rawADV.slice(0, 5) },
                  ]}
                />
              )}
              {tab === 'rekap'   && <MonthlySalesManager />}
              {tab === 'backup'  && <ExportDB />}
              {tab === 'meeting' && <MeetingManager />}
              {tab === 'retur'   && <ReturManager />}
              {tab === 'gsheet'  && (
                <GoogleSheetsWriter
                  kpi={filteredKPI}
                  ads={filteredAds}
                  csData={csData}
                  bulan={bulan}
                />
              )}
              {tab === 'settings' && <SyncSettings />}
            </div>
          </>
        )}

        {!loaded && !loading && !error && (
          <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm border border-dashed border-slate-300/60 dark:border-slate-600/40 rounded-3xl p-20 text-center animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-indigo-50 via-violet-50 to-cyan-50 dark:from-indigo-950/50 dark:via-violet-950/50 dark:to-cyan-950/50 border border-indigo-100/60 dark:border-indigo-800/30 flex items-center justify-center animate-float">
              <BarChart3 className="w-12 h-12 text-indigo-400" />
            </div>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Selamat Datang</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Masukkan link Google Sheets dan klik <span className="font-semibold text-indigo-600 dark:text-indigo-400">Deteksi Tab</span> untuk memulai analisis bisnis Anda.
            </p>
            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> KPI Tracking</span>
              <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> AI Analysis</span>
              <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Growth Reports</span>
            </div>
          </div>
        )}
      </main>

      {/* Alert Panel Drawer */}
      <AlertPanel open={alertPanelOpen} onClose={() => setAlertPanelOpen(false)} />
    </div>
  );
}
