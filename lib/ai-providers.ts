// Multi-AI Provider Abstraction Layer with Auto-Fallback
// Supports: Gemini (Google), Kimi (Moonshot), Claude (Anthropic)
// Priority configured via AI_PRIORITY env var: "gemini,kimi,claude"

import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT } from './gemini-prompt';

export interface AIAnalyzeParams {
  prompt: string;
  systemInstruction?: string;
}

export interface AIProvider {
  name: string;
  analyze(params: AIAnalyzeParams): Promise<string>;
}

// ── Gemini Provider ───────────────────────────────────────────────────────────

class GeminiProvider implements AIProvider {
  name = 'gemini';
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model = 'gemini-1.5-pro') {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  async analyze({ prompt, systemInstruction }: AIAnalyzeParams): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction,
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}

// ── Kimi Provider (Moonshot) ──────────────────────────────────────────────────
// Prepared structure — activate when KIMI_API_KEY is provided

class KimiProvider implements AIProvider {
  name = 'kimi';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'moonshot-v1-8k') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async analyze({ prompt, systemInstruction }: AIAnalyzeParams): Promise<string> {
    const res = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Kimi API error: ${res.status}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }
}

// ── Claude Provider (Anthropic) ───────────────────────────────────────────────
// Prepared structure — activate when CLAUDE_API_KEY is provided

class ClaudeProvider implements AIProvider {
  name = 'claude';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'claude-3-5-sonnet-20241022') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async analyze({ prompt, systemInstruction }: AIAnalyzeParams): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        system: systemInstruction,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Claude API error: ${res.status}`);
    }

    const data = await res.json();
    return data.content?.[0]?.text || '';
  }
}

// ── Provider Factory ──────────────────────────────────────────────────────────

export function createProviders(): AIProvider[] {
  const providers: AIProvider[] = [];
  const priority = (process.env.AI_PRIORITY || 'gemini').split(',').map(s => s.trim().toLowerCase());

  for (const name of priority) {
    if (name === 'gemini' && process.env.GEMINI_API_KEY) {
      providers.push(new GeminiProvider(process.env.GEMINI_API_KEY, process.env.GEMINI_MODEL));
    }
    if (name === 'kimi' && process.env.KIMI_API_KEY) {
      providers.push(new KimiProvider(process.env.KIMI_API_KEY, process.env.KIMI_MODEL));
    }
    if (name === 'claude' && process.env.CLAUDE_API_KEY) {
      providers.push(new ClaudeProvider(process.env.CLAUDE_API_KEY, process.env.CLAUDE_MODEL));
    }
  }

  // Always fallback to gemini if no providers configured
  if (providers.length === 0 && process.env.GEMINI_API_KEY) {
    providers.push(new GeminiProvider(process.env.GEMINI_API_KEY, process.env.GEMINI_MODEL));
  }

  return providers;
}

// ── Individual Provider Exports (for Smart Router) ───────────────────────────

export async function analyzeWithGemini(data: unknown): Promise<Record<string, unknown>> {
  const providers = createProviders();
  const gemini = providers.find(p => p.name === 'gemini');
  if (!gemini) throw new Error('Gemini provider not configured');
  const text = await gemini.analyze({ prompt: JSON.stringify(data), systemInstruction: SYSTEM_PROMPT });
  return parseAIResponse(text);
}

export async function analyzeWithClaude(data: unknown): Promise<Record<string, unknown>> {
  const providers = createProviders();
  const claude = providers.find(p => p.name === 'claude');
  if (!claude) throw new Error('Claude provider not configured');
  const text = await claude.analyze({ prompt: JSON.stringify(data), systemInstruction: SYSTEM_PROMPT });
  return parseAIResponse(text);
}

export async function analyzeWithKimi(data: unknown): Promise<Record<string, unknown>> {
  const providers = createProviders();
  const kimi = providers.find(p => p.name === 'kimi');
  if (!kimi) throw new Error('Kimi provider not configured');
  const text = await kimi.analyze({ prompt: JSON.stringify(data), systemInstruction: SYSTEM_PROMPT });
  return parseAIResponse(text);
}

function parseAIResponse(text: string): Record<string, unknown> {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    return { raw_text: text };
  }
}

// ── Parallel Race (first success wins) ───────────────────────────────────────

export async function analyzeWithRace(
  providers: AIProvider[],
  params: AIAnalyzeParams,
): Promise<{ text: string; provider: string }> {
  if (providers.length === 0) throw new Error('ALL_PROVIDERS_FAILED:\nNo providers configured');
  if (providers.length === 1) return analyzeWithFallback(providers, params);

  return new Promise((resolve, reject) => {
    let settled = false;
    const errors: string[] = [];
    let remaining = providers.length;

    for (const provider of providers) {
      provider.analyze(params).then(text => {
        if (!settled) {
          settled = true;
          resolve({ text, provider: provider.name });
        }
      }).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${provider.name}: ${msg}`);
        remaining--;
        if (remaining === 0 && !settled) {
          reject(new Error(`ALL_PROVIDERS_FAILED:\n${errors.join('\n')}`));
        }
      });
    }
  });
}

// ── Sequential Fallback ───────────────────────────────────────────────────────

export async function analyzeWithFallback(
  providers: AIProvider[],
  params: AIAnalyzeParams,
): Promise<{ text: string; provider: string }> {
  const errors: string[] = [];

  for (const provider of providers) {
    try {
      const text = await provider.analyze(params);
      return { text, provider: provider.name };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${provider.name}: ${msg}`);
    }
  }

  throw new Error(`ALL_PROVIDERS_FAILED:\n${errors.join('\n')}`);
}
