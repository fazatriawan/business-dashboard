'use client';

import { useState, useRef, useEffect } from 'react';
import { KPISummary } from '../lib/types';
import { Send, Bot, User, Loader2, Database, ChevronDown } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
}

interface ChatPanelProps {
  kpi: KPISummary | null;
  bulan: string;
}

const QUICK_PROMPTS = [
  'Apa yang harus saya prioritaskan hari ini?',
  'Analisis performa iklan bulan ini',
  'Evaluasi tim CS dan rekomendasi perbaikan',
  'Prediksi omset dan risiko bulan depan',
  'Bagaimana cara meningkatkan ROAS?',
  'Strategi untuk menurunkan CAQ',
];

const PROVIDER_COLORS: Record<string, string> = {
  kimi:   'bg-purple-100 text-purple-700',
  claude: 'bg-orange-100 text-orange-700',
  gemini: 'bg-blue-100 text-blue-700',
};

const PROVIDER_LABELS: Record<string, string> = {
  kimi:   'Kimi',
  claude: 'Claude',
  gemini: 'Gemini',
};

function formatMessage(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '• $1')
    .replace(/\n/g, '<br/>');
}

export default function ChatPanel({ kpi, bulan }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [withContext, setWithContext] = useState(true);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    setError('');

    const userMsg: Message = { role: 'user', content: text.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const context = withContext && kpi ? {
        bulan,
        kpi: {
          totalOmset: kpi.totalOmset,
          totalBudget: kpi.totalBudget,
          totalLead: kpi.totalLead,
          totalClosing: kpi.totalClosing,
          avgCR: kpi.avgCR,
          avgCAQ: kpi.avgCAQ,
          roas: kpi.roas,
          evaluasiDominant: kpi.evaluasiDominant,
        },
      } : undefined;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'chat',
          messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
          context,
        }),
      });

      const data = await res.json() as { message?: string; provider?: string; error?: string };

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Gagal menghubungi AI');
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message || '',
        provider: data.provider,
      }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] min-h-[500px] bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-gray-800 dark:text-gray-100">Chat AI</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Kimi · Claude · Gemini</span>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <Database className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500 dark:text-gray-400">Data bisnis</span>
          <div
            className={`w-9 h-5 rounded-full transition-colors ${withContext ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            onClick={() => setWithContext(v => !v)}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform ${withContext ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
        </label>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Bot className="w-12 h-12 text-purple-200 dark:text-purple-800 mb-3" />
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">
              Tanya apa saja tentang bisnis Anda
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {QUICK_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-xs px-3 py-1.5 rounded-full border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1.5 mb-1 ml-1">
                  <Bot className="w-3.5 h-3.5 text-purple-500" />
                  {msg.provider && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${PROVIDER_COLORS[msg.provider] || 'bg-gray-100 text-gray-600'}`}>
                      {PROVIDER_LABELS[msg.provider] || msg.provider}
                    </span>
                  )}
                </div>
              )}
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-purple-600 text-white rounded-tr-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                }`}
                dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
              />
              {msg.role === 'user' && (
                <div className="flex justify-end mt-1 mr-1">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[80%]">
              <div className="flex items-center gap-1.5 mb-1 ml-1">
                <Bot className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-xs text-gray-400">Mengetik...</span>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-2.5">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick chips (shown when there are messages) */}
      {messages.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {QUICK_PROMPTS.slice(0, 4).map(prompt => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                disabled={loading}
                className="text-xs px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-purple-300 hover:text-purple-600 disabled:opacity-40 transition-colors whitespace-nowrap"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tanya sesuatu… (Enter untuk kirim, Shift+Enter untuk baris baru)"
            rows={1}
            disabled={loading}
            className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 disabled:opacity-50 min-h-[40px] max-h-[120px]"
            style={{ height: 'auto' }}
            onInput={e => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = 'auto';
              t.style.height = Math.min(t.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        {withContext && kpi && (
          <p className="text-xs text-purple-500 dark:text-purple-400 mt-1.5 ml-1">
            Data KPI bulan {bulan} disertakan sebagai konteks
          </p>
        )}
      </div>
    </div>
  );
}
