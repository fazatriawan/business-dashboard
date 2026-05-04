'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Download,
  Upload,
  Database,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  HardDrive,
} from 'lucide-react';

export default function ExportDB() {
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string, type: 'success'|'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/db/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `business-dashboard-${new Date().toISOString().slice(0,10)}.db`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast('Database berhasil di-download', 'success');
    } catch {
      showToast('Gagal mengekspor database', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.db')) {
      showToast('File harus berekstensi .db', 'error');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/db/import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Restore failed');
      showToast('Database berhasil di-restore. Silakan refresh halaman.', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal restore database', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg animate-fade-in-up ${toast.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-600" />
          Backup & Restore Database
        </h2>
        <p className="text-xs text-slate-500 mt-1">Ekspor file SQLite untuk backup, atau impor file .db untuk restore data.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Export Card */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100/60 flex items-center justify-center">
              <Download className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Ekspor Database</h3>
              <p className="text-xs text-slate-500">Download file SQLite (.db)</p>
            </div>
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all disabled:opacity-50"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? 'Menyiapkan…' : 'Download .db'}
          </button>
        </div>

        {/* Import Card */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100/60 flex items-center justify-center">
              <Upload className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Restore Database</h3>
              <p className="text-xs text-slate-500">Unggah file .db untuk mengganti data</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".db"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Mengunggah…' : 'Pilih File .db'}
          </button>
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 bg-amber-50/80 border border-amber-200/60 rounded-2xl px-5 py-4 text-sm text-amber-800">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-1">Peringatan</p>
          <p className="text-xs leading-relaxed opacity-80">
            Restore akan <strong>menimpa seluruh data</strong> yang ada saat ini. Pastikan Anda sudah melakukan backup sebelum restore.
            Setelah restore, <strong>refresh halaman</strong> agar perubahan diterapkan.
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl px-5 py-4 text-sm text-slate-600">
        <HardDrive className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-1">Lokasi File</p>
          <p className="text-xs leading-relaxed opacity-80">
            Database SQLite disimpan di <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">prisma/dev.db</code>.
            File ini bisa dibuka dengan DB Browser for SQLite atau Prisma Studio (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">npx prisma studio</code>).
          </p>
        </div>
      </div>
    </div>
  );
}
