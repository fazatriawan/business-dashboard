'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Trash2,
  CheckCheck,
  Loader2,
  Clock,
} from 'lucide-react';

interface AlertItem {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  metric?: string;
  threshold?: string;
  acknowledged: boolean;
  createdAt: string;
}

interface AlertPanelProps {
  open: boolean;
  onClose: () => void;
}

const SEVERITY_META: Record<string, { icon: React.ReactNode; bg: string; border: string; text: string }> = {
  critical: { icon: <AlertOctagon className="w-4 h-4" />, bg: 'bg-red-50', border: 'border-red-200/60', text: 'text-red-700' },
  warning: { icon: <AlertTriangle className="w-4 h-4" />, bg: 'bg-amber-50', border: 'border-amber-200/60', text: 'text-amber-700' },
  success: { icon: <CheckCircle2 className="w-4 h-4" />, bg: 'bg-emerald-50', border: 'border-emerald-200/60', text: 'text-emerald-700' },
  info: { icon: <Info className="w-4 h-4" />, bg: 'bg-blue-50', border: 'border-blue-200/60', text: 'text-blue-700' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins}m lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}j lalu`;
  const days = Math.floor(hrs / 24);
  return `${days}h lalu`;
}

export default function AlertPanel({ open, onClose }: AlertPanelProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical' | 'warning'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/alerts?limit=50');
      const data = await res.json();
      setAlerts(Array.isArray(data) ? data : []);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const handleAck = async (id: string) => {
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, acknowledged: true }),
      });
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    } catch {
      // ignore
    }
  };

  const handleAckAll = async () => {
    try {
      await Promise.all(
        alerts.filter(a => !a.acknowledged).map(a =>
          fetch('/api/alerts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: a.id, acknowledged: true }),
          })
        )
      );
      setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })));
    } catch {
      // ignore
    }
  };

  const handleClearOld = async () => {
    if (!confirm('Hapus alert yang lebih dari 24 jam?')) return;
    try {
      await fetch('/api/alerts?olderThanHours=24', { method: 'DELETE' });
      await load();
    } catch {
      // ignore
    }
  };

  const filtered = alerts.filter(a => {
    if (filter === 'unread') return !a.acknowledged;
    if (filter === 'critical') return a.severity === 'critical';
    if (filter === 'warning') return a.severity === 'warning';
    return true;
  });

  const unreadCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-fade-in" onClick={onClose} />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200/60 dark:border-slate-700/60 shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Bell className="w-5 h-5 text-indigo-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <h2 className="text-sm font-bold text-slate-800">Notifikasi</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleAckAll}
              className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Tandai semua dibaca"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
            <button
              onClick={handleClearOld}
              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Hapus alert lama"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 px-5 py-3 border-b border-slate-100 overflow-x-auto">
          {(['all', 'unread', 'critical', 'warning'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filter === f ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {f === 'all' ? 'Semua' : f === 'unread' ? `Belum dibaca ${unreadCount > 0 ? `(${unreadCount})` : ''}` : f === 'critical' ? 'Kritis' : 'Peringatan'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-130px)] px-5 py-3 space-y-2.5">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400 text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Memuat…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                <Bell className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-500">Tidak ada notifikasi</p>
              <p className="text-xs text-slate-400 mt-1">Alert akan muncul saat metric melewati threshold.</p>
            </div>
          ) : (
            filtered.map(alert => {
              const meta = SEVERITY_META[alert.severity] || SEVERITY_META.info;
              return (
                <div
                  key={alert.id}
                  className={`relative rounded-xl border p-3.5 transition-all ${meta.bg} ${meta.border} ${alert.acknowledged ? 'opacity-60' : 'opacity-100'}`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`shrink-0 mt-0.5 ${meta.text}`}>{meta.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-xs font-bold ${meta.text}`}>{alert.title}</h4>
                        {!alert.acknowledged && (
                          <button
                            onClick={() => handleAck(alert.id)}
                            className="shrink-0 p-1 rounded-md hover:bg-white/60 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Tandai dibaca"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{alert.message}</p>
                      {(alert.metric || alert.threshold) && (
                        <div className="flex items-center gap-3 mt-2 text-[10px] font-mono">
                          {alert.metric && <span className="bg-white/60 px-1.5 py-0.5 rounded">{alert.metric}</span>}
                          {alert.threshold && <span className="text-slate-400">threshold: {alert.threshold}</span>}
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        {timeAgo(alert.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
