'use client';

import { useState, useCallback } from 'react';
import {
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Settings,
  Table2,
  FileText,
  BarChart3,
  Zap,
  Copy,
} from 'lucide-react';
import { writeToSheet, appendToSheet, testConnection } from '../lib/gsheets-write';

interface GoogleSheetsWriterProps {
  kpi?: {
    totalBudget: number;
    totalLead: number;
    totalClosing: number;
    totalOmset: number;
    avgCR: number;
    avgCAQ: number;
    roas: number;
    evaluasiDominant: string;
  } | null;
  ads?: { date: string; total: { totalBudget: number; totalLead: number; totalClosing: number; totalBotol: number; cr: number; omset: number; caq: number } }[];
  csData?: { cs: string; closing: number; cr: number }[];
  bulan?: string;
}

export default function GoogleSheetsWriter({ kpi, ads, csData, bulan }: GoogleSheetsWriterProps) {
  const [url, setUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [targetSheet, setTargetSheet] = useState('Dashboard Output');
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'} | null>(null);
  const [pushing, setPushing] = useState(false);

  const showToast = useCallback((msg: string, type: 'success'|'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleTest = async () => {
    if (!url) return;
    setTesting(true);
    try {
      const ok = await testConnection(url);
      setConnected(ok);
      showToast(ok ? 'Koneksi berhasil!' : 'Koneksi gagal. Periksa URL Apps Script.', ok ? 'success' : 'error');
    } catch {
      setConnected(false);
      showToast('Koneksi gagal. Periksa URL Apps Script.', 'error');
    } finally {
      setTesting(false);
    }
  };

  const handlePushKPI = async () => {
    if (!connected || !url || !spreadsheetId || !kpi) return;
    setPushing(true);
    try {
      const values = [
        ['Business Dashboard Output', bulan || ''],
        ['Generated at', new Date().toLocaleString('id-ID')],
        [],
        ['Metric', 'Value'],
        ['Total Budget', kpi.totalBudget],
        ['Total Lead', kpi.totalLead],
        ['Total Closing', kpi.totalClosing],
        ['Total Omset', kpi.totalOmset],
        ['Avg CR', `${kpi.avgCR.toFixed(2)}%`],
        ['Avg CAQ', kpi.avgCAQ],
        ['ROAS', `${kpi.roas.toFixed(2)}x`],
        ['Evaluasi', kpi.evaluasiDominant],
      ];
      await writeToSheet(url, { spreadsheetId, sheetName: targetSheet, range: 'A1', values });
      showToast('KPI summary berhasil dikirim ke Google Sheets', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal push KPI', 'error');
    } finally {
      setPushing(false);
    }
  };

  const handlePushAds = async () => {
    if (!connected || !url || !spreadsheetId || !ads || ads.length === 0) return;
    setPushing(true);
    try {
      const values = [
        ['Date', 'Budget', 'Lead', 'Closing', 'Botol', 'CR%', 'Omset', 'CAQ'],
        ...ads.map(a => [
          a.date,
          a.total.totalBudget,
          a.total.totalLead,
          a.total.totalClosing,
          a.total.totalBotol,
          `${a.total.cr.toFixed(2)}%`,
          a.total.omset,
          a.total.caq,
        ]),
      ];
      await writeToSheet(url, { spreadsheetId, sheetName: targetSheet, range: 'A15', values });
      showToast(`${ads.length} rows ads berhasil dikirim`, 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal push ads', 'error');
    } finally {
      setPushing(false);
    }
  };

  const handlePushCS = async () => {
    if (!connected || !url || !spreadsheetId || !csData || csData.length === 0) return;
    setPushing(true);
    try {
      const values = [
        ['CS', 'Closing', 'CR%'],
        ...csData.map(c => [c.cs, c.closing, `${c.cr.toFixed(2)}%`]),
      ];
      await appendToSheet(url, { spreadsheetId, sheetName: targetSheet, values });
      showToast(`${csData.length} rows CS berhasil dikirim`, 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal push CS', 'error');
    } finally {
      setPushing(false);
    }
  };

  const handleCopyScript = () => {
    const script = `function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === 'ping') {
      return jsonResponse({ success: true, message: 'Pong' });
    }
    const ss = SpreadsheetApp.openById(data.spreadsheetId);
    const sheet = ss.getSheetByName(data.sheetName);
    if (!sheet) return jsonResponse({ success: false, message: 'Sheet not found' });
    if (data.action === 'append') {
      const lastRow = sheet.getLastRow();
      const range = sheet.getRange(lastRow + 1, 1, data.values.length, data.values[0].length);
      range.setValues(data.values);
      return jsonResponse({ success: true, message: 'Appended ' + data.values.length + ' rows' });
    }
    const range = sheet.getRange(data.range);
    range.setValues(data.values);
    return jsonResponse({ success: true, message: 'Written ' + data.values.length + ' rows' });
  } catch (err) {
    return jsonResponse({ success: false, message: err.message });
  } finally {
    lock.releaseLock();
  }
}
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}`;
    navigator.clipboard.writeText(script);
    showToast('Script disalin ke clipboard', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg animate-fade-in-up ${toast.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-indigo-600" />
          Google Sheets Writer
        </h2>
        <p className="text-xs text-slate-500 mt-1">Push data dashboard langsung ke Google Sheets via Apps Script Web App.</p>
      </div>

      {/* Setup Card */}
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-800">Setup Koneksi</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Apps Script Web App URL</label>
            <input
              type="url"
              value={url}
              onChange={e => { setUrl(e.target.value); setConnected(false); }}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Spreadsheet ID</label>
            <input
              type="text"
              value={spreadsheetId}
              onChange={e => setSpreadsheetId(e.target.value)}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Target Sheet Name</label>
            <input
              type="text"
              value={targetSheet}
              onChange={e => setTargetSheet(e.target.value)}
              placeholder="Dashboard Output"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTest}
            disabled={testing || !url}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all disabled:opacity-50"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {testing ? 'Testing…' : 'Test Koneksi'}
          </button>
          {connected && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Terhubung
            </span>
          )}
        </div>
      </div>

      {/* Quick Script */}
      <div className="bg-amber-50/80 border border-amber-200/60 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800 mb-2">Belum punya Apps Script?</p>
            <ol className="text-xs text-amber-700/80 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>Buka Google Sheets → Extensions → Apps Script</li>
              <li>Hapus code default, paste script di bawah</li>
              <li>Deploy → New deployment → Web app</li>
              <li>Execute as: Me | Access: Anyone</li>
              <li>Copy URL Web App, paste di atas</li>
            </ol>
            <button
              onClick={handleCopyScript}
              className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-amber-200 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Script ke Clipboard
            </button>
          </div>
        </div>
      </div>

      {/* Push Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Push KPI Summary', icon: <BarChart3 className="w-4 h-4" />, onClick: handlePushKPI, disabled: !connected || !kpi },
          { label: 'Push Ads Table', icon: <Table2 className="w-4 h-4" />, onClick: handlePushAds, disabled: !connected || !ads || ads.length === 0 },
          { label: 'Push CS Table', icon: <FileText className="w-4 h-4" />, onClick: handlePushCS, disabled: !connected || !csData || csData.length === 0 },
        ].map(action => (
          <button
            key={action.label}
            onClick={action.onClick}
            disabled={pushing || action.disabled}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            {pushing ? <Loader2 className="w-4 h-4 animate-spin" /> : action.icon}
            {action.label}
          </button>
        ))}
      </div>

      {/* File reference */}
      <div className="bg-slate-50/80 border border-slate-200/60 rounded-2xl px-5 py-4 text-sm text-slate-600">
        <p className="font-semibold mb-1">File lengkap:</p>
        <p className="text-xs leading-relaxed opacity-80">
          Script lengkap tersedia di <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">docs/apps-script-write.js</code>.
          Script juga tersimpan di repository untuk referensi.
        </p>
      </div>
    </div>
  );
}
