import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  task: 'chat' | 'briefing';
  context?: {
    bulan?: string;
    kpi?: Record<string, unknown>;
    topAlerts?: string[];
  };
}

const CHAT_SYSTEM_PROMPT = `Kamu adalah asisten bisnis eksekutif untuk tim digital marketing dan penjualan.
Jawab dalam Bahasa Indonesia, singkat dan actionable.
Jika ada data bisnis yang diberikan dalam konteks, gunakan untuk mempersonalisasi jawaban.
Jangan tampilkan JSON — gunakan kalimat natural dan poin-poin singkat.
Fokus pada insight yang bisa langsung dieksekusi oleh tim.`;

const BRIEFING_SYSTEM_PROMPT = `Kamu adalah asisten briefing pagi untuk eksekutif bisnis digital marketing.
Format jawaban sebagai briefing harian yang terstruktur dalam Bahasa Indonesia.
Gunakan poin-poin singkat dan prioritaskan tindakan yang paling mendesak.
Sertakan: prioritas utama hari ini, risiko yang perlu diwaspadai, dan rekomendasi 1-2 kalimat.
Jangan tampilkan JSON.`;

type ProviderName = 'kimi' | 'claude' | 'gemini';

const PROVIDER_ORDER: Record<'chat' | 'briefing', ProviderName[]> = {
  chat:     ['kimi', 'claude', 'gemini'],
  briefing: ['kimi', 'claude', 'gemini'],
};

async function callKimi(messages: ChatMessage[], systemPrompt: string): Promise<string> {
  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) throw new Error('KIMI_API_KEY not configured');

  const model = process.env.KIMI_MODEL || 'moonshot-v1-8k';
  const res = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.5,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err.error?.message || `Kimi API error: ${res.status}`);
  }

  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content || '';
}

async function callClaude(messages: ChatMessage[], systemPrompt: string): Promise<string> {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error('CLAUDE_API_KEY not configured');

  const model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err.error?.message || `Claude API error: ${res.status}`);
  }

  const data = await res.json() as { content?: Array<{ text?: string }> };
  return data.content?.[0]?.text || '';
}

async function callGemini(messages: ChatMessage[], systemPrompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Convert messages to Gemini format
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err.error?.message || `Gemini API error: ${res.status}`);
  }

  const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

const PROVIDER_FN: Record<ProviderName, (messages: ChatMessage[], systemPrompt: string) => Promise<string>> = {
  kimi:   callKimi,
  claude: callClaude,
  gemini: callGemini,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as ChatRequest;
    const { messages, task = 'chat', context } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
    }

    const systemPrompt = task === 'briefing' ? BRIEFING_SYSTEM_PROMPT : CHAT_SYSTEM_PROMPT;
    const providers = PROVIDER_ORDER[task];

    // Inject context into the last user message if provided
    let finalMessages = [...messages];
    if (context && finalMessages.length > 0) {
      const lastIdx = finalMessages.length - 1;
      const contextStr = [
        context.bulan ? `Periode: ${context.bulan}` : '',
        context.kpi ? `Data KPI saat ini:\n${JSON.stringify(context.kpi, null, 2)}` : '',
        context.topAlerts?.length ? `Alert aktif:\n${context.topAlerts.join('\n')}` : '',
      ].filter(Boolean).join('\n\n');

      if (contextStr && finalMessages[lastIdx].role === 'user') {
        finalMessages = [
          ...finalMessages.slice(0, lastIdx),
          {
            role: 'user' as const,
            content: `[Konteks bisnis]\n${contextStr}\n\n[Pertanyaan]\n${finalMessages[lastIdx].content}`,
          },
        ];
      }
    }

    const errors: string[] = [];
    for (const provider of providers) {
      try {
        const fn = PROVIDER_FN[provider];
        const message = await fn(finalMessages, systemPrompt);
        return NextResponse.json({ message, provider, task });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${provider}: ${msg}`);
        // Continue to next provider on any error
      }
    }

    return NextResponse.json(
      { error: `Semua AI provider gagal:\n${errors.join('\n')}` },
      { status: 503 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
