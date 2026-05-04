'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getExcludedSheets,
  addExcludedSheet,
  removeExcludedSheet,
  resetToDefaults,
} from '../lib/excludedSheets';
import {
  Settings,
  RefreshCw,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Bell,
  BarChart3,
  TrendingDown,
  TrendingUp,
  Target,
  RotateCcw,
  EyeOff,
  Trash2,
  RotateCcw as ResetIcon,
} from 'lucide-react';

interface SettingsData {
  autoSyncEnabled: boolean;
  autoSyncInterval: number;
  alertRoasLow: number;
  alertRoasHigh: number;
  alertCaqHigh: number;
  alertCrLow: number;
  alertReturRateHigh: number;
  lastSyncAt: string;
}

const DEFAULT_SETTINGS: SettingsData = {
  autoSyncEnabled: false,
  autoSyncInterval: 30,
  alertRoasLow: 2.0,
  alertRoasHigh: 4.0,
  alertCaqHigh: 200000,
  alertCrLow: 10.0,
  alertReturRateHigh: 5.0,
  lastSyncAt: new Date().toISOString(),
};

export default function SyncSettings() {
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'} | null>(null);
  const [excludedSheets, setExcludedSheets] = useState<string[]>([]);
  const [newExcluded, setNewExcluded] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/db/settings');
      const data = await res.json();
      setSettings({ ...DEFAULT_SETTINGS, ...data });
    } catch {
      // keep default
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    setExcludedSheets(getExcludedSheets());
  }, []);

  useEffect(() => {
    setExcludedSheets(getExcludedSheets());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/db/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      setToast({ msg: 'Pengaturan disimpan', type: 'success' });
    } catch {
      setToast({ msg: 'Gagal menyimpan', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('id-ID');
    } catch {
      return '-';
    }
  };

  const handleAddExcluded = () => {
    if (!newExcluded.trim()) return;
    addExcludedSheet(newExcluded.trim());
    setExcludedSheets(getExcludedSheets());
    setNewExcluded('');
  };

  const handleRemoveExcluded = (name: string) => {
    removeExcludedSheet(name);
    setExcludedSheets(getExcludedSheets());
  };

  const handleResetDefaults = () => {
    resetToDefaults();
    setExcludedSheets(getExcludedSheets());
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg animate-fade-in-up ${toast.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          Pengaturan & Sinkronisasi
        </h2>
        <p className="text-xs text-slate-500 mt-1">Atur auto-sync dan threshold alert untuk monitoring otomatis.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat…
        </div>
      ) : (
        <div className="space-y-6">
          {/* Auto Sync */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">Auto-Sync</h3>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-slate-700">Sinkronisasi Otomatis</p>
                <p className="text-xs text-slate-500">Fetch data dari Google Sheets secara berkala.</p>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, autoSyncEnabled: !s.autoSyncEnabled }))}
                className={`relative w-12 h-7 rounded-full transition-colors ${settings.autoSyncEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings.autoSyncEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Interval (menit)</label>
                <select
                  value={settings.autoSyncInterval}
                  onChange={e => setSettings(s => ({ ...s, autoSyncInterval: parseInt(e.target.value) }))}
                  disabled={!settings.autoSyncEnabled}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all disabled:opacity-50"
                >
                  <option value={5}>5 menit</option>
                  <option value={10}>10 menit</option>
                  <option value={15}>15 menit</option>
                  <option value={30}>30 menit</option>
                  <option value={60}>1 jam</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Terakhir Sync</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {fmtDate(settings.lastSyncAt)}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Auto-sync hanya berjalan saat tab browser terbuka. Untuk sync manual, klik tombol refresh di header.
            </p>
          </div>

          {/* Alert Thresholds */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">Threshold Alert</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                  ROAS Rendah (x)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.alertRoasLow}
                  onChange={e => setSettings(s => ({ ...s, alertRoasLow: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  ROAS Optimal (x)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.alertRoasHigh}
                  onChange={e => setSettings(s => ({ ...s, alertRoasHigh: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-500" />
                  CAQ Tinggi (Rp)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={settings.alertCaqHigh}
                  onChange={e => setSettings(s => ({ ...s, alertCaqHigh: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                  CR Rendah (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={settings.alertCrLow}
                  onChange={e => setSettings(s => ({ ...s, alertCrLow: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                  Retur Rate Tinggi (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={settings.alertReturRateHigh}
                  onChange={e => setSettings(s => ({ ...s, alertReturRateHigh: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Excluded Sheets */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <EyeOff className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">Sheet yang Diabaikan</h3>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Sheet berikut akan otomatis disembunyikan saat mendeteksi tab Google Sheets. Berguna untuk spreadsheet yang memiliki tab tambahan yang tidak perlu dimuat.
            </p>

            {excludedSheets.length > 0 ? (
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto pr-1">
                {excludedSheets.map(name => (
                  <div key={name} className="flex items-center justify-between px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-sm text-slate-700">{name}</span>
                    <button
                      onClick={() => handleRemoveExcluded(name)}
                      className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all"
                      title="Hapus dari daftar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 mb-4">Tidak ada sheet yang diabaikan.</p>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newExcluded}
                onChange={e => setNewExcluded(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddExcluded()}
                placeholder="Nama sheet yang ingin diabaikan..."
                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              />
              <button
                onClick={handleAddExcluded}
                disabled={!newExcluded.trim()}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Tambah
              </button>
            </div>

            <button
              onClick={handleResetDefaults}
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ResetIcon className="w-3 h-3" />
              Reset ke Default
            </button>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Menyimpan…' : 'Simpan Pengaturan'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
