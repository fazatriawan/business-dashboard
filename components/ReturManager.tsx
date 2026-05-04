'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Upload,
  Package,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  DollarSign,
  Filter,
  TrendingDown,
  BarChart3,
  RotateCcw,
} from 'lucide-react';

interface ReturItem {
  id: string;
  date: string;
  produk: string;
  cs: string | null;
  adv: string | null;
  jumlah: number;
  nilai: number;
  alasan: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  date: string;
  produk: string;
  cs: string;
  adv: string;
  jumlah: string;
  nilai: string;
  alasan: string;
  status: 'open' | 'resolved' | 'pending';
}

function emptyForm(): FormData {
  return {
    date: new Date().toISOString().split('T')[0],
    produk: '',
    cs: '',
    adv: '',
    jumlah: '',
    nilai: '',
    alasan: '',
    status: 'open',
  };
}

export default function ReturManager() {
  const [items, setItems] = useState<ReturItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'} | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'resolved' | 'pending'>('all');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<{imported:number;sample:{date:string;produk:string;jumlah:number;nilai:number;alasan:string}[]}|null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/db/retur');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError('Gagal memuat data retur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (item: ReturItem) => {
    setEditId(item.id);
    setForm({
      date: item.date,
      produk: item.produk,
      cs: item.cs || '',
      adv: item.adv || '',
      jumlah: String(item.jumlah),
      nilai: String(item.nilai),
      alasan: item.alasan || '',
      status: item.status as 'open' | 'resolved' | 'pending',
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditId(null);
    setForm(emptyForm());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        id: editId,
        date: form.date,
        produk: form.produk,
        cs: form.cs || null,
        adv: form.adv || null,
        jumlah: parseInt(form.jumlah) || 0,
        nilai: parseFloat(form.nilai) || 0,
        alasan: form.alasan || null,
        status: form.status,
      };
      const res = await fetch('/api/db/retur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Gagal menyimpan');
      await load();
      setToast({ msg: editId ? 'Retur diperbarui' : 'Retur disimpan', type: 'success' });
      closeForm();
    } catch {
      setToast({ msg: 'Gagal menyimpan retur', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data retur ini?')) return;
    try {
      const res = await fetch(`/api/db/retur?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      await load();
      setToast({ msg: 'Retur dihapus', type: 'success' });
    } catch {
      setToast({ msg: 'Gagal menghapus retur', type: 'error' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      setToast({ msg: 'File harus berekstensi .csv', type: 'error' });
      return;
    }

    setUploading(true);
    setUploadPreview(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/db/retur/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload gagal');
      setUploadPreview({ imported: data.imported, sample: data.sample });
      await load();
      setToast({ msg: `${data.imported} data retur berhasil diimpor`, type: 'success' });
    } catch (err: unknown) {
      setToast({ msg: err instanceof Error ? err.message : 'Gagal upload', type: 'error' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const filtered = items.filter(item => {
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.produk.toLowerCase().includes(q) ||
        (item.cs || '').toLowerCase().includes(q) ||
        (item.adv || '').toLowerCase().includes(q) ||
        (item.alasan || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalNilai = items.reduce((s, i) => s + i.nilai, 0);
  const totalJumlah = items.reduce((s, i) => s + i.jumlah, 0);
  const openCount = items.filter(i => i.status === 'open').length;

  // Top reasons
  const reasonCounts: Record<string, number> = {};
  items.forEach(i => {
    if (i.alasan) {
      reasonCounts[i.alasan] = (reasonCounts[i.alasan] || 0) + i.jumlah;
    }
  });
  const topReasons = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg animate-fade-in-up ${toast.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-indigo-600" />
            Data Retur
          </h2>
          <p className="text-xs text-slate-500 mt-1">Upload CSV retur atau input manual untuk tracking retur per produk, CS, dan ADV.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer">
            <Upload className="w-4 h-4" />
            Upload CSV
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Input Manual
          </button>
        </div>
      </div>

      {/* Upload preview */}
      {uploadPreview && (
        <div className="animate-fade-in-up bg-emerald-50/80 border border-emerald-200/60 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-emerald-800 text-sm font-semibold mb-2">
            <CheckCircle2 className="w-4 h-4" />
            {uploadPreview.imported} data berhasil diimpor
          </div>
          <div className="text-xs text-emerald-700/70 space-y-1">
            {uploadPreview.sample.map((s, i) => (
              <div key={i} className="font-mono bg-white/50 rounded-lg px-2 py-1">
                {s.date} | {s.produk} | {s.jumlah} pcs | Rp{s.nilai.toLocaleString('id-ID')} | {s.alasan}
              </div>
            ))}
          </div>
          <button onClick={() => setUploadPreview(null)} className="mt-2 text-xs font-semibold text-emerald-700 hover:underline">Tutup</button>
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memproses upload…
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Retur', value: String(items.length), icon: <Package className="w-4 h-4 text-indigo-600" />, bg: 'bg-indigo-50 border-indigo-200/60 text-indigo-700' },
          { label: 'Total Qty', value: String(totalJumlah), icon: <BarChart3 className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-50 border-blue-200/60 text-blue-700' },
          { label: 'Nilai Retur', value: fmtMoney(totalNilai), icon: <DollarSign className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-50 border-amber-200/60 text-amber-700' },
          { label: 'Open', value: String(openCount), icon: <TrendingDown className="w-4 h-4 text-red-600" />, bg: 'bg-red-50 border-red-200/60 text-red-700' },
        ].map(card => (
          <div key={card.label} className={`rounded-2xl border px-4 py-3.5 ${card.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              {card.icon}
              <span className="text-xs font-semibold opacity-70">{card.label}</span>
            </div>
            <p className="text-base font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Top Reasons */}
      {topReasons.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Top Alasan Retur</h4>
          <div className="flex flex-wrap gap-2">
            {topReasons.map(([reason, count]) => (
              <span key={reason} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60 px-3 py-1.5 rounded-xl">
                <AlertCircle className="w-3 h-3" />
                {reason}
                <span className="bg-rose-200/50 text-rose-800 px-1.5 py-0.5 rounded-md">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      {formOpen && (
        <div className="animate-fade-in-up bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-slate-800">{editId ? 'Edit Retur' : 'Input Retur Baru'}</h3>
            <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tanggal</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Produk</label>
              <input
                type="text"
                required
                placeholder="Nama produk"
                value={form.produk}
                onChange={e => setForm(f => ({ ...f, produk: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as 'open' | 'resolved' | 'pending' }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              >
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">CS</label>
              <input
                type="text"
                placeholder="Nama CS"
                value={form.cs}
                onChange={e => setForm(f => ({ ...f, cs: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">ADV</label>
              <input
                type="text"
                placeholder="Nama ADV"
                value={form.adv}
                onChange={e => setForm(f => ({ ...f, adv: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Jumlah</label>
              <input
                type="number"
                required
                min={0}
                value={form.jumlah}
                onChange={e => setForm(f => ({ ...f, jumlah: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nilai (Rp)</label>
              <input
                type="number"
                required
                min={0}
                value={form.nilai}
                onChange={e => setForm(f => ({ ...f, nilai: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Alasan Retur</label>
              <input
                type="text"
                placeholder="Alasan retur..."
                value={form.alasan}
                onChange={e => setForm(f => ({ ...f, alasan: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Menyimpan…' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl p-1">
          {(['all', 'open', 'pending', 'resolved'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterStatus === f ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {f === 'all' ? 'Semua' : f === 'open' ? 'Open' : f === 'pending' ? 'Pending' : 'Resolved'}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari produk, CS, ADV, alasan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat…
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-sm border border-dashed border-slate-300/60 rounded-3xl p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-50 via-violet-50 to-cyan-50 border border-indigo-100/60 flex items-center justify-center">
            <RotateCcw className="w-8 h-8 text-indigo-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Belum ada data retur</p>
          <p className="text-xs text-slate-500 mt-1">Upload CSV atau klik &quot;Input Manual&quot; untuk menambah data retur.</p>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Tanggal</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Produk</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">CS</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">ADV</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide">Jumlah</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide">Nilai</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Alasan</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item, i) => (
                  <tr key={item.id} className={`hover:bg-slate-50/60 transition-colors ${i % 2 === 0 ? 'bg-white/40' : 'bg-slate-50/20'}`}>
                    <td className="px-4 py-3 font-medium text-slate-700">{item.date}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.produk}</td>
                    <td className="px-4 py-3 text-slate-500">{item.cs || '-'}</td>
                    <td className="px-4 py-3 text-slate-500">{item.adv || '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">{item.jumlah}</td>
                    <td className="px-4 py-3 text-right font-semibold text-amber-700">{fmtMoney(item.nilai)}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={item.alasan || ''}>{item.alasan || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
                        item.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        item.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        {item.status === 'resolved' ? <CheckCircle2 className="w-3 h-3" /> : item.status === 'pending' ? <Filter className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {item.status === 'resolved' ? 'Resolved' : item.status === 'pending' ? 'Pending' : 'Open'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
