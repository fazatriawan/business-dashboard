'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Calendar,
  MessageSquare,
  Users,
  ListChecks,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Search,
  Clock,
  ClipboardList,
} from 'lucide-react';

interface MeetingNote {
  id: string;
  date: string;
  type: 'weekly' | 'monthly';
  title: string;
  attendees: string | null;
  agenda: string | null;
  decisions: string | null;
  actionItems: string | null; // JSON
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ActionItem {
  task: string;
  assignee: string;
  deadline: string;
  status: 'pending' | 'done';
}

interface FormData {
  date: string;
  type: 'weekly' | 'monthly';
  title: string;
  attendees: string;
  agenda: string;
  decisions: string;
  actionItems: ActionItem[];
  notes: string;
}

function emptyForm(): FormData {
  const today = new Date().toISOString().split('T')[0];
  return {
    date: today,
    type: 'weekly',
    title: '',
    attendees: '',
    agenda: '',
    decisions: '',
    actionItems: [],
    notes: '',
  };
}

function parseActionItems(json: string | null): ActionItem[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

export default function MeetingManager() {
  const [items, setItems] = useState<MeetingNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'} | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'weekly' | 'monthly'>('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/db/meetings');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError('Gagal memuat data meeting');
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

  const openEdit = (item: MeetingNote) => {
    setEditId(item.id);
    setForm({
      date: item.date,
      type: item.type as 'weekly' | 'monthly',
      title: item.title,
      attendees: item.attendees || '',
      agenda: item.agenda || '',
      decisions: item.decisions || '',
      actionItems: parseActionItems(item.actionItems),
      notes: item.notes || '',
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditId(null);
    setForm(emptyForm());
  };

  const addActionItem = () => {
    setForm(f => ({
      ...f,
      actionItems: [...f.actionItems, { task: '', assignee: '', deadline: '', status: 'pending' }],
    }));
  };

  const updateActionItem = (idx: number, field: keyof ActionItem, value: string) => {
    setForm(f => {
      const list = [...f.actionItems];
      list[idx] = { ...list[idx], [field]: value };
      return { ...f, actionItems: list };
    });
  };

  const removeActionItem = (idx: number) => {
    setForm(f => ({
      ...f,
      actionItems: f.actionItems.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        id: editId,
        date: form.date,
        type: form.type,
        title: form.title,
        attendees: form.attendees || null,
        agenda: form.agenda || null,
        decisions: form.decisions || null,
        actionItems: form.actionItems.length > 0 ? JSON.stringify(form.actionItems) : null,
        notes: form.notes || null,
      };
      const res = await fetch('/api/db/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Gagal menyimpan');
      await load();
      setToast({ msg: editId ? 'Meeting diperbarui' : 'Meeting disimpan', type: 'success' });
      closeForm();
    } catch {
      setToast({ msg: 'Gagal menyimpan meeting', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus meeting ini?')) return;
    try {
      const res = await fetch(`/api/db/meetings?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      await load();
      setToast({ msg: 'Meeting dihapus', type: 'success' });
    } catch {
      setToast({ msg: 'Gagal menghapus meeting', type: 'error' });
    }
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meetings-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToast({ msg: 'JSON di-export', type: 'success' });
  };

  const filtered = items.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.agenda || '').toLowerCase().includes(q) ||
        (item.attendees || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingActions = items.reduce((sum, i) => sum + parseActionItems(i.actionItems).filter(a => a.status === 'pending').length, 0);
  const thisWeek = items.filter(i => {
    const d = new Date(i.date);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }).length;

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
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            Meeting Notes
          </h2>
          <p className="text-xs text-slate-500 mt-1">Catatan rapat mingguan & bulanan untuk tracking keputusan dan action items.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Meeting Baru
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Meeting', value: String(items.length), icon: <ClipboardList className="w-4 h-4 text-indigo-600" />, bg: 'bg-indigo-50 border-indigo-200/60 text-indigo-700' },
          { label: 'Minggu Ini', value: String(thisWeek), icon: <Clock className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-50 border-blue-200/60 text-blue-700' },
          { label: 'Pending Tasks', value: String(pendingActions), icon: <ListChecks className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-50 border-amber-200/60 text-amber-700' },
          { label: 'Monthly', value: String(items.filter(i => i.type === 'monthly').length), icon: <Calendar className="w-4 h-4 text-violet-600" />, bg: 'bg-violet-50 border-violet-200/60 text-violet-700' },
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

      {/* Form */}
      {formOpen && (
        <div className="animate-fade-in-up bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-slate-800">{editId ? 'Edit Meeting' : 'Meeting Baru'}</h3>
            <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tipe</label>
                <div className="flex gap-2">
                  {(['weekly', 'monthly'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all ${form.type === t ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      {t === 'weekly' ? 'Mingguan' : 'Bulanan'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Judul</label>
                <input
                  type="text"
                  required
                  placeholder="Rapat Evaluasi Minggu 3"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Peserta</label>
                <input
                  type="text"
                  placeholder="Budi, Ani, Citra"
                  value={form.attendees}
                  onChange={e => setForm(f => ({ ...f, attendees: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Catatan Tambahan</label>
                <input
                  type="text"
                  placeholder="Opsional..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Agenda</label>
              <textarea
                rows={3}
                placeholder="1. Review KPI minggu ini..."
                value={form.agenda}
                onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Keputusan</label>
              <textarea
                rows={3}
                placeholder="Keputusan yang diambil..."
                value={form.decisions}
                onChange={e => setForm(f => ({ ...f, decisions: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none"
              />
            </div>

            {/* Action Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-600">Action Items</label>
                <button
                  type="button"
                  onClick={addActionItem}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  + Tambah Task
                </button>
              </div>
              <div className="space-y-2">
                {form.actionItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start bg-slate-50/60 border border-slate-100 rounded-xl p-3">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        placeholder="Task"
                        value={item.task}
                        onChange={e => updateActionItem(idx, 'task', e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        placeholder="Assignee"
                        value={item.assignee}
                        onChange={e => updateActionItem(idx, 'assignee', e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="date"
                        value={item.deadline}
                        onChange={e => updateActionItem(idx, 'deadline', e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <select
                        value={item.status}
                        onChange={e => updateActionItem(idx, 'status', e.target.value)}
                        className="w-full px-2 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                      >
                        <option value="pending">Pending</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeActionItem(idx)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
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
          {(['all', 'weekly', 'monthly'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterType === f ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {f === 'all' ? 'Semua' : f === 'weekly' ? 'Mingguan' : 'Bulanan'}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari judul, agenda, peserta..."
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
            <MessageSquare className="w-8 h-8 text-indigo-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Belum ada meeting</p>
          <p className="text-xs text-slate-500 mt-1">Klik &quot;Meeting Baru&quot; untuk mencatat rapat pertama.</p>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Tanggal</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Tipe</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Judul</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Peserta</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Actions</th>
                  <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item, i) => {
                  const actions = parseActionItems(item.actionItems);
                  const pending = actions.filter(a => a.status === 'pending').length;
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/60 transition-colors ${i % 2 === 0 ? 'bg-white/40' : 'bg-slate-50/20'}`}>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          {item.date}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${item.type === 'weekly' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-violet-50 text-violet-700 border border-violet-100'}`}>
                          {item.type === 'weekly' ? 'Mingguan' : 'Bulanan'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{item.title}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={item.attendees || ''}>
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {item.attendees || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {actions.length > 0 ? (
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${pending > 0 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                            <ListChecks className="w-3 h-3" />
                            {pending > 0 ? `${pending}/${actions.length} pending` : `${actions.length} done`}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
