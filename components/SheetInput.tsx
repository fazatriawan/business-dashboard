'use client';

import { useState } from 'react';
import { SheetUrls } from '../lib/types';

interface SheetInputProps {
  onLoad: (urls: SheetUrls, bulan: string) => void;
  loading: boolean;
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const fields: { key: keyof SheetUrls; label: string; hint: string; required?: boolean }[] = [
  {
    key: 'dataAds',
    label: 'Laporan Harian / Total Closing All Produk',
    hint: 'Sheet utama harian — Data Ads / Advertiser',
    required: true,
  },
  {
    key: 'totalBiayaIklan',
    label: 'Total Biaya Iklan',
    hint: 'Per advertiser: Top Up, Budget Aktual, Status, Omset',
  },
  {
    key: 'totalAllCS',
    label: 'TOTAL ALL CS',
    hint: 'Harian per CS: WhatsApp masuk, Closing, Botol, Omset',
  },
];

export default function SheetInput({ onLoad, loading }: SheetInputProps) {
  const [bulan, setBulan] = useState(() => {
    const d = new Date();
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  });
  const [urls, setUrls] = useState<SheetUrls>({
    dataAds: '',
    totalBiayaIklan: '',
    totalAllCS: '',
  });
  const [open, setOpen] = useState(true);

  const set = (key: keyof SheetUrls) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setUrls(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urls.dataAds) return;
    onLoad(urls, bulan);
    setOpen(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <span className="font-semibold text-gray-800">Sumber Data Google Sheets</span>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4 border-t border-gray-100">
          <div className="pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Periode (Bulan)</label>
            <input
              type="text"
              value={bulan}
              onChange={e => setBulan(e.target.value)}
              placeholder="April 2026"
              className="w-full md:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.key} className={f.required ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {f.label}
                  {f.required && <span className="text-red-500 ml-1">*</span>}
                  <span className="text-xs text-gray-400 font-normal ml-2">{f.hint}</span>
                </label>
                <input
                  type="url"
                  value={urls[f.key]}
                  onChange={set(f.key)}
                  placeholder="https://docs.google.com/spreadsheets/d/...#gid=..."
                  required={f.required}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400">
            Salin URL tab sheet (termasuk <code>#gid=...</code>) dari address bar browser saat membuka sheet yang dimaksud.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !urls.dataAds}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Memuat data...' : 'Muat Dashboard'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Tutup
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
