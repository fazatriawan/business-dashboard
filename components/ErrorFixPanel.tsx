'use client';

import { useState } from 'react';
import { FixProposal, ErrorSummary } from '../lib/detectErrors';

interface ErrorFixPanelProps {
  errorSummary: ErrorSummary;
}

export default function ErrorFixPanel({ errorSummary }: ErrorFixPanelProps) {
  const [proposals, setProposals] = useState<FixProposal[]>(errorSummary.fixProposals);
  const [showCopied, setShowCopied] = useState(false);

  if (!errorSummary.adaError || proposals.length === 0) return null;

  const toggleApprove = (index: number) => {
    setProposals(prev => prev.map((p, i) => i === index ? { ...p, approved: !p.approved } : p));
  };

  const approvedCount = proposals.filter(p => p.approved).length;

  const generatePatch = () => {
    const approved = proposals.filter(p => p.approved);
    if (approved.length === 0) return '';

    const lines = [
      '# FIX PROPOSAL - Google Sheets Formula Patch',
      `# Total: ${approved.length} fix yang disetujui`,
      `# Generated: ${new Date().toLocaleString('id-ID')}`,
      '',
      '## Cara Menggunakan:',
      '1. Buka Google Sheets Anda',
      '2. Cari cell sesuai Baris & Kolom di bawah',
      '3. Ganti formula dengan saran yang diberikan',
      '4. Tekan Enter dan verifikasi hasilnya',
      '',
      '---',
      '',
    ];

    for (const p of approved) {
      lines.push(`### Cell: ${p.kolom} (Baris: ${p.baris})`);
      lines.push(`- **Error:** ${p.jenisError}`);
      lines.push(`- **Saran Formula:** \`${p.saranFormula}\``);
      lines.push(`- **Penjelasan:** ${p.penjelasan}`);
      lines.push('');
    }

    return lines.join('\n');
  };

  const copyPatch = () => {
    const patch = generatePatch();
    navigator.clipboard.writeText(patch).then(() => {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    });
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">
              🔧 Fix Proposal ({proposals.length} error)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Centang error yang ingin diperbaiki, lalu copy patch-nya ke Google Sheets.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {approvedCount > 0 && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                {approvedCount} disetujui
              </span>
            )}
            <button
              onClick={copyPatch}
              disabled={approvedCount === 0}
              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {showCopied ? '✅ Tersalin!' : '📋 Copy Patch'}
            </button>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
        {proposals.map((p, i) => (
          <div
            key={i}
            className={`px-5 py-3 flex items-start gap-3 transition-colors ${p.approved ? 'bg-green-50/50' : 'hover:bg-gray-50'}`}
          >
            <input
              type="checkbox"
              checked={p.approved}
              onChange={() => toggleApprove(i)}
              className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-red-600 font-bold text-xs bg-red-50 px-1.5 py-0.5 rounded">
                  {p.jenisError}
                </span>
                <span className="text-xs text-gray-600">
                  <strong>{p.kolom}</strong> › Baris: <strong>{p.baris}</strong>
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-1">{p.penjelasan}</p>
              <div className="mt-1.5 bg-gray-100 rounded-lg px-3 py-1.5 font-mono text-xs text-gray-800 overflow-x-auto">
                {p.saranFormula}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
