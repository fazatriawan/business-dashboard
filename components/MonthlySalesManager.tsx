'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  TrendingUp,
  ShoppingCart,
  Megaphone,
  Target,
  Calendar,
  DollarSign,
  Calculator,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface MonthlySales {
  id: string;
  monthYear: string;
  totalRevenue: number;
  totalOrders: number;
  totalAdSpend: number;
  roas: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  monthYear: string;
  totalRevenue: string;
  totalOrders: string;
  totalAdSpend: string;
  roas: string;
  notes: string;
}

function emptyForm(): FormData {
  return {
    monthYear: '',
    totalRevenue: '',
    totalOrders: '',
    totalAdSpend: '',
    roas: '',
    notes: '',
  };
}

export default function MonthlySalesManager() {
  const [items, setItems] = useState<MonthlySales[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'} | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/db/monthly-sales');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError('Gagal memuat data rekap bulanan');
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

  const openEdit = (item: MonthlySales) => {
    setEditId(item.id);
    setForm({
      monthYear: item.monthYear,
      totalRevenue: String(item.totalRevenue || 0),
      totalOrders: String(item.totalOrders || 0),
      totalAdSpend: String(item.totalAdSpend || 0),
      roas: String(item.roas || 0),
      notes: item.notes || '',
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditId(null);
    setForm(emptyForm());
  };

  const calcRoas = () => {
    const rev = parseFloat(form.totalRevenue) || 0;
    const spend = parseFloat(form.totalAdSpend) || 0;
    if (spend <= 0) return 0;
    return parseFloat((rev / spend).toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        monthYear: form.monthYear,
        totalRevenue: parseFloat(form.totalRevenue) || 0,
        totalOrders: parseInt(form.totalOrders) || 0,
        totalAdSpend: parseFloat(form.totalAdSpend) || 0,
        roas: calcRoas(),
        notes: form.notes,
      };
      const res = await fetch('/api/db/monthly-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Gagal menyimpan');
      await load();
      setToast({ msg: editId ? 'Berhasil diperbarui' : 'Berhasil disimpan', type: 'success' });
      closeForm();
    } catch {
      setToast({ msg: 'Gagal menyimpan data', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    try {
      const res = await fetch(`/api/db/monthly-sales?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      await load();
      setToast({ msg: 'Berhasil dihapus', type: 'success' });
    } catch {
      setToast({ msg: 'Gagal menghapus data', type: 'error' });
    }
  };

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const fmtNum = (n: number) => new Intl.NumberFormat('id-ID').format(n);

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Rekap Bulanan
          </h2>
          <p className="text-xs text-slate-500 mt-1">Catat omset, order, dan biaya iklan per bulan untuk tracking jangka panjang.</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Tambah Rekap
        </button>
      </div>

      {/* Form */}
      {formOpen && (
        <div className="animate-fade-in-up bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-slate-800">{editId ? 'Edit Rekap' : 'Tambah Rekap Baru'}</h3>
            <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Periode (YYYY-MM)</label>
              <input
                type="text"
                required
                placeholder="2025-01"
                pattern="\d{4}-\d{2}"
                value={form.monthYear}
                onChange={e => setForm(f => ({ ...f, monthYear: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Total Omset (Rp)</label>
              <input
                type="number"
                required
                min={0}
                value={form.totalRevenue}
                onChange={e => setForm(f => ({ ...f, totalRevenue: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Total Order</label>
              <input
                type="number"
                required
                min={0}
                value={form.totalOrders}
                onChange={e => setForm(f => ({ ...f, totalOrders: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Biaya Iklan (Rp)</label>
              <input
                type="number"
                required
                min={0}
                value={form.totalAdSpend}
                onChange={e => setForm(f => ({ ...f, totalAdSpend: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">True ROAS (auto)</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-emerald-700">
                <Calculator className="w-4 h-4 text-slate-400" />
                {calcRoas().toFixed(2)}x
              </div>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Catatan</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none"
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
      ) : items.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-sm border border-dashed border-slate-300/60 rounded-3xl p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-50 via-violet-50 to-cyan-50 border border-indigo-100/60 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-indigo-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Belum ada rekap bulanan</p>
          <p className="text-xs text-slate-500 mt-1">Klik &quot;Tambah Rekap&quot; untuk mencatat data periode pertama.</p>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Periode</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide">Omset</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide">Order</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide">Ad Spend</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide">ROAS</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Catatan</th>
                  <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, i) => (
                  <tr key={item.id} className={`hover:bg-slate-50/60 transition-colors ${i % 2 === 0 ? 'bg-white/40' : 'bg-slate-50/20'}`}>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        {item.monthYear}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                      <span className="inline-flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        {fmtMoney(item.totalRevenue)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">
                      <span className="inline-flex items-center gap-1">
                        <ShoppingCart className="w-3.5 h-3.5 text-blue-500" />
                        {fmtNum(item.totalOrders)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-amber-700">
                      <span className="inline-flex items-center gap-1">
                        <Megaphone className="w-3.5 h-3.5" />
                        {fmtMoney(item.totalAdSpend)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 font-bold ${item.roas >= 3 ? 'text-emerald-600' : item.roas >= 2 ? 'text-amber-600' : 'text-red-600'}`}>
                        <Target className="w-3.5 h-3.5" />
                        {item.roas.toFixed(2)}x
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={item.notes || ''}>{item.notes || '-'}</td>
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

      {/* Summary Cards */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-up">
          {[
            { label: 'Total Omset', value: fmtMoney(items.reduce((s, i) => s + i.totalRevenue, 0)), icon: <TrendingUp className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50 border-emerald-200/60 text-emerald-700' },
            { label: 'Total Order', value: fmtNum(items.reduce((s, i) => s + i.totalOrders, 0)), icon: <ShoppingCart className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-50 border-blue-200/60 text-blue-700' },
            { label: 'Total Ad Spend', value: fmtMoney(items.reduce((s, i) => s + i.totalAdSpend, 0)), icon: <Megaphone className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-50 border-amber-200/60 text-amber-700' },
            { label: 'Avg ROAS', value: (items.reduce((s, i) => s + i.roas, 0) / items.length).toFixed(2) + 'x', icon: <Target className="w-4 h-4 text-violet-600" />, bg: 'bg-violet-50 border-violet-200/60 text-violet-700' },
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
      )}
    </div>
  );
}
